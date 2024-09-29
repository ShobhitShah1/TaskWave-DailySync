import { Alert } from "react-native";
import { DocumentPickerResponse } from "react-native-document-picker";
import { FrequencyType } from "../Screens/AddReminder/Components/AddScheduleFrequency";
import { Contact, Notification, NotificationType } from "../Types/Interface";
import useReminder, { scheduleNotificationWithNotifee } from "./useReminder";

// Helper function to create fake contacts
const createFakeContacts = (count: number): Contact[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `Contact ${i + 1}`,
    number: `123456789${i + 1}`,
    recordID: `recID${i + 1}`,
    thumbnailPath: `path/to/thumbnail/${i + 1}.png`,
  }));
};

// Helper function to create fake email list
const createFakeEmails = (count: number): string[] => {
  return Array.from({ length: count }, (_, i) => `email${i + 1}@example.com`);
};

// Helper function to create fake attachments
const createFakeAttachments = (count: number): DocumentPickerResponse[] => {
  return Array.from({ length: count }, (_, i) => ({
    uri: `file://path/to/document${i + 1}.pdf`,
    name: `Document ${i + 1}`,
    fileCopyUri: `file://copy/path/document${i + 1}.pdf`,
    type: "application/pdf",
    size: 1024 + i * 100, // Mock file sizes
  }));
};

// Hook to generate and manage random notifications
export const useRandomNotifications = () => {
  const { createNotification } = useReminder();

  // Function to generate a random future date
  const getRandomFutureDate = (): Date => {
    const currentDate = new Date();
    const randomDays = Math.floor(Math.random() * 30); // Random date within 30 days
    const randomHours = Math.floor(Math.random() * 24);
    const randomMinutes = Math.floor(Math.random() * 60);
    return new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + randomDays,
      randomHours,
      randomMinutes
    );
  };

  // Function to create a random notification
  const createRandomNotification = (
    sameDate: boolean,
    commonDate?: Date
  ): Notification => {
    const randomNotificationType: NotificationType = [
      "whatsapp",
      "whatsappBusiness",
      "SMS",
      "gmail",
      "phone",
    ][Math.floor(Math.random() * 5)] as NotificationType;

    const randomFrequency: FrequencyType = [
      "Daily",
      "Weekly",
      "Monthly",
      "Yearly",
    ][Math.floor(Math.random() * 4)] as FrequencyType;

    const futureDate =
      sameDate && commonDate ? commonDate : getRandomFutureDate();

    return {
      id: `notif${Math.floor(Math.random() * 1000000)}`,
      type: randomNotificationType,
      message: "You have a new notification!",
      date: futureDate,
      toContact: createFakeContacts(2),
      toMail: createFakeEmails(2),
      subject: "Important Task",
      attachments: createFakeAttachments(2),
      scheduleFrequency: randomFrequency,
    };
  };

  // Main function to generate and log notifications
  const generateNotifications = (count: number, sameDate: boolean) => {
    const commonDate = sameDate ? getRandomFutureDate() : undefined;
    const generatedNotifications: Notification[] = Array.from(
      { length: count },
      () => createRandomNotification(sameDate, commonDate)
    );

    logNotifications(generatedNotifications); // Log generated notifications
    scheduleNotifications(generatedNotifications); // Schedule the notifications
  };

  // Function to log notifications in a neat format
  const logNotifications = (notifications: Notification[]) => {
    notifications.forEach((notif) => {
      console.log(`Notification: ${notif.id}`);
      console.log(`- Type: ${notif.type}`);
      console.log(`- Message: ${notif.message}`);
      console.log(`- Date: ${notif.date.toLocaleString()}`);
      console.log(`- Frequency: ${notif.scheduleFrequency}`);
      console.log(
        `- Contacts: ${notif.toContact.map((c) => c.name).join(", ")}`
      );
      console.log(`- Emails: ${notif.toMail.join(", ")}`);
      console.log(`- Subject: ${notif.subject}`);
      console.log(
        `- Attachments: ${notif.attachments.map((att) => att.name).join(", ")}`
      );
    });
  };

  // Mock scheduling notifications (replace with actual scheduling logic)
  const scheduleNotifications = async (notifications: Notification[]) => {
    for (const notif of notifications) {
      console.log(notif);
      const id = await scheduleNotificationWithNotifee(notif); // Replace with actual scheduling logic
      if (!id) {
        Alert.alert("Error", `Failed to schedule notification: ${notif.id}`);
        continue;
      }

      // Mock ID creation (for testing)
      notif.id = id;

      const result = await createNotification(notif);
      console.log(`Scheduled Notification ID: ${notif.id}`, result);
    }

    Alert.alert(
      "Notification Scheduled",
      `${notifications.length} notifications have been scheduled!`
    );
  };

  return { generateNotifications };
};
