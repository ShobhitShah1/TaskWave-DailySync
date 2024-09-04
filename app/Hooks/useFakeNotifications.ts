import { useMemo } from "react";
import { Notification, NotificationType } from "../Types/Interface";

const notificationTypes: NotificationType[] = [
  "whatsapp",
  "whatsappBusiness",
  "SMS",
  "gmail",
];
const actions = ["view", "edit", "add"];
const senderNames = [
  "Aryan",
  "Business",
  "Bank",
  "Google",
  "Family",
  "Vendor",
  "Service",
  "HR",
  "Friend",
  "Store",
  "Doctor",
  "Team Lead",
];
const messages = [
  "Hello, How are you? Are You Okk?",
  "Your order is ready for pickup at our main branch. Please bring your receipt to ensure smooth processing.",
  "Your account balance is low. Please deposit funds to avoid any service interruptions.",
  "Security alert on your account. Suspicious activity detected. Please review your recent account activity.",
  "Don’t forget about the family gathering this weekend! Everyone is looking forward to seeing you.",
  "Your subscription will expire in 3 days. Renew now to continue enjoying our services.",
  "Your service appointment is confirmed for tomorrow at 2:00 PM. Please be available.",
  "Your leave request has been approved. Please check your email for details.",
  "Hey, it’s been a while! Let’s catch up sometime soon. How about a coffee this weekend?",
  "Flash Sale: 50% off on selected items. Hurry, offer ends tonight at midnight!",
  "Your appointment is scheduled for next week. Please confirm your availability.",
  "Project update: The deadline has been extended. Please refer to the email for the new timeline.",
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateFutureTime(): string {
  const now = new Date();
  const futureTime = new Date(
    now.getTime() + Math.floor(Math.random() * 60 * 60 * 1000)
  );
  const hours = futureTime.getHours();
  const minutes = futureTime.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;

  return `${formattedHours}:${minutes.toString().padStart(2, "0")} ${ampm}`;
}

function generateFutureTimer(): string {
  const now = new Date();
  const futureTime = new Date(
    now.getTime() + Math.floor(Math.random() * 24 * 60 * 60 * 1000)
  );
  const diffMilliseconds = futureTime.getTime() - now.getTime();
  const hours = Math.floor(diffMilliseconds / (1000 * 60 * 60));
  const minutes = Math.floor(
    (diffMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
  );
  const seconds = Math.floor((diffMilliseconds % (1000 * 60)) / 1000);

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function generateRandomNotification(id: number): Notification {
  return {
    id: id.toString(),
    type: getRandomElement(notificationTypes),
    senderName: getRandomElement(senderNames),
    message: getRandomElement(messages),
    time: generateFutureTime(),
    timer: generateFutureTimer(),
    isRead: Math.random() > 0.5,
    actions: Array.from(
      new Set([
        getRandomElement(actions),
        getRandomElement(actions),
        getRandomElement(actions),
      ])
    ),
  };
}

export function useFakeNotifications(count: number): Notification[] {
  return useMemo(() => {
    return Array.from({ length: count }, (_, index) =>
      generateRandomNotification(index + 1)
    );
  }, [count]);
}
