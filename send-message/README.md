# Send Message Module

A robust Expo module for sending messages via various platforms (Email, SMS, WhatsApp, Telegram) and checking for app installation on React Native applications.

## API Documentation

### `sendMail`

Composes an email with the specified recipients, subject, body, and attachments.

```typescript
import { sendMail } from 'send-message';

sendMail(
  'test@example.com, other@example.com',
  'Subject Here',
  'Body content...',
  '/path/to/attachment1.pdf,/path/to/attachment2.png',
);
```

### `sendSms`

Sends an SMS message to the specified numbers.

```typescript
import { sendSms } from 'send-message';

sendSms(['+1234567890'], 'Hello there!', '/path/to/image.png');
```

### `sendWhatsapp`

Sends a message via WhatsApp or WhatsApp Business.

```typescript
import { sendWhatsapp } from 'send-message';

// Standard WhatsApp
sendWhatsapp('1234567890', 'Hello from app', '/path/to/file', '/path/to/audio', true);

// WhatsApp Business
sendWhatsapp('1234567890', 'Hello from app', '/path/to/file', '/path/to/audio', false);
```

### `sendTelegramMessage`

Sends a message via Telegram.

```typescript
import { sendTelegramMessage } from 'send-message';

sendTelegramMessage('programmerk101', 'Hello via Telegram');
```

### `isAppInstalled`

Checks if an application package is installed on the device.

```typescript
import { isAppInstalled } from 'send-message';

const installed = await isAppInstalled('com.whatsapp');
if (installed) {
  console.log('WhatsApp is installed');
}
```
