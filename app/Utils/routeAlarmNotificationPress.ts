import notifee from '@notifee/react-native';
import { CommonActions } from '@react-navigation/native';

import { ALARM_QUERY_KEYS } from '@Hooks/useAlarm';
import { navigationRef } from '@Routes/RootNavigation';
import { alarmApi } from '@Services/AlarmApi';
import { appQueryClient } from '@Services/QueryClient';
import { authStorage } from '@Utils/authStorage';
import { dismissAlarmNotifications } from '@Utils/dismissAlarmNotifications';

type AlarmNotificationPressInput = {
  alarmId: string;
  event?: string;
  mode?: 'solo' | 'group';
  notificationId?: string;
};

const isSameAlarmRoute = (alarmId: string) => {
  const route = navigationRef.getCurrentRoute();
  const params = route?.params as { alarmId?: string } | undefined;

  return (
    Boolean(route) &&
    params?.alarmId === alarmId &&
    (route?.name === 'AlarmSession' ||
      route?.name === 'AlarmVoiceResponse' ||
      route?.name === 'AlarmDetails')
  );
};

const navigateWhenReady = (
  routeName: 'AlarmDetails' | 'AlarmSession' | 'AlarmVoiceResponse',
  params: object,
  attempt = 0,
) => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.navigate(routeName, params));
    return;
  }

  if (attempt < 20) {
    setTimeout(() => navigateWhenReady(routeName, params, attempt + 1), 250);
  }
};

export const routeAlarmNotificationPress = async ({
  alarmId,
  event,
  mode = 'group',
  notificationId,
}: AlarmNotificationPressInput) => {
  if (!alarmId) {
    return;
  }

  if (isSameAlarmRoute(alarmId)) {
    await dismissAlarmNotifications(alarmId, notificationId);
    return;
  }

  if (mode === 'solo') {
    await dismissAlarmNotifications(alarmId, notificationId);
    navigateWhenReady('AlarmDetails', { alarmId, mode: 'solo' });
    return;
  }

  await appQueryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.session(alarmId) });
  await appQueryClient.invalidateQueries({ queryKey: ALARM_QUERY_KEYS.groupFeed });

  try {
    const session = await alarmApi.getAlarmSession(alarmId);
    appQueryClient.setQueryData(ALARM_QUERY_KEYS.session(alarmId), session);

    await dismissAlarmNotifications(alarmId, notificationId);

    if (session.currentUserRole === 'owner') {
      navigateWhenReady('AlarmSession', { alarmId, notificationId });
      return;
    }

    const currentUserId = authStorage.getAuth()?.user?.id;
    const currentMember = session.members.find((member) => member.userId === currentUserId);
    const needsVoiceResponse =
      (event === 'member-response-required' || event === 'owner-voice-note') &&
      !currentMember?.responseMemoUri;

    if (needsVoiceResponse) {
      navigateWhenReady('AlarmVoiceResponse', { alarmId, notificationId });
      return;
    }

    navigateWhenReady('AlarmDetails', { alarmId, mode: 'group' });
  } catch {
    await notifee.cancelNotification(notificationId || alarmId).catch(() => undefined);
    navigateWhenReady('AlarmDetails', { alarmId, mode });
  }
};
