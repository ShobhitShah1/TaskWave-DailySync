import { authConfig } from '@Constants/AuthConfig';
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
  type NativeModuleError,
} from '@react-native-google-signin/google-signin';

let googleAuthConfigured = false;

export type GoogleSignInResult =
  | { type: 'cancelled' }
  | {
      type: 'success';
      data: {
        idToken: string;
        accessToken: string | null;
        user: {
          id: string;
          email: string;
          name: string | null;
          photo: string | null;
        };
      };
    };

const getGoogleSignInError = (error: unknown) => {
  if (!isErrorWithCode(error)) {
    return error;
  }

  const messages: Partial<Record<NativeModuleError['code'], string>> = {
    [statusCodes.IN_PROGRESS]: 'Google sign-in is already in progress.',
    [statusCodes.PLAY_SERVICES_NOT_AVAILABLE]: 'Google Play Services is missing or out of date.',
  };

  return new Error(
    messages[error.code] ??
      `Google sign-in failed (${error.code}). Check the Android OAuth SHA-1 configuration.`,
  );
};

export const configureGoogleAuth = () => {
  if (googleAuthConfigured) {
    return;
  }

  if (!authConfig.google.webClientId) {
    throw new Error(
      'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing. Use the Web OAuth client ID from google-services.json.',
    );
  }

  GoogleSignin.configure({
    scopes: [...authConfig.google.scopes],
    webClientId: authConfig.google.webClientId,
    offlineAccess: false,
    ...(authConfig.google.iosClientId ? { iosClientId: authConfig.google.iosClientId } : {}),
  });

  googleAuthConfigured = true;
};

export const startGoogleSignIn = async (): Promise<GoogleSignInResult> => {
  configureGoogleAuth();

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    if (response.type === 'cancelled') {
      return { type: 'cancelled' };
    }

    if (!response.data.idToken) {
      throw new Error(
        'Google did not return an ID token. Verify EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID.',
      );
    }

    const tokens = await GoogleSignin.getTokens().catch(() => null);

    return {
      type: 'success',
      data: {
        idToken: response.data.idToken,
        accessToken: tokens?.accessToken ?? null,
        user: response.data.user,
      },
    };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw getGoogleSignInError(error);
  }
};

export const signOutFromGoogle = async () => {
  configureGoogleAuth();
  await GoogleSignin.signOut();
};
