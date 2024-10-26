import { Linking, NativeModules } from "react-native";
import { showMessage } from "react-native-flash-message";
import { Contact, Notification } from "../Types/Interface";

export const handleNotificationPress = (notification: any) => {
  try {
    const { SendMessagesModule } = NativeModules;
    const { type, message, subject, toContact, toMail, attachments, memo } =
      notification as Notification;

    let numbers: string[] = [];
    let emailMails: string = "";
    let attachmentPaths: string[] = [];
    let audioPath: string = "";

    const globalMessage: string = String(message) || "";
    const globalSubject: string = String(subject) || "";

    try {
      const contacts: Contact[] = JSON.parse(toContact as any);
      numbers = Array.isArray(contacts)
        ? contacts?.map((contact: Contact) => contact?.number)
        : [];
    } catch (error: any) {
      showMessage({
        message: `Failed to parse toContact: ${error.message || error}`,
        type: "danger",
      });
    }

    try {
      const emails: string[] = JSON.parse(toMail as any);
      emailMails = emails?.filter((email) => email !== "").join(", ");
    } catch (error: any) {
      showMessage({
        message: `Failed to parse toMail: ${error.message || error}`,
        type: "danger",
      });
    }

    try {
      const parsedAttachments =
        typeof attachments === "string" ? JSON.parse(attachments) : attachments;
      if (Array.isArray(parsedAttachments)) {
        attachmentPaths = parsedAttachments?.map(
          (attachment) => attachment?.uri || ""
        );
      }
    } catch (error: any) {
      showMessage({
        message: `Failed to parse attachments: ${error?.message || error}`,
        type: "danger",
      });
    }

    try {
      const parsedMemo = typeof memo === "string" ? JSON.parse(memo) : memo;
      if (Array.isArray(parsedMemo) && parsedMemo.length > 0) {
        audioPath = parsedMemo?.[0]?.uri || "";
      }
    } catch (error) {}

    switch (type) {
      case "whatsapp":
      case "whatsappBusiness":
        if (numbers.length > 0) {
          SendMessagesModule.sendWhatsapp(
            numbers?.join(","),
            globalMessage,
            attachmentPaths?.join(","),
            audioPath,
            type === "whatsapp"
          );
        } else {
          showMessage({
            message: `No valid contact found for ${type === "whatsapp" ? "WhatsApp" : "WhatsApp Business"}.`,
            type: "danger",
          });
        }
        break;
      case "SMS":
        if (numbers.length > 0) {
          SendMessagesModule?.sendSms(
            numbers,
            globalMessage,
            attachmentPaths?.join(",")
          );
        } else {
          showMessage({
            message: "No valid phone numbers found for SMS.",
            type: "danger",
          });
        }
        break;
      case "gmail":
        try {
          SendMessagesModule?.sendMail(
            emailMails,
            globalSubject,
            globalMessage,
            attachmentPaths?.join(",")
          );
        } catch (error: any) {
          showMessage({
            message: String(error.message || error),
            type: "danger",
          });
        }
        break;
      case "phone":
        Linking.openURL(`tel:${numbers}`);
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
