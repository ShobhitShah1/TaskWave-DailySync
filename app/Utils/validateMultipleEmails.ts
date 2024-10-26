import { validateEmail } from "./validateEmail";

export const validateMultipleEmails = (emailString: string) => {
  const emails = emailString.split(",").map((email) => email?.trim());
  for (let email of emails) {
    if (!validateEmail(email)) {
      return false;
    }
  }
  return true;
};
