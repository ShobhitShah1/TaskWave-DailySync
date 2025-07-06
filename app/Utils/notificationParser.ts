import { DocumentPickerResponse } from '@react-native-documents/picker';

import { Notification } from '../Types/Interface';

export const parseAttachments = (attachments: any): DocumentPickerResponse[] => {
  try {
    return typeof attachments === 'string' ? JSON.parse(attachments) : attachments || [];
  } catch (error) {
    console.error('Failed to parse attachments:', error);
    return [];
  }
};

export const parseMemo = (memo: any): any[] => {
  try {
    return typeof memo === 'string' ? JSON.parse(memo) : memo || [];
  } catch (error) {
    console.error('Failed to parse memo:', error);
    return [];
  }
};

export const parseContacts = (toContact: any): any[] => {
  try {
    return typeof toContact === 'string' ? JSON.parse(toContact) : toContact || [];
  } catch (error) {
    console.error('Failed to parse toContact:', error);
    return [];
  }
};

export const parseEmails = (toMail: any): string[] => {
  try {
    return typeof toMail === 'string' ? JSON.parse(toMail) : toMail || [];
  } catch (error) {
    console.error('Failed to parse toMail:', error);
    return [];
  }
};

// Main function to parse all necessary fields of Notification object
export const parseNotificationData = (data: Notification): Notification => {
  return {
    ...data,
    attachments: parseAttachments(data.attachments),
    memo: parseMemo(data.memo),
    toContact: parseContacts(data.toContact),
    toMail: parseEmails(data.toMail),
  };
};
