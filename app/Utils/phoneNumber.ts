export interface NormalizedPhoneInput {
  phoneCountryCode: string;
  phoneNumber: string;
  phoneE164: string;
}

const COUNTRY_CODE_REGEX = /^\+\d{1,4}$/;
const PHONE_NUMBER_REGEX = /^\d{6,15}$/;

export const normalizePhoneCountryCode = (value: string) => {
  const digits = value.replace(/[^\d]/g, '');
  return digits ? `+${digits.slice(0, 4)}` : '';
};

export const normalizePhoneNumber = (value: string) => {
  return value.replace(/[^\d]/g, '').slice(0, 15);
};

export const buildPhoneE164 = (phoneCountryCode: string, phoneNumber: string) => {
  const normalizedCountryCode = normalizePhoneCountryCode(phoneCountryCode);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedCountryCode || !normalizedPhoneNumber) {
    return '';
  }

  return `${normalizedCountryCode}${normalizedPhoneNumber}`;
};

export const validatePhoneInput = (
  phoneCountryCode: string,
  phoneNumber: string,
): string | null => {
  const normalizedCountryCode = normalizePhoneCountryCode(phoneCountryCode);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  if (!normalizedCountryCode) {
    return 'Country code is required.';
  }

  if (!COUNTRY_CODE_REGEX.test(normalizedCountryCode)) {
    return 'Enter a valid country code.';
  }

  if (!normalizedPhoneNumber) {
    return 'Phone number is required.';
  }

  if (!PHONE_NUMBER_REGEX.test(normalizedPhoneNumber)) {
    return 'Enter a valid phone number.';
  }

  return null;
};

export const normalizePhoneInput = (
  phoneCountryCode: string,
  phoneNumber: string,
): NormalizedPhoneInput => {
  const normalizedCountryCode = normalizePhoneCountryCode(phoneCountryCode);
  const normalizedPhoneNumber = normalizePhoneNumber(phoneNumber);

  return {
    phoneCountryCode: normalizedCountryCode,
    phoneNumber: normalizedPhoneNumber,
    phoneE164: buildPhoneE164(normalizedCountryCode, normalizedPhoneNumber),
  };
};
