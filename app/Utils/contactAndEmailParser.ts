import { useMemo } from "react";

interface Contact {
  name: string;
  number: string;
  recordID?: string;
}

interface Data {
  toContact: Contact[];
  toMail: string[];
}

interface Options {
  phoneFormat?: "array" | "string" | "object";
  emailFormat?: "array" | "string" | "object";
}

const useContactAndEmailParser = (data: Data, options: Options = {}) => {
  const { phoneFormat = "array", emailFormat = "array" } = options;

  const { phoneNumbers, emails } = useMemo(() => {
    const toContact = data?.toContact || [];
    const toMail = data?.toMail || [];

    const phoneNumbersArray = toContact.map((contact) => contact.number);

    const emailsArray = toMail.filter((email) => email !== "");

    const phoneNumbers = formatData(phoneNumbersArray, phoneFormat);
    const emails = formatData(emailsArray, emailFormat);

    return { phoneNumbers, emails };
  }, [data, phoneFormat, emailFormat]);

  return { phoneNumbers, emails };
};

const formatData = (
  data: string[],
  format: "array" | "string" | "object"
): string[] | string | Record<number, string> => {
  switch (format) {
    case "array":
      return data;
    case "string":
      return data.join(", ");
    case "object":
      return data.reduce((acc, item, index) => ({ ...acc, [index]: item }), {});
    default:
      return data;
  }
};

export default useContactAndEmailParser;
