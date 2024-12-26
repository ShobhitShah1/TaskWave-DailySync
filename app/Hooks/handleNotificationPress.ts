import { Linking, NativeModules } from "react-native";
import { showMessage } from "react-native-flash-message";
import { Contact, Notification } from "../Types/Interface";

const { SendMessagesModule } = NativeModules;

const parseContacts = (toContact: any): string[] => {
  try {
    const contacts: Contact[] = JSON.parse(toContact);
    return Array.isArray(contacts)
      ? contacts.map((contact) => contact.number)
      : [];
  } catch (error: any) {
    showError(`Failed to parse toContact: ${error.message || error}`);
    return [];
  }
};

const parseEmails = (toMail: any): string => {
  try {
    const emails: string[] = JSON.parse(toMail);
    return emails.filter((email) => email !== "").join(", ");
  } catch (error: any) {
    showError(`Failed to parse toMail: ${error.message || error}`);
    return "";
  }
};

const parseAttachments = (attachments: any): string[] => {
  try {
    const parsed =
      typeof attachments === "string" ? JSON.parse(attachments) : attachments;
    return Array.isArray(parsed)
      ? parsed.map((attachment) => attachment?.uri || "")
      : [];
  } catch (error: any) {
    showError(`Failed to parse attachments: ${error.message || error}`);
    return [];
  }
};

const parseAudioMemo = (memo: any): string => {
  try {
    const parsed = typeof memo === "string" ? JSON.parse(memo) : memo;
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed[0]?.uri || ""
      : "";
  } catch {
    return "";
  }
};

const showError = (message: string) => {
  showMessage({ message, type: "danger" });
};

const notificationHandlers = {
  whatsapp: (data: Notification, isWhatsApp: boolean = true) => {
    const numbers = parseContacts(data.toContact);
    if (!numbers.length) {
      showError(
        `No valid contact found for ${
          isWhatsApp ? "WhatsApp" : "WhatsApp Business"
        }.`
      );
      return;
    }

    const attachments = parseAttachments(data.attachments);
    const audioPath = parseAudioMemo(data.memo);
    SendMessagesModule.sendWhatsapp(
      numbers.join(","),
      String(data.message),
      attachments.join(","),
      audioPath,
      isWhatsApp
    );
  },

  SMS: (data: Notification) => {
    const numbers = parseContacts(data.toContact);
    if (!numbers.length) {
      showError("No valid phone numbers found for SMS.");
      return;
    }

    const attachments = parseAttachments(data.attachments);
    SendMessagesModule.sendSms(
      numbers,
      String(data.message),
      attachments.join(",")
    );
  },

  gmail: (data: Notification) => {
    try {
      const emails = parseEmails(data.toMail);
      const attachments = parseAttachments(data.attachments);
      SendMessagesModule.sendMail(
        emails,
        String(data.subject),
        String(data.message),
        attachments.join(",")
      );
    } catch (error: any) {
      showError(error.message || String(error));
    }
  },

  phone: (data: Notification) => {
    const numbers = parseContacts(data.toContact);
    Linking.openURL(`tel:${numbers}`);
  },

  telegram: (data: Notification) => {
    const numbers = parseContacts(data.toContact);
    const recipient = data.telegramUsername || numbers[0];

    if (!recipient || !data.message) {
      showError("Invalid Telegram username or message.");
      return;
    }

    try {
      SendMessagesModule.sendTelegramMessage(recipient, data.message);
    } catch (error: any) {
      showError(error.message || String(error));
    }
  },
};

export const handleNotificationPress = (notification: any) => {
  try {
    const handler =
      notificationHandlers[
        notification.type as keyof typeof notificationHandlers
      ];
    if (handler) {
      handler(notification as Notification);
    } else {
      showError("Unsupported notification type.");
    }
  } catch (error: any) {
    showError(error.message || String(error));
  }
};
