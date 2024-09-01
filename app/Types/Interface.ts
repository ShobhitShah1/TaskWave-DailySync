import { ReminderCardProps } from "../Components/ReminderCard";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  BottomTab:
    | {
        screen?:
          | "Home"
          | "Notification"
          | "AddReminder"
          | "History"
          | "Setting";
      }
    | undefined;
  Home: undefined;
  Notification: undefined;
  AddReminder: undefined;
  History: undefined;
  Setting: undefined;
  CreateReminder: {
    notificationType: NotificationType;
  };
  ReminderScheduled: {
    themeColor: string;
  };
};

export interface ReusableBottomSheetProps {
  snapPoints?: Array<string | number>;
  initialIndex?: number;
  onChange?: (index: number) => void;
  children: React.ReactNode;
}

export type NotificationType =
  | "whatsapp"
  | "whatsappBusiness"
  | "SMS"
  | "gmail";

export interface Notification {
  id: string;
  type: NotificationType;
  senderName: string;
  message: string;
  time: string;
  timer: string;
  isRead: boolean;
  actions: string[];
}

export interface SimplifiedContact {
  recordID: string;
  displayName: string;
  phoneNumbers: {
    label: string;
    number: string;
  }[];
  postalAddresses: {
    street: string;
    city: string;
    state: string;
    postCode: string;
    country: string;
  }[];
  hasThumbnail: boolean;
  thumbnailPath: string;
}
