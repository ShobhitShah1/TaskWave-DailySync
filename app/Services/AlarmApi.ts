import { getAuthApiBaseUrl } from '@Constants/AuthConfig';
import { authStorage } from '@Utils/authStorage';
import { apiClient, toApiError } from '@Services/ApiClient';
import { Platform } from 'react-native';
import {
  AlarmInvitation,
  AlarmLocalTime,
  AlarmPhoneContact,
  AlarmRegisteredUser,
  CreateGroupAlarmInput,
  GroupAlarmApiResponse,
  GroupAlarmRecord,
} from '@Types/Alarm';

interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

type GroupAlarmMemberDto = GroupAlarmRecord['members'][number];

interface GroupAlarmRecordDto extends Omit<GroupAlarmRecord, 'localTime' | 'members'> {
  members: GroupAlarmMemberDto[];
  timezone?: string;
  startAt?: string;
  nextOccurrenceAt?: string | null;
  lastOccurrenceAt?: string | null;
  lastDeliveredAt?: string | null;
  localTime?: AlarmLocalTime;
}

interface AlarmInvitationDto extends AlarmInvitation {
  timezone?: string;
  startAt?: string;
  nextOccurrenceAt?: string | null;
  localTime?: AlarmLocalTime;
}

type AlarmFeedResponse = ApiResponse<{
  alarms: GroupAlarmRecordDto[];
  invitations: AlarmInvitationDto[];
}>;
type GroupAlarmResponse = ApiResponse<GroupAlarmRecordDto>;
type AlarmInvitationResponse = ApiResponse<{ success: boolean; invitation: AlarmInvitationDto }>;
type RegisteredUsersResponse = ApiResponse<{ users: AlarmRegisteredUser[] }>;
type TestNotificationResponse = ApiResponse<{ success: boolean }>;
type AlarmActionResponse = ApiResponse<{
  success: boolean;
  action: 'dismiss' | 'snooze';
  snoozeUntil: string | null;
}>;

const normalizeGroupAlarm = (alarm: GroupAlarmRecordDto): GroupAlarmRecord => ({
  ...alarm,
  alarmNotes: alarm.alarmNotes || [],
  snoozeNoteIndex: alarm.snoozeNoteIndex ?? 0,
  timezone: alarm.timezone || 'UTC',
  startAt: alarm.startAt || alarm.nextOccurrenceAt || alarm.nextTriggerAt,
  nextOccurrenceAt: alarm.nextOccurrenceAt || alarm.nextTriggerAt,
  lastOccurrenceAt: alarm.lastOccurrenceAt || null,
  lastDeliveredAt: alarm.lastDeliveredAt || null,
  localTime: alarm.localTime || {
    hour: alarm.hour,
    minute: alarm.minute,
    meridiem: alarm.meridiem,
  },
});

const normalizeInvitation = (invitation: AlarmInvitationDto): AlarmInvitation => ({
  ...invitation,
});

/**
 * Check if a URI is a local device file path (not an already-uploaded server URL).
 */
const isLocalFileUri = (uri: string | null | undefined): uri is string => {
  if (!uri) return false;
  // Server URLs contain /uploads/audio/, local files are file:// or content:// or raw paths
  return !uri.includes('/uploads/audio/');
};

/**
 * Build a FormData request body for alarm create/update when an audio file
 * needs to be uploaded. The JSON payload goes in a "payload" text field and
 * the audio binary goes in an "audio" file field.
 */
const buildMultipartPayload = (input: CreateGroupAlarmInput) => {
  const formData = new FormData();
  const memoUri = input.memoUri;

  // Strip memoUri from the JSON payload — the server sets it from the uploaded file
  const jsonPayload = { ...input, memoUri: null };
  formData.append('payload', JSON.stringify(jsonPayload));

  if (memoUri) {
    const filename = memoUri.split('/').pop() || 'recording.m4a';
    const ext = filename.split('.').pop()?.toLowerCase() || 'm4a';
    const mimeMap: Record<string, string> = {
      m4a: 'audio/m4a',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      ogg: 'audio/ogg',
      webm: 'audio/webm',
      '3gp': 'audio/3gpp',
    };
    const mimeType = mimeMap[ext] || 'audio/m4a';

    formData.append('audio', {
      uri: Platform.OS === 'android' ? memoUri : memoUri.replace('file://', ''),
      name: filename,
      type: mimeType,
    } as any);
  }

  return formData;
};

export const alarmApi = {
  getAlarmFeed: async () => {
    try {
      const response = await apiClient.get<AlarmFeedResponse>('/api/alarms/feed');
      return {
        alarms: response.data.data.alarms.map(normalizeGroupAlarm),
        invitations: response.data.data.invitations.map(normalizeInvitation),
      } satisfies GroupAlarmApiResponse;
    } catch (error) {
      throw toApiError(error);
    }
  },
  createGroupAlarm: async (input: CreateGroupAlarmInput) => {
    try {
      // Use multipart when there's a local audio file to upload
      if (isLocalFileUri(input.memoUri)) {
        const formData = buildMultipartPayload(input);

        const auth = authStorage.getAuth();
        const response = await fetch(`${getAuthApiBaseUrl()}/api/alarms/group`, {
          method: 'POST',
          headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create alarm');
        }
        return normalizeGroupAlarm(data.data);
      }

      // Standard JSON request (no audio or already-uploaded audio URL)
      const response = await apiClient.post<GroupAlarmResponse>('/api/alarms/group', input);
      return normalizeGroupAlarm(response.data.data);
    } catch (error) {
      throw toApiError(error);
    }
  },
  updateGroupAlarm: async (alarmId: string, input: CreateGroupAlarmInput) => {
    try {
      // Use multipart when there's a local audio file to upload
      if (isLocalFileUri(input.memoUri)) {
        const formData = buildMultipartPayload(input);

        const auth = authStorage.getAuth();
        const response = await fetch(`${getAuthApiBaseUrl()}/api/alarms/${alarmId}`, {
          method: 'PUT',
          headers: auth?.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update alarm');
        }
        return normalizeGroupAlarm(data.data);
      }

      // Standard JSON request
      const response = await apiClient.put<GroupAlarmResponse>(`/api/alarms/${alarmId}`, input);
      return normalizeGroupAlarm(response.data.data);
    } catch (error) {
      throw toApiError(error);
    }
  },
  matchRegisteredUsers: async (contacts: AlarmPhoneContact[]) => {
    try {
      const contactNameByPhone = new Map(
        contacts.map((contact) => [contact.phoneE164, contact.name]),
      );
      const response = await apiClient.post<RegisteredUsersResponse>(
        '/api/alarms/registered-users',
        {
          phones: contacts.map((contact) => ({
            recordID: contact.recordID,
            fullName: contact.name,
            phoneCountryCode: contact.phoneCountryCode,
            phoneNumber: contact.phoneNumber,
            phoneE164: contact.phoneE164,
          })),
        },
      );

      return response.data.data.users.map((user) => ({
        ...user,
        displayName: contactNameByPhone.get(user.phoneE164) || user.fullName,
      }));
    } catch (error) {
      throw toApiError(error);
    }
  },
  respondToInvitation: async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const response = await apiClient.post<AlarmInvitationResponse>(
        `/api/alarms/invitations/${invitationId}/${action}`,
      );
      return {
        ...response.data.data,
        invitation: normalizeInvitation(response.data.data.invitation),
      };
    } catch (error) {
      throw toApiError(error);
    }
  },
  recordAlarmAction: async (
    alarmId: string,
    action: 'dismiss' | 'snooze',
    snoozeMinutes?: number,
  ) => {
    try {
      const response = await apiClient.post<AlarmActionResponse>(`/api/alarms/${alarmId}/actions`, {
        action,
        ...(typeof snoozeMinutes === 'number' ? { snoozeMinutes } : {}),
      });
      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
  sendTestNotification: async () => {
    try {
      const response = await apiClient.post<TestNotificationResponse>(
        '/api/alarms/test-notification',
      );
      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
  deleteAlarm: async (alarmId: string) => {
    try {
      await apiClient.delete(`/api/alarms/${alarmId}`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },
  leaveAlarm: async (alarmId: string) => {
    try {
      await apiClient.post(`/api/alarms/${alarmId}/leave`);
      return true;
    } catch (error) {
      throw toApiError(error);
    }
  },
};
