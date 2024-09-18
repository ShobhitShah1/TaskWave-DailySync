import { DocumentPickerResponse } from "react-native-document-picker";

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  OnBoarding: undefined;
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
    notification: Notification;
  };
  ReminderPreview: {
    notificationData: Notification;
  };
  AboutApp: undefined;
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

export interface Contact {
  name: string;
  number: string;
}

export interface Notification {
  id?: string;
  type: NotificationType;
  message: string;
  date: Date;
  toContact: Contact[];
  toMail: string[];
  subject: string | undefined;
  attachments: DocumentPickerResponse[];
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
