import { storage } from '@Contexts/ThemeProvider';
import { AuthData } from '@Types/Auth';

const AUTH_DATA_KEY = 'auth:data';
const DEVICE_ID_KEY = 'auth:device-id';

const safeParse = <T>(value: string | undefined): T | null => {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const authStorage = {
  getAuth: (): AuthData | null => {
    return safeParse<AuthData>(storage.getString(AUTH_DATA_KEY));
  },
  setAuth: (auth: AuthData) => {
    storage.set(AUTH_DATA_KEY, JSON.stringify(auth));
  },
  clearAuth: () => {
    storage.delete(AUTH_DATA_KEY);
    storage
      .getAllKeys()
      .filter((key) => key.startsWith('auth:') && key !== DEVICE_ID_KEY)
      .forEach((key) => storage.delete(key));
  },
};
