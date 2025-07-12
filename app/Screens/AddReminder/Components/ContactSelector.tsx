import React from 'react';
import { Text, View } from 'react-native';
import { Contact, NotificationType } from 'Types/Interface';

import AddContact from '../Components/AddContact';
import AddTelegramUsername from '../Components/AddTelegramUsername';
import styles from '../styles';

interface ContactSelectorProps {
  selectedContacts: Contact[];
  onHandelContactClick: () => void;
  handleRemoveContact: (contact: Contact) => void;
  themeColor: string;
  notificationType: NotificationType;
  telegramUsername: string;
  setTelegramUsername: React.Dispatch<React.SetStateAction<string>>;
}

const ContactSelector: React.FC<ContactSelectorProps> = ({
  selectedContacts,
  onHandelContactClick,
  handleRemoveContact,
  themeColor,
  notificationType,
  telegramUsername,
  setTelegramUsername,
}) => {
  const style = styles();

  return (
    <>
      {notificationType !== 'gmail' &&
        notificationType !== 'note' &&
        (notificationType === 'telegram' ? telegramUsername?.length === 0 : true) && (
          <AddContact
            onContactPress={onHandelContactClick}
            themeColor={themeColor}
            selectedContacts={selectedContacts}
            onRemoveContact={handleRemoveContact}
          />
        )}

      {notificationType === 'telegram' &&
        telegramUsername?.length === 0 &&
        selectedContacts.length === 0 && (
          <View style={style.orContainer}>
            <View style={style.orLine} />
            <Text style={style.orText}>Or</Text>
            <View style={style.orLine} />
          </View>
        )}

      {notificationType === 'telegram' && selectedContacts.length === 0 && (
        <AddTelegramUsername
          telegramUsername={telegramUsername}
          setTelegramUsername={setTelegramUsername}
          themeColor={themeColor}
        />
      )}
    </>
  );
};

export default ContactSelector;
