import { Notification } from '@Types/Interface';

const NotificationMessages = {
  // Gmail / Email
  gmail: {
    titleSingle: 'Email Ready',
    titleGroup: 'Group Email Ready',
    bodies: [
      'Your email is waiting. One tap and it flies to {recipient}!',
      'Draft ready for {recipient}. Time to hit send!',
      '{recipient} is waiting for your email. Make their day!',
    ],
  },

  // WhatsApp
  whatsapp: {
    title: 'WhatsApp Time',
    bodies: [
      'Hey! {recipient} is waiting for your message.',
      "Don't leave {recipient} on read. Send that message!",
      'Your message for {recipient} is ready. Tap to send!',
      '{recipient} might be checking their phone right now...',
    ],
  },

  // SMS / Text Message
  SMS: {
    title: 'Text Message',
    bodies: [
      'Time to text {recipient}. They miss you!',
      'Your SMS is ready. {recipient} awaits!',
      'Quick text to {recipient}? Go for it!',
    ],
  },

  // Telegram
  telegram: {
    title: 'Telegram',
    bodies: [
      'Message ready for {recipient}. Send it flying!',
      "{recipient}'s Telegram is lonely. Send some love!",
      'Your Telegram message awaits. Tap to send!',
    ],
  },

  // Phone Call
  phone: {
    title: 'Time to Call',
    bodies: [
      'Ring ring! Time to call {recipient}.',
      '{recipient} would love to hear your voice.',
      'Pick up the phone. {recipient} is waiting!',
      "That call to {recipient}? Now's the time!",
    ],
  },

  // Note
  note: {
    title: 'Your Note',
    bodies: [
      "Here's that reminder you set for yourself!",
      'Past you left a note. Check it out!',
      'Note alert! You wanted to remember this.',
    ],
  },

  // Location
  location: {
    title: 'You Made It',
    bodies: [
      "You're here! Check your reminder.",
      'Welcome! You set a reminder for this place.',
      'Location reached. Time to do that thing!',
    ],
  },

  // Default
  default: {
    title: 'Reminder',
    bodies: [
      'Hey! You asked me to remind you about this.',
      'Ding! Your reminder is here.',
      "Past you said this was important. Here's your nudge!",
    ],
  },
};

interface NotificationTitleBody {
  title: string;
  body: string;
}

function pickRandom(messages: string[]): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

function format(template: string, recipient: string): string {
  return template.replace(/{recipient}/g, recipient);
}

export function getNotificationTitleAndBody(notification: Notification): NotificationTitleBody {
  const { type, subject, toContact, toMail, message } = notification;

  const messageText = message || subject || '';

  const contactNames = Array.isArray(toContact)
    ? toContact
        .map((c) => c.name)
        .filter(Boolean)
        .join(', ')
    : '';

  const mailList = Array.isArray(toMail)
    ? toMail.filter(Boolean).join(', ')
    : typeof toMail === 'string' && toMail
      ? toMail
      : '';

  const recipient = contactNames || mailList || 'your contact';
  const hasMultiple = recipient.includes(',');

  switch (type) {
    case 'gmail': {
      const config = NotificationMessages.gmail;
      const title = hasMultiple ? config.titleGroup : config.titleSingle;
      return {
        title: subject ? `${title} - ${subject}` : title,
        body: format(pickRandom(config.bodies), recipient),
      };
    }

    case 'whatsapp': {
      const config = NotificationMessages.whatsapp;
      return {
        title: `${config.title} - ${recipient}`,
        body: format(pickRandom(config.bodies), recipient),
      };
    }

    case 'SMS': {
      const config = NotificationMessages.SMS;
      return {
        title: `${config.title} - ${recipient}`,
        body: format(pickRandom(config.bodies), recipient),
      };
    }

    case 'telegram': {
      const config = NotificationMessages.telegram;
      return {
        title: `${config.title} - ${recipient}`,
        body: format(pickRandom(config.bodies), recipient),
      };
    }

    case 'phone': {
      const config = NotificationMessages.phone;
      return {
        title: `${config.title} - ${recipient}`,
        body: format(pickRandom(config.bodies), recipient),
      };
    }

    case 'note': {
      const config = NotificationMessages.note;
      return {
        title: subject ? `${config.title} - ${subject}` : config.title,
        body: messageText || pickRandom(config.bodies),
      };
    }

    case 'location': {
      const config = NotificationMessages.location;
      return {
        title: messageText ? `${config.title} - ${messageText}` : config.title,
        body: pickRandom(config.bodies),
      };
    }

    default: {
      const config = NotificationMessages.default;
      return {
        title: messageText || config.title,
        body: pickRandom(config.bodies),
      };
    }
  }
}

export { NotificationMessages };
