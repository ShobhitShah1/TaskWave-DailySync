import { DocumentPickerResponse } from '@react-native-documents/picker';
import React, { ReactNode } from 'react';
import { ImageSourcePropType } from 'react-native';

import { FrequencyType } from '@Screens/AddReminder/Components/AddScheduleFrequency';
import BottomSheet from '@gorhom/bottom-sheet';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type RootStackParamList = {
  OnBoarding: undefined;
  BottomTab:
    | {
        screen?: 'Home' | 'Notification' | 'AddReminder' | 'History' | 'Setting';
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
    notificationData: Notification | { id: string };
  };
  LocationPreview: {
    notificationData: Notification;
  };
  AboutApp: undefined;
  HowAppWorks: undefined;
  NotificationSound: undefined;
  LocationDetails: {
    notificationType: NotificationType;
    id?: string;
  };
};

export interface AppContextProps {
  children: ReactNode;
}

export type Theme = 'light' | 'dark';

export type ViewMode = 'grid' | 'list';

export type NotificationType =
  | 'whatsapp'
  | 'whatsappBusiness'
  | 'SMS'
  | 'gmail'
  | 'phone'
  | 'instagram'
  | 'telegram'
  | 'note'
  | 'location';

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
  date: Date | string;
  toContact: Contact[];
  toMail: string[];
  subject: string | undefined;
  attachments: DocumentPickerResponse[];
  scheduleFrequency: FrequencyType | null;
  days: string[];
  memo?: Memo[];
  telegramUsername: string;
  latitude?: number | string;
  longitude?: number | string;
  radius?: number;
  locationName?: string;
  rescheduleInfo?: {
    isReschedule?: boolean;
    delayMinutes?: number;
    retryCount?: number;
  };
  status?: LocationReminderStatus;
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
  // Optional for sync button
  syncContacts?: () => void;
  isSyncing?: boolean;
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

export interface RenderSheetViewProps {
  categories: NotificationCategory[];
  onCategoryClick: (category: remindersCategoriesType, isTopCategory: boolean) => void;
  selectedCategory: NotificationType | null;
  setSelectedCategory: (category: NotificationType) => void;
}

export interface headerInterface {
  selectedFilter: NotificationType | 'all';
  setSelectedFilter: (category: NotificationType | 'all') => void;
  notificationsState: NotificationStatus;
  setFullScreenPreview: (isFullScreen: boolean) => void;
}

export interface CategoryItemType {
  item: remindersCategoriesType;
  index: number;
  setSelectedCategory: (category: NotificationType) => void;
  selectedCategory: NotificationType | null | undefined;
  onCategoryClick: (category: remindersCategoriesType) => void;
}

export interface ReminderCardProps {
  notification: Notification;
  deleteReminder: (id?: string) => void;
  onRefreshData?: () => void;
  setFullScreenPreview?: React.Dispatch<React.SetStateAction<boolean>>;
  loadNotifications?: () => Promise<Notification[] | undefined>;
}

export interface NotificationColor {
  backgroundColor: string;
  typeColor: string;
  iconColor: string;
  createViewColor: string;
  icon: number;
  history_icon: number;
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
  address: string;
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
  onRefreshData: () => void;
  setFullScreenPreview: React.Dispatch<React.SetStateAction<boolean>>;
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
  glowIcon: number;
  history_icon: number;
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
  glowIcon: number;
  history_icon: number;
  color: {
    background: string;
    primary: string;
    dark: string;
  };
};

export interface Sound {
  id: string;
  name: string;
  duration: string | null;
  category?: string;
  uri: any;
  canPlay: boolean;
  soundKeyName: string;
}

export interface RescheduleConfig {
  defaultDelay: number; // minutes
  maxRetries?: number; // optional maximum number of reschedules
}

export interface LocationMarker {
  id: string;
  latitude: number;
  longitude: number;
  color: string;
}

// Geo types for map and utility functions
export interface GeoLatLng {
  latitude: number;
  longitude: number;
}

export type GetCenterBetweenPoints = (a: GeoLatLng, b: GeoLatLng) => GeoLatLng;
export type GetZoomLevelForPoints = (a: GeoLatLng, b: GeoLatLng) => number;

/**
 * Props for the main LocationMapView component
 */
export interface LocationMapViewProps {
  onLocationSelect: (coordinate: GeoLatLng) => void;
  selectedLocation: GeoLatLng | null;
  children?: React.ReactNode;
  userLocation?: GeoLatLng;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  validateAndSubmit: () => void;
  isLoading: boolean;
  id?: string; // Optional ID for editing existing location reminders
  bottomSheetRef?: React.RefObject<BottomSheet | null>;
  address: string;
  setAddress: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Camera position state for the map
 */
export interface CameraPosition {
  centerCoordinate: [number, number];
  zoomLevel: number;
  animationDuration?: number;
}

/**
 * Props for the custom map marker
 */
export interface MapMarkerProps {
  color: string;
  backgroundColor: string;
}

/**
 * Props for the map controls (satellite, zoom-to-fit, FAB)
 */
export interface MapControlsProps {
  isSatelliteView: boolean;
  onToggleSatellite: () => void;
  onZoomToFit: () => void;
  onCenterUser: () => void;
  showZoomToFit: boolean;
  colors: { background: string; blue: string; text: string };
}

/**
 * MapLibre map press event type (for onPress handler)
 */
export interface MapLibreMapPressEvent {
  payload?: {
    geometry?: {
      coordinates: [number, number];
    };
  };
  geometry?: {
    coordinates: [number, number];
  };
  coordinates?: [number, number];
}

/**
 * MapLibre user location update event type (for UserLocation onUpdate handler)
 */
export interface MapLibreUserLocationEvent {
  coords?: {
    latitude: number;
    longitude: number;
  };
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export interface LocationSearchBarProps {
  onSearchPress?: () => void;
}

export enum LocationReminderStatus {
  Pending = 'pending',
  Sent = 'sent',
  Expired = 'expired',
}

export interface LocationReminder {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  title: string;
  message: string;
  notification: Notification;
  isActive: boolean;
  createdAt: Date;
  status: LocationReminderStatus; // <-- NEW
}
