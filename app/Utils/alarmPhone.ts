import { Contact } from '@Types/Interface';
import { AlarmPhoneContact } from '@Types/Alarm';
import {
  buildPhoneE164,
  normalizePhoneCountryCode,
  normalizePhoneNumber,
} from '@Utils/phoneNumber';

const DEFAULT_COUNTRY_CODE = '+91';

const splitPhoneNumber = (rawNumber: string) => {
  const normalized = rawNumber.replace(/[^\d+]/g, '');

  if (normalized.startsWith('+')) {
    const digits = normalized.slice(1);

    if (digits.length > 10) {
      const countryDigits = digits.slice(0, digits.length - 10);
      const nationalDigits = digits.slice(-10);

      return {
        phoneCountryCode: normalizePhoneCountryCode(`+${countryDigits}`),
        phoneNumber: normalizePhoneNumber(nationalDigits),
      };
    }

    return {
      phoneCountryCode: DEFAULT_COUNTRY_CODE,
      phoneNumber: normalizePhoneNumber(digits),
    };
  }

  return {
    phoneCountryCode: DEFAULT_COUNTRY_CODE,
    phoneNumber: normalizePhoneNumber(normalized),
  };
};

export const toAlarmPhoneContact = (contact: Contact): AlarmPhoneContact | null => {
  const { phoneCountryCode, phoneNumber } = splitPhoneNumber(contact.number || '');
  const phoneE164 = buildPhoneE164(phoneCountryCode, phoneNumber);

  if (!phoneNumber || !phoneE164) {
    return null;
  }

  return {
    recordID: contact.recordID,
    name: contact.name,
    number: contact.number,
    phoneCountryCode,
    phoneNumber,
    phoneE164,
    thumbnailPath: contact.thumbnailPath,
  };
};

export const maskAlarmPhoneNumber = (phoneCountryCode: string, phoneNumber: string) => {
  if (phoneNumber.length <= 4) {
    return `${phoneCountryCode} ${phoneNumber}`;
  }

  return `${phoneCountryCode} ${phoneNumber.slice(0, 2)}******${phoneNumber.slice(-2)}`;
};
