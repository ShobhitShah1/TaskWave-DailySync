import { SignInInput, SignUpInput } from '@Types/Auth';
import { validatePhoneInput } from '@Utils/phoneNumber';
import { validateEmail } from '@Utils/validateEmail';

export const validateSignInInput = ({ identifier, password }: SignInInput) => {
  if (!identifier.trim()) {
    return 'Email or username is required.';
  }

  if (!password.trim()) {
    return 'Password is required.';
  }

  return null;
};

export const validateSignUpInput = ({
  fullName,
  email,
  phoneCountryCode,
  phoneNumber,
  password,
  confirmPassword,
}: SignUpInput) => {
  if (!fullName.trim()) {
    return 'Full name is required.';
  }

  if (!email.trim()) {
    return 'Email is required.';
  }

  if (!validateEmail(email)) {
    return 'Please enter a valid email address.';
  }

  const phoneValidationMessage = validatePhoneInput(phoneCountryCode, phoneNumber);
  if (phoneValidationMessage) {
    return phoneValidationMessage;
  }

  if (password.length < 8) {
    return 'Password must be at least 8 characters.';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match.';
  }

  return null;
};
