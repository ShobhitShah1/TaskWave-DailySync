import { Alert, NativeModules } from "react-native";
import { Contact, Notification } from "../Types/Interface";

export const handelNotificationPress = (notification: any) => {
  try {
    const { type, message, date, subject, toContact, toMail, attachments } =
      notification as Notification;

    const { SendMessagesModule } = NativeModules;

    console.log("INSIDE HOOK:", notification);

    let numbers: string[] = [];
    try {
      const contacts: Contact[] = JSON.parse(toContact); // Ensure toContact is parsed as an array of Contact
      if (Array.isArray(contacts)) {
        numbers = contacts.map((contact: Contact) => contact.number); // Extract all numbers
      }
    } catch (error) {
      console.error("Failed to parse toContact:", error);
    }

    // Extract emails from toMail field
    let emails: string[] = [];
    try {
      emails = JSON.parse(toMail); // Parse the toMail field which is in string format
    } catch (error) {
      console.error("Failed to parse toMail:", error);
    }

    switch (type) {
      case "whatsapp":
        if (numbers.length > 0) {
          const whatsappMessage = message; // message content from notification
          const whatsappAttachment =
            attachments.length > 0 ? attachments[0] : ""; // optional attachment path
          const isWhatsapp = true; // true for WhatsApp, false for WhatsApp Business

          // Send WhatsApp to all numbers at once
          SendMessagesModule.sendWhatsapp(
            numbers,
            whatsappMessage,
            whatsappAttachment,
            isWhatsapp
          );
        } else {
          console.log("No valid contact found for WhatsApp.");
        }
        break;

      case "whatsappBusiness":
        if (numbers.length > 0) {
          const businessWhatsappMessage = message; // message content from notification
          const businessWhatsappAttachment =
            attachments.length > 0 ? attachments[0] : ""; // optional attachment path

          // Send WhatsApp Business to all numbers at once
          SendMessagesModule.sendWhatsapp(
            numbers,
            businessWhatsappMessage,
            businessWhatsappAttachment,
            false
          );
        } else {
          console.log("No valid contact found for WhatsApp Business.");
        }
        break;

      case "SMS":
        if (numbers.length > 0) {
          const smsMessage = message; // message content from notification

          // Send SMS to all numbers at once
          SendMessagesModule.sendSms(numbers, smsMessage);
        } else {
          console.log("No valid phone numbers found for SMS.");
        }
        break;

      case "gmail":
        // Dummy data for testing
        const emails = ["alice@example.com", "bob@example.com", ""]; // Example email addresses
        const emailSubject = "Test Subject"; // Example subject
        const emailBody = "This is a test email message."; // Example body
        const attachments = ["test.pdf"]; // Example attachment file (ensure it exists in the app's file directory)

        if (emails.length > 0 && emails.some((email) => email !== "")) {
          // Pass all valid emails to the sendMail function
          SendMessagesModule.sendMail(
            emails,
            emailSubject,
            emailBody,
            attachments.length > 0 ? attachments[0] : ""
          );
        } else {
          console.log("No valid email addresses found for Gmail.");
        }
        break;

      default:
        console.log("Unsupported notification type.");
        break;
    }
  } catch (error: any) {
    Alert.alert("Error", String(error?.message));
  }
};
