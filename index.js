import { registerRootComponent } from 'expo';

import App from './App';
import { registerBackgroundRemoteMessages } from './app/Services/RemoteNotificationService';

import notifee from '@notifee/react-native';
import { handleAlarmEvent } from './app/Services/AlarmProcessor';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (
    detail.notification?.data?.kind === 'alarm' ||
    detail.notification?.data?.kind === 'alarm-invitation'
  ) {
    console.log('[index] Handling background alarm event:', type);
    await handleAlarmEvent(type, detail);
  }
});

notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Keep the service alive while the alarm is ringing
    // Notifee requires a Promise that doesn't resolve to keep it alive
  });
});

registerBackgroundRemoteMessages();
registerRootComponent(App);
