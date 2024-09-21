import { useMemo } from "react";

// Define types for data structure
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

// Custom hook for parsing contacts and emails with flexible formatting
const useContactAndEmailParser = (data: Data, options: Options = {}) => {
  const { phoneFormat = "array", emailFormat = "array" } = options;

  // Memoize the parsing logic
  const { phoneNumbers, emails } = useMemo(() => {
    const toContact = data?.toContact || [];
    const toMail = data?.toMail || [];

    // Extract phone numbers
    const phoneNumbersArray = toContact.map((contact) => contact.number);

    // Extract emails, filter out empty strings
    const emailsArray = toMail.filter((email) => email !== "");

    // Format the results based on provided options
    const phoneNumbers = formatData(phoneNumbersArray, phoneFormat);
    const emails = formatData(emailsArray, emailFormat);

    return { phoneNumbers, emails };
  }, [data, phoneFormat, emailFormat]);

  return { phoneNumbers, emails };
};

// Helper function to format data based on the required format
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
