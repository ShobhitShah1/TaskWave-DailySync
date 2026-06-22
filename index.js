import { registerRootComponent } from 'expo';

import App from './App';
import { registerBackgroundRemoteMessages } from './app/Services/RemoteNotificationService';

import notifee from '@notifee/react-native';

notifee.registerForegroundService(() => {
  return new Promise(() => {
    // Keep the service alive while the alarm is ringing
    // Notifee requires a Promise that doesn't resolve to keep it alive
  });
});

registerBackgroundRemoteMessages();
registerRootComponent(App);
