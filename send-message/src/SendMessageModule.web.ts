import { NativeModule, registerWebModule } from 'expo';

import { SendMessageModuleEvents } from './SendMessage.types';

class SendMessageModule extends NativeModule<SendMessageModuleEvents> {
  PI = Math.PI;
  async setValueAsync(value: string): Promise<void> {
    this.emit('onChange', { value });
  }
  hello() {
    return 'Hello world! 👋';
  }
}

export default registerWebModule(SendMessageModule, 'SendMessageModule');
