import { useState, useCallback } from "react";
import * as FileSystem from "expo-file-system";
import RNBlobUtil from "react-native-blob-util";
import Contacts from "react-native-contacts";

interface Contact {
  recordID: string;
  name?: string;
  number?: string;
  hasThumbnail?: boolean;
}

interface UseContactsCSVReturn {
  getContactsCSVPath: () => Promise<string>;
  isLoading: boolean;
  error: string | null;
  contactsCount: number;
  lastUpdated: Date | null;
}

interface UseContactsCSVOptions {
  cacheExpiryMinutes?: number; // How long to consider the file valid
  fileName?: string;
  onSuccess?: (filePath: string, contactsCount: number) => void;
  onError?: (error: string) => void;
}

const useContactsCSV = (
  options: UseContactsCSVOptions = {}
): UseContactsCSVReturn => {
  const {
    cacheExpiryMinutes = 60, // Default 1 hour cache
    fileName = `contacts-export-${new Date().toISOString().split("T")[0]}.csv`, // Daily file
    onSuccess,
    onError,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactsCount, setContactsCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  /**
   * Converts an array of contacts into a CSV formatted string.
   */
  const convertToCsv = useCallback((contacts: Contact[]): string => {
    const header = "Name,PhoneNumber\n";

    const rows = contacts
      .map((contact) => {
        const name = sanitizeCsvField(contact.name || "");
        const phoneNumber = sanitizeCsvField(contact.number || "");
        return `${name},${phoneNumber}`;
      })
      .join("\n");

    return header + rows;
  }, []);

  /**
   * Sanitizes CSV fields by wrapping in quotes if needed and escaping quotes.
   */
  const sanitizeCsvField = useCallback((field: string): string => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      const escapedField = field.replace(/"/g, '""');
      return `"${escapedField}"`;
    }
    return field;
  }, []);

  /**
   * Fetches contacts from device and processes them.
   */
  const fetchAndProcessContacts = useCallback(async (): Promise<Contact[]> => {
    try {
      const contactsData = await Contacts.getAll();
      const simplifiedContacts: Contact[] = contactsData
        .map((contact) => ({
          recordID: contact.recordID || "",
          name: contact.displayName,
          number: contact.phoneNumbers?.[0]?.number,
          hasThumbnail: contact.hasThumbnail,
        }))
        .sort((a, b) =>
          (a?.name?.toLowerCase() || "") > (b?.name?.toLowerCase() || "")
            ? 1
            : -1
        );

      if (simplifiedContacts.length === 0) {
        throw new Error("No contacts found on device.");
      }

      return simplifiedContacts;
    } catch (error: any) {
      throw new Error(`Failed to fetch contacts: ${error.message}`);
    }
  }, []);

  /**
   * Creates the CSV file in Downloads folder.
   */
  const createCSVFile = useCallback(
    async (contacts: Contact[], filePath: string): Promise<void> => {
      try {
        const csvString = convertToCsv(contacts);
        await RNBlobUtil.fs.writeFile(filePath, csvString, "utf8");

        // Optional: Trigger media scanner for Android
        if (RNBlobUtil.fs.dirs.DownloadDir && filePath.includes("Download")) {
          try {
            // Make file visible in file managers on Android
            await RNBlobUtil.fs.scanFile([
              { path: filePath, mime: "text/csv" },
            ]);
          } catch (scanError) {
            console.warn("Media scanner failed:", scanError);
            // Non-critical error, continue
          }
        }
      } catch (error: any) {
        throw new Error(`Failed to create CSV file: ${error.message}`);
      }
    },
    [convertToCsv]
  );

  /**
   * Checks if file exists and is still valid based on cache expiry.
   */
  const isFileValidAndExists = useCallback(
    async (filePath: string): Promise<boolean> => {
      try {
        const fileExists = await RNBlobUtil.fs.exists(filePath);
        if (!fileExists) {
          return false;
        }

        // Check file age
        const fileStats = await RNBlobUtil.fs.stat(filePath);
        const fileDate = new Date(fileStats.lastModified);
        const now = new Date();
        const ageInMinutes = (now.getTime() - fileDate.getTime()) / (1000 * 60);

        return ageInMinutes < cacheExpiryMinutes;
      } catch (error) {
        console.warn("Error checking file validity:", error);
        return false;
      }
    },
    [cacheExpiryMinutes]
  );

  /**
   * Main function to get CSV file path - creates file if needed.
   */
  const getContactsCSVPath = useCallback(async (): Promise<string> => {
    if (isLoading) {
      throw new Error("Already processing contacts. Please wait.");
    }

    setIsLoading(true);
    setError(null);

    try {
      const filePath = `${RNBlobUtil.fs.dirs.DownloadDir}/${fileName}`;

      // Check if file exists and is valid
      const isValid = await isFileValidAndExists(filePath);

      if (isValid) {
        console.log("Using existing CSV file:", filePath);
        setLastUpdated(new Date());
        onSuccess?.(filePath, contactsCount);
        return filePath;
      }

      console.log("Creating new CSV file...");

      // Fetch contacts and create new file
      const contacts = await fetchAndProcessContacts();
      await createCSVFile(contacts, filePath);

      setContactsCount(contacts.length);
      setLastUpdated(new Date());

      console.log(
        `CSV file created with ${contacts.length} contacts:`,
        filePath
      );

      onSuccess?.(filePath, contacts.length);
      return filePath;
    } catch (error: any) {
      const errorMessage = error.message || "Unknown error occurred";
      setError(errorMessage);
      onError?.(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    fileName,
    isFileValidAndExists,
    fetchAndProcessContacts,
    createCSVFile,
    contactsCount,
    onSuccess,
    onError,
  ]);

  return {
    getContactsCSVPath,
    isLoading,
    error,
    contactsCount,
    lastUpdated,
  };
};

export default useContactsCSV;
