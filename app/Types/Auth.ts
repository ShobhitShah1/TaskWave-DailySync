export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export type AuthProviderType = 'password' | 'google';

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
}

export interface AuthData {
  accessToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface DeviceFields {
  fcmToken?: string;
  platform?: 'ios' | 'android';
  timezone?: string;
}

export interface SignInInput extends DeviceFields {
  identifier: string;
  password: string;
}

export interface SignUpInput extends DeviceFields {
  fullName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
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
  fcmToken: string;
  platform: 'ios' | 'android';
  timezone: string;
}

export interface AuthContextValue {
  status: AuthStatus;
  auth: AuthData | null;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isAuthMutationPending: boolean;
  signIn: (input: SignInInput) => Promise<AuthData>;
  signUp: (input: SignUpInput) => Promise<AuthData>;
  signInWithGoogle: () => Promise<AuthData | null>;
  completePhoneProfile: (input: CompletePhoneInput) => Promise<AuthData>;
  signOut: () => Promise<void>;
}
