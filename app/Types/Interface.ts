import { DocumentPickerResponse } from "react-native-document-picker";
import { FrequencyType } from "../Screens/AddReminder/Components/AddScheduleFrequency";
import { ReactNode } from "react";
import { ImageSourcePropType } from "react-native";

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

export interface AppContextProps {
  children: ReactNode;
}

export type Theme = "light" | "dark";
export type ViewMode = "grid" | "list";

export interface AppContextType {
  theme: Theme;
  toggleTheme: (newTheme: Theme) => void;
  viewMode: ViewMode;
  toggleViewMode: (newMode: ViewMode) => void;
}

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
  | "phone"
  | "instagram"
  | "telegram"
  | "note";

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
  telegramUsername: string;
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
  item: remindersCategoriesType;
  setSelectedCategory: (category: NotificationType) => void;
  selectedCategory: NotificationType | null | undefined;
  onCategoryClick: (category: remindersCategoriesType) => void;
}

export interface ReminderCardProps {
  notification: Notification;
  deleteReminder: (id?: string) => void;
  onRefreshData?: () => void;
  loadNotifications: () => void;
}

export interface NotificationColor {
  backgroundColor: string;
  typeColor: string;
  iconColor: string;
  createViewColor: string;
  icon: number;
}

export interface AddContactProps {
  themeColor: string;
  onContactPress: () => void;
  selectedContacts: Contact[];
  onRemoveContact: (contact: Contact) => void;
}

export interface IListViewProps {
  cardBackgroundColor: string;
  icon: any;
  title: string;
  notification: Notification;
  onCardPress: () => void;
  typeColor: string;
  deleteReminder: (id: string) => void;
  onEditPress: () => void;
  onDuplicatePress: () => void;
}

export interface FullScreenProps {
  isVisible: boolean;
  onClose: () => void;
  notifications: Notification[];
}

export interface RenderTabBarProps {
  routeName: string;
  selectedTab: string;
  navigate: (routeName: string) => void;
}

export type remindersCategoriesType = {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  icon: ImageSourcePropType;
  color: {
    background: string;
    primary: string;
    dark: string;
  };
};

export type NotificationCategory = {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  icon: number;
  color: {
    background: string;
    primary: string;
    dark: string;
  };
};
