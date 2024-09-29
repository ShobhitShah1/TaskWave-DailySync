import { Alert, Linking, NativeModules } from "react-native";
import { Contact, Notification } from "../Types/Interface";

export const handleNotificationPress = (notification: any) => {
  try {
    const { type, message, subject, toContact, toMail, attachments } =
      notification as Notification;
    const { SendMessagesModule } = NativeModules;

    let numbers: string[] = [];
    let emailMails: string = "";
    let firstAttachment: string = "";
    const globalMessage: string = String(message) || "";
    const globalSubject: string = String(subject) || "";

    try {
      const contacts: Contact[] = JSON.parse(toContact as any);
      numbers = Array.isArray(contacts)
        ? contacts.map((contact: Contact) => contact.number)
        : [];
    } catch (error) {
      console.error("Failed to parse toContact:", error);
    }

    try {
      const emails: string[] = JSON.parse(toMail as any);
      emailMails = emails.filter((email) => email !== "").join(", ");
    } catch (error) {
      console.error("Failed to parse toMail:", error);
    }

    try {
      const parsedAttachments =
        typeof attachments === "string" ? JSON.parse(attachments) : attachments;
      if (Array.isArray(parsedAttachments) && parsedAttachments[0]) {
        firstAttachment =
          parsedAttachments[0].name || parsedAttachments[0].uri || "";
      }
    } catch (error) {
      console.error("Failed to parse attachments:", error);
    }

    const filterNumber = numbers?.[0] || "";

    switch (type) {
      case "phone":
        Linking.openURL(`tel:${filterNumber}`);
        break;
      case "whatsapp":
        if (numbers.length > 0) {
          let number =
            filterNumber.length === 10 ? `91${filterNumber}` : filterNumber;
          SendMessagesModule.sendWhatsapp(
            number,
            globalMessage,
            firstAttachment,
            true
          );
        } else {
          console.log("No valid contact found for WhatsApp.");
        }
        break;
      case "whatsappBusiness":
        if (numbers.length > 0) {
          SendMessagesModule.sendWhatsapp(
            numbers,
            globalMessage,
            firstAttachment,
            false
          );
        } else {
          console.log("No valid contact found for WhatsApp Business.");
        }
        break;
      case "SMS":
        if (numbers.length > 0) {
          console.log("SMS NUMBERS", numbers);
          SendMessagesModule.sendSms(numbers, globalMessage, firstAttachment);
        } else {
          console.log("No valid phone numbers found for SMS.");
        }
        break;
      case "gmail":
        SendMessagesModule.sendMail(
          emailMails,
          globalSubject,
          globalMessage,
          firstAttachment
        );
        break;
      default:
        console.log("Unsupported notification type.");
        break;
    }
  } catch (error: any) {
    Alert.alert("Error", String(error?.message));
  }
};
