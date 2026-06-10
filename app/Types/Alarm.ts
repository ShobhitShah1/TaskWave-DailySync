export type AlarmMode = 'solo' | 'group';
export type AlarmMeridiem = 'AM' | 'PM';
export type AlarmRepeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type AlarmFilter = 'all' | 'invites' | 'current' | 'snooze' | 'upcoming';
export type AlarmInviteStatus = 'pending' | 'accepted' | 'declined';
export type AlarmDeliveryStatus = 'scheduled' | 'snoozed' | 'completed';

export interface AlarmLocalTime {
  hour: number;
  minute: number;
  meridiem: AlarmMeridiem;
}

export interface AlarmPhoneContact {
  recordID: string;
  name: string;
  number: string;
  phoneCountryCode: string;
  phoneNumber: string;
  phoneE164: string;
  thumbnailPath?: string;
}

export interface AlarmRegisteredUser {
  userId: string;
  fullName: string;
  displayName?: string;
  avatar: string | null;
  phoneCountryCode: string;
  phoneNumber: string;
  phoneE164: string;
  timezone: string;
  isRegistered: true;
}

export interface AlarmMemo {
  userId: string;
  uri: string;
  createdAt: string;
}

export interface AlarmSessionVoiceNote {
  id: string;
  uri: string;
  recipientUserId: string;
  createdAt: string;
}

export interface AlarmSessionMember {
  userId: string;
  fullName: string;
  avatar: string | null;
  inviteStatus: AlarmInviteStatus;
  awakeAt: string | null;
  dismissedAt: string | null;
  responseMemoUri: string | null;
  respondedAt: string | null;
}

export interface AlarmSession {
  alarmId: string;
  deliveryId: string;
  title: string;
  note: string;
  scheduledFor: string;
  ownerUserId: string;
  currentUserRole: 'owner' | 'member';
  mainMemoUri: string | null;
  ownerVoiceNotes: AlarmSessionVoiceNote[];
  members: AlarmSessionMember[];
}

export interface BaseAlarmRecord {
  id: string;
  mode: AlarmMode;
  title: string;
  note: string;
  hour: number;
  minute: number;
  meridiem: AlarmMeridiem;
  tone: string;
  alarmNotes: string[];
  snoozeNoteIndex: number;
  bufferMinutes: number;
  repeat: AlarmRepeat;
  repeatDays: string[];
  nextTriggerAt: string;
  createdAt: string;
  updatedAt: string;
  status: AlarmDeliveryStatus;
  memoUri: string | null;
  memos?: AlarmMemo[];
  vibrate?: boolean;
  timezone?: string;
  startAt?: string;
  snoozedUntil?: string | null;
  nextOccurrenceAt?: string | null;
  lastOccurrenceAt?: string | null;
  lastDeliveredAt?: string | null;
  localTime?: AlarmLocalTime;
}

export interface SoloAlarmRecord extends BaseAlarmRecord {
  mode: 'solo';
  vibrate: boolean;
  localNotificationId: string | null;
}

export interface GroupAlarmMember {
  userId: string;
  fullName: string;
  avatar: string | null;
  phoneCountryCode: string;
  phoneNumber: string;
  phoneE164: string;
  inviteStatus: AlarmInviteStatus;
  invitedAt: string;
  respondedAt: string | null;
}

export interface GroupAlarmRecord extends BaseAlarmRecord {
  mode: 'group';
  ownerUserId: string;
  members: GroupAlarmMember[];
  invitees?: GroupAlarmMember[];
  inviteSummary: {
    accepted: number;
    pending: number;
    declined: number;
  };
}

export type AlarmRecord = SoloAlarmRecord | GroupAlarmRecord;

export interface AlarmInvitation {
  id: string;
  alarmId: string;
  inviterName: string;
  inviteeUserId: string;
  title: string;
  note: string;
  scheduledFor: string;
  hour: number;
  minute: number;
  meridiem: AlarmMeridiem;
  repeat: AlarmRepeat;
  repeatDays: string[];
  tone: string;
  bufferMinutes: number;
  inviteStatus: AlarmInviteStatus;
  createdAt: string;
}

export interface CreateSoloAlarmInput {
  title: string;
  note: string;
  hour: number;
  minute: number;
  meridiem: AlarmMeridiem;
  tone: string;
  alarmNotes: string[];
  snoozeNoteIndex?: number;
  vibrate: boolean;
  bufferMinutes: number;
  repeat: AlarmRepeat;
  repeatDays: string[];
}

export interface CreateGroupAlarmInput {
  title: string;
  note: string;
  startDate: string;
  hour: number;
  minute: number;
  meridiem: AlarmMeridiem;
  tone: string;
  alarmNotes: string[];
  snoozeNoteIndex?: number;
  bufferMinutes: number;
  repeat: AlarmRepeat;
  repeatDays: string[];
  members: AlarmRegisteredUser[];
  memoUri: string | null;
  vibrate?: boolean;
}

export interface GroupAlarmApiResponse {
  alarms: GroupAlarmRecord[];
  invitations: AlarmInvitation[];
}
