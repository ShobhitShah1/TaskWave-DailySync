import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { alarmApi } from '@Services/AlarmApi';
import { AlarmPhoneContact, CreateGroupAlarmInput, CreateSoloAlarmInput } from '@Types/Alarm';
import {
  createSoloAlarm,
  deleteSoloAlarm,
  getSoloAlarmById,
  getSoloAlarms,
  updateSoloAlarm,
} from '@Utils/alarmDatabase';
import {
  clearGroupAlarmSnooze,
  pruneExpiredGroupAlarmSnoozes,
} from '@Utils/groupAlarmSnoozeStorage';

export const ALARM_QUERY_KEYS = {
  solo: ['alarms', 'solo'] as const,
  groupFeed: ['alarms', 'group-feed'] as const,
  session: (alarmId: string) => ['alarms', 'session', alarmId] as const,
};

export const useAlarmFeed = () => {
  const soloQuery = useQuery({
    queryKey: ALARM_QUERY_KEYS.solo,
    queryFn: getSoloAlarms,
  });

  const groupQuery = useQuery({
    queryKey: ALARM_QUERY_KEYS.groupFeed,
    queryFn: alarmApi.getAlarmFeed,
    staleTime: 5 * 60 * 1000, // 5 minutes stale
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  // Force re-computation of snooze overlay when queries are refetched
  // groupQuery.dataUpdatedAt changes on every refetch even if data is identical
  const groupData = useMemo(() => {
    const feed = groupQuery.data;
    if (!feed) {
      return undefined;
    }

    const snoozeMap = pruneExpiredGroupAlarmSnoozes();
    const now = Date.now();

    return {
      ...feed,
      alarms: feed.alarms.map((alarm) => {
        const snoozedUntil = snoozeMap[alarm.id];
        if (!snoozedUntil) {
          return {
            ...alarm,
            snoozedUntil: null,
          };
        }

        const snoozeTime = new Date(snoozedUntil).getTime();
        if (Number.isNaN(snoozeTime) || snoozeTime <= now) {
          clearGroupAlarmSnooze(alarm.id);
          return {
            ...alarm,
            snoozedUntil: null,
          };
        }

        return {
          ...alarm,
          status: 'snoozed' as const,
          snoozedUntil,
          nextTriggerAt: snoozedUntil,
        };
      }),
    };
  }, [groupQuery.data, groupQuery.dataUpdatedAt]);

  return {
    soloQuery,
    groupQuery: {
      ...groupQuery,
      data: groupData,
    },
  };
};

export const useCreateSoloAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'create-solo'],
    mutationFn: (input: CreateSoloAlarmInput) => createSoloAlarm(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.solo });
    },
  });
};

export const useCreateGroupAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'create-group'],
    mutationFn: (input: CreateGroupAlarmInput) => alarmApi.createGroupAlarm(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
    },
  });
};

export const useUpdateSoloAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'update-solo'],
    mutationFn: ({ alarmId, input }: { alarmId: string; input: CreateSoloAlarmInput }) =>
      updateSoloAlarm(alarmId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.solo });
    },
  });
};

export const useUpdateGroupAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'update-group'],
    mutationFn: ({ alarmId, input }: { alarmId: string; input: CreateGroupAlarmInput }) =>
      alarmApi.updateGroupAlarm(alarmId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
    },
  });
};

export const useRegisteredAlarmUsers = (enabled: boolean, contacts: AlarmPhoneContact[]) => {
  return useQuery({
    queryKey: ['alarms', 'registered-users', contacts.map((item) => item.phoneE164).join('|')],
    queryFn: () => alarmApi.matchRegisteredUsers(contacts),
    enabled: enabled && contacts.length > 0,
  });
};

export const useRespondToAlarmInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'respond-invitation'],
    mutationFn: ({
      invitationId,
      action,
    }: {
      invitationId: string;
      action: 'accept' | 'decline';
    }) => alarmApi.respondToInvitation(invitationId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
    },
  });
};

export const useTestAlarmNotification = () => {
  return useMutation({
    mutationKey: ['alarms', 'test-notification'],
    mutationFn: () => alarmApi.sendTestNotification(),
  });
};

export const useAlarmSession = (alarmId: string) => {
  return useQuery({
    queryKey: ALARM_QUERY_KEYS.session(alarmId),
    queryFn: () => alarmApi.getAlarmSession(alarmId),
    enabled: Boolean(alarmId),
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
};

export const useAddOwnerVoiceNote = (alarmId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'session', alarmId, 'owner-note'],
    mutationFn: ({ uri, recipientUserId }: { uri: string; recipientUserId: string }) =>
      alarmApi.addOwnerVoiceNote(alarmId, uri, recipientUserId),
    onSuccess: (session) => {
      queryClient.setQueryData(ALARM_QUERY_KEYS.session(alarmId), session);
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
    },
  });
};

export const useDeleteOwnerVoiceNote = (alarmId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'session', alarmId, 'delete-owner-note'],
    mutationFn: (noteId: string) => alarmApi.deleteOwnerVoiceNote(alarmId, noteId),
    onSuccess: (session) => {
      queryClient.setQueryData(ALARM_QUERY_KEYS.session(alarmId), session);
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
    },
  });
};

export const useSubmitMemberVoiceResponse = (alarmId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'session', alarmId, 'member-response'],
    mutationFn: (uri: string) => alarmApi.submitMemberVoiceResponse(alarmId, uri),
    onSuccess: (session) => {
      queryClient.setQueryData(ALARM_QUERY_KEYS.session(alarmId), session);
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
    },
  });
};

export const useDeleteAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'delete'],
    mutationFn: async ({ alarmId, mode }: { alarmId: string; mode: 'solo' | 'group' }) => {
      if (mode === 'solo') {
        return deleteSoloAlarm(alarmId);
      } else {
        return alarmApi.deleteAlarm(alarmId);
      }
    },
    onSuccess: (_, { mode }) => {
      if (mode === 'solo') {
        queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.solo });
      } else {
        queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
      }
    },
  });
};

export const useLeaveAlarm = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['alarms', 'leave'],
    mutationFn: (alarmId: string) => alarmApi.leaveAlarm(alarmId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });
    },
  });
};

export const getLocalAlarmDetails = (alarmId: string) => getSoloAlarmById(alarmId);
