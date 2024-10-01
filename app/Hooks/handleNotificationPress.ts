import { Alert, Linking, NativeModules } from "react-native";
import { Contact, Notification } from "../Types/Interface";
import { showMessage } from "react-native-flash-message";

export const handleNotificationPress = (notification: any) => {
  try {
    console.log("INSIDE HANDEL NOTIFICATION");
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
    } catch (error: any) {
      showMessage({
        message: `Failed to parse toContact: ${error.message || error}`,
        type: "danger",
      });
    }

    try {
      const emails: string[] = JSON.parse(toMail as any);
      emailMails = emails.filter((email) => email !== "").join(", ");
    } catch (error: any) {
      showMessage({
        message: `Failed to parse toMail: ${error.message || error}`,
        type: "danger",
      });
    }

    try {
      const parsedAttachments =
        typeof attachments === "string" ? JSON.parse(attachments) : attachments;
      if (Array.isArray(parsedAttachments) && parsedAttachments[0]) {
        firstAttachment =
          parsedAttachments[0].name || parsedAttachments[0].uri || "";
      }
    } catch (error: any) {
      showMessage({
        message: `Failed to parse attachments: ${error.message || error}`,
        type: "danger",
      });
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
          showMessage({
            message: "No valid contact found for WhatsApp.",
            type: "danger",
          });
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
          showMessage({
            message: "No valid contact found for WhatsApp Business.",
            type: "danger",
          });
        }
        break;
      case "SMS":
        if (numbers.length > 0) {
          SendMessagesModule.sendSms(numbers, globalMessage, firstAttachment);
        } else {
          showMessage({
            message: "No valid phone numbers found for SMS.",
            type: "danger",
          });
        }
        break;
      case "gmail":
        try {
          SendMessagesModule.sendMail(
            emailMails,
            globalSubject,
            globalMessage,
            firstAttachment
          );
        } catch (error: any) {
          showMessage({
            message: String(error.message || error),
            type: "danger",
          });
        }
        break;
      default:
        showMessage({
          message: "Unsupported notification type.",
          type: "danger",
        });
        break;
    }
  } catch (error: any) {
    showMessage({
      message: String(error?.message || error),
      type: "danger",
    });
  }
};
