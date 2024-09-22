import { Alert, Linking, NativeModules } from "react-native";
import { Contact, Notification } from "../Types/Interface";

export const handelNotificationPress = (notification: any) => {
  try {
    const { type, message, date, subject, toContact, toMail, attachments } =
      notification as Notification;

    const { SendMessagesModule } = NativeModules;

    let numbers: string[] = [];
    try {
      const contacts: Contact[] = JSON.parse(toContact as any);
      if (Array.isArray(contacts)) {
        numbers = contacts.map((contact: Contact) => contact.number);
      }
    } catch (error) {
      console.error("Failed to parse toContact:", error);
    }

    let emailMails: string = "";
    try {
      const emails: string[] = JSON.parse(toMail as any);
      emailMails = emails.filter((email) => email !== "").join(", ");
    } catch (error) {
      console.error("Failed to parse toMail:", error);
    }

    const filterNumber = Array.isArray(numbers) ? numbers?.[0] : numbers;

    switch (type) {
      case "phone":
        Linking.openURL(`tel:${filterNumber}`);
        break;
      case "whatsapp":
        if (numbers.length > 0) {
          SendMessagesModule.sendWhatsapp(
            filterNumber,
            message || "",
            "",
            true
          );
        } else {
          console.log("No valid contact found for WhatsApp.");
        }
        break;

      case "whatsappBusiness":
        if (numbers.length > 0) {
          SendMessagesModule.sendWhatsapp(numbers, message || "", "", false);
        } else {
          console.log("No valid contact found for WhatsApp Business.");
        }
        break;

      case "SMS":
        if (numbers.length > 0) {
          const smsMessage = message;
          SendMessagesModule.sendSms(numbers, smsMessage);
        } else {
          console.log("No valid phone numbers found for SMS.");
        }
        break;

      case "gmail":
        SendMessagesModule.sendMail(
          emailMails,
          subject || "",
          message || "",
          ""
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
