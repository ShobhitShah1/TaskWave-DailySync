import { NotificationType, Contact } from '../../Types/Interface';

export interface ContactSelectorProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  selectedContacts: Contact[];
  setSelectedContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  contactModalVisible: boolean;
  setContactModalVisible: React.Dispatch<React.SetStateAction<boolean>>;
  isContactLoading: { isLoading: boolean; isRefreshing: boolean };
  setIsContactLoading: React.Dispatch<React.SetStateAction<{ isLoading: boolean; isRefreshing: boolean }>>;
  onHandelContactClick: () => void;
  requestContactData: () => void;
  handleRemoveContact: (contact: Contact) => void;
  themeColor: string;
  notificationType: NotificationType;
  telegramUsername: string;
  setTelegramUsername: React.Dispatch<React.SetStateAction<string>>;
 } 