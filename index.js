import { registerRootComponent } from 'expo';

import App from './App';
import { registerBackgroundRemoteMessages } from './app/Services/RemoteNotificationService';

registerBackgroundRemoteMessages();
registerRootComponent(App);
