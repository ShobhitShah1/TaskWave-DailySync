import { Notification } from '../Types/Interface';

interface NotificationTitleBody {
  title: string;
  body: string;
}

export function getNotificationTitleAndBody(notification: Notification): NotificationTitleBody {
  const { type, subject, toContact, toMail, message } = notification;

  const messageToSend = message || subject;

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

  const recipients = contactNames || mailList || 'recipient';
  const hasMultipleRecipients = recipients.includes(',');

  switch (type) {
    case 'gmail':
      return {
        title: hasMultipleRecipients
          ? `✉️ Group Email • ${subject || 'Draft Message'}`
          : `✉️ Email Draft • ${subject || 'Untitled'}`,
        body: `Your message is ready for ${recipients}. ${hasMultipleRecipients ? 'Review recipients and' : 'Review and'} hit send when you're ready to connect.`,
      };

    case 'whatsapp':
      return {
        title: `💬 WhatsApp • ${contactNames || 'Contact'}`,
        body: `${messageToSend ? `"${messageToSend}" - ` : ''}Your message is waiting to be sent. Open WhatsApp to continue your conversation.`,
      };

    case 'SMS':
      return {
        title: `💬 Text Message • ${contactNames || 'Contact'}`,
        body: `${messageToSend ? `About "${messageToSend}" - ` : ''}Your SMS is ready to go. One tap to send your message and stay connected.`,
      };

    case 'telegram':
      return {
        title: `💬 Telegram • ${contactNames || 'Contact'}`,
        body: `${messageToSend ? `Re: "${messageToSend}" - ` : ''}Your message is prepared and waiting. Launch Telegram to send it instantly.`,
      };

    case 'phone':
      return {
        title: `📞 Call • ${contactNames || 'Contact'}`,
        body: `${messageToSend ? `Discussion: "${messageToSend}" - ` : ''}Time to connect with a voice call. Tap to dial and have that important conversation.`,
      };

    case 'note':
      return {
        title: `📋 Note Saved • ${subject || 'Quick Thought'}`,
        body: `${messageToSend ? `"${messageToSend}" - ` : ''}Your brilliant idea is now safely captured. Open Note Alo to review, edit, or share your thoughts.`,
      };

    default:
      return {
        title: `🔔 Action Required • ${messageToSend || 'Task'}`,
        body: `${recipients ? `Connect with ${recipients} - ` : ''}Your reminder is here. Time to take action and move things forward.`,
      };
  }
}
