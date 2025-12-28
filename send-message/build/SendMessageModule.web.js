import { NativeModule,registerWebModule } from 'expo';
class SendMessageModule extends NativeModule {
    PI = Math.PI;
    async setValueAsync(value) {
        this.emit('onChange', { value });
    }
    hello() {
        return 'Hello world! 👋';
    }
}
export default registerWebModule(SendMessageModule, 'SendMessageModule');
//# sourceMappingURL=SendMessageModule.web.js.map