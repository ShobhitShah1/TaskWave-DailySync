import { DocumentPickerResponse } from "react-native-document-picker";
import { FrequencyType } from "../Screens/AddReminder/Components/AddScheduleFrequency";
import { categoriesType } from "../Routes/BottomTab";

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
    id?: string;
  };
  ReminderScheduled: {
    themeColor: string;
    notification: Notification;
  };
  ReminderPreview: {
    notificationData: Notification;
  };
  AboutApp: undefined;
  HowAppWorks: undefined;
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
  | "gmail"
  | "phone";

export interface Contact {
  name: string;
  number: string;
  recordID: string;
  thumbnailPath?: string;
}

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  date: Date;
  toContact: Contact[];
  toMail: string[];
  subject: string | undefined;
  attachments: DocumentPickerResponse[];
  scheduleFrequency: FrequencyType | null;
  memo?: Memo[];
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

export interface DayItem {
  date: number; // The day of the month (e.g., 1, 2, 3)
  dayOfWeek: string; // Short name of the day (e.g., "Mon", "Tue")
  formattedDate: string; // Formatted date string (e.g., "01-09-2023")
}

export interface ContactListModalProps {
  isVisible: boolean;
  onClose: () => void;
  contacts: Contact[];
  refreshing: boolean;
  onRefreshData: () => void;
  isContactLoading: boolean;
  selectedContacts: Contact[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  notificationType: NotificationType;
}

export type Memo = {
  uri: string;
  metering: number[];
};

export interface NotificationStatus {
  all: Notification[];
  allByDate: Notification[];
  active: Notification[];
  inactive: Notification[];
}

export interface headerInterface {
  selectedFilter: NotificationType | "all";
  setSelectedFilter: (category: NotificationType | "all") => void;
  notificationsState: NotificationStatus;
  setFullScreenPreview: (isFullScreen: boolean) => void;
}

export interface CategoryItemType {
  item: categoriesType;
  setSelectedCategory: (category: NotificationType) => void;
  selectedCategory: NotificationType | null | undefined;
  categories: categoriesType[];
  setCategories: (categories: categoriesType[]) => void;
}
