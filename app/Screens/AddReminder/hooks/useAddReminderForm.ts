import { useState } from 'react';
import { showMessage } from 'react-native-flash-message';

import { NotificationType } from '@Types/Interface';
import { validateMultipleEmails } from '@Utils/validateMultipleEmails';

const useAddReminderForm = (notificationType: NotificationType) => {
  const [message, setMessage] = useState('');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');

  const validateFields = ({
    selectedContacts,
    selectedDateAndTime,
  }: {
    selectedContacts: any[];
    selectedDateAndTime: { date: Date | undefined; time: Date | undefined };
  }) => {
    if (notificationType === 'gmail') {
      if (!to) {
        showMessage({
          message: "'To' field is required.",
          type: 'danger',
        });
        return false;
      }
      if (!validateMultipleEmails(to)) {
        showMessage({
          message: "Invalid email address(es) in 'To' field.",
          type: 'danger',
        });
        return false;
      }
      if (!subject) {
        showMessage({
          message: "'Subject' field is required.",
          type: 'danger',
        });
        return false;
      }
      if (!selectedDateAndTime?.date) {
        showMessage({
          message: "'Date' field is required.",
          type: 'danger',
        });
        return false;
      }
      if (!selectedDateAndTime?.time) {
        showMessage({
          message: "'Time' field is required.",
          type: 'danger',
        });
        return false;
      }
    } else {
      if (notificationType === 'telegram' && !telegramUsername && !selectedContacts?.length) {
        showMessage({
          message: "'Telegram Username' or 'Contact(s)' field is required.",
          type: 'danger',
        });
        return false;
      }

      if (
        (notificationType === 'whatsapp' ||
          notificationType === 'whatsappBusiness' ||
          notificationType === 'phone' ||
          notificationType === 'SMS') &&
        !selectedContacts?.length
      ) {
        showMessage({
          message: "'Contact(s)' field is required.",
          type: 'danger',
        });
        return false;
      }

      if (notificationType === 'phone' && !message) {
        showMessage({
          message: "'Note' field is required.",
          type: 'danger',
        });
        return false;
      }

      if (!message && notificationType !== 'phone') {
        showMessage({
          message: "'Message' field is required.",
          type: 'danger',
        });
        return false;
      }

      if (!selectedDateAndTime?.date) {
        showMessage({
          message: "'Date' field is required.",
          type: 'danger',
        });
        return false;
      }

      if (!selectedDateAndTime?.time) {
        showMessage({
          message: "'Time' field is required.",
          type: 'danger',
        });
        return false;
      }
    }
    return true;
  };

  return {
    message,
    setMessage,
    to,
    setTo,
    subject,
    setSubject,
    telegramUsername,
    setTelegramUsername,
    validateFields,
  };
};

export default useAddReminderForm;
