import { NativeModule } from 'expo';

import { SendMessageModuleEvents } from './SendMessage.types';
declare class SendMessageModule extends NativeModule<SendMessageModuleEvents> {
    PI: number;
    setValueAsync(value: string): Promise<void>;
    hello(): string;
}
declare const _default: typeof SendMessageModule;
export default _default;
//# sourceMappingURL=SendMessageModule.web.d.ts.map