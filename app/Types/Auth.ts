export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export type AuthProviderType = 'google' | 'guest';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
  provider: AuthProviderType;
  timezone: string;
  fcmToken: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  phoneE164: string | null;
  deviceId: string | null;
}

export interface AuthData {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface DeviceFields {
  deviceId?: string;
  fcmToken?: string;
  platform?: 'ios' | 'android';
  timezone?: string;
}

export interface CompletePhoneInput {
  phoneCountryCode: string;
  phoneNumber: string;
}

export interface GoogleAuthPayload extends DeviceFields {
  idToken: string;
  accessToken: string | null;
  user: {
    id: string;
    email: string;
    name: string | null;
    photo: string | null;
  };
}

export interface DeviceRegistrationInput {
  deviceId?: string;
  fcmToken: string;
  platform: 'ios' | 'android';
  timezone: string;
}

export interface GuestAuthInput extends DeviceFields {
  deviceId: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  auth: AuthData | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isAuthMutationPending: boolean;
  signInWithGoogle: () => Promise<AuthData | null>;
  continueAsGuest: () => Promise<AuthData>;
  completePhoneProfile: (input: CompletePhoneInput) => Promise<AuthData>;
  signOut: () => Promise<void>;
}
