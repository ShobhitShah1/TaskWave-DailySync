import { authConfig } from '@Constants/AuthConfig';
import { OneTapResponse, GoogleAuth } from 'react-native-google-auth';
import { Platform } from 'react-native';

let googleAuthConfigured = false;

export const configureGoogleAuth = async () => {
  if (googleAuthConfigured) {
    return;
  }

  const config = {
    scopes: authConfig.google.scopes,
    credentialManagerMode: 'auto' as const,
    forceAccountPicker: true,
    ...(authConfig.google.iosClientId ? { iosClientId: authConfig.google.iosClientId } : {}),
    ...(authConfig.google.androidClientId
      ? { androidClientId: authConfig.google.androidClientId }
      : {}),
    ...(authConfig.google.webClientId ? { webClientId: authConfig.google.webClientId } : {}),
  };

  console.log('[GoogleAuthService] Configuring with:', config);
  await GoogleAuth.configure(config);

  googleAuthConfigured = true;
};

export const startGoogleSignIn = async (): Promise<OneTapResponse> => {
  console.log('[GoogleAuthService] Starting Sign-In flow...');
  await configureGoogleAuth();

  if (Platform.OS === 'android') {
    console.log('[GoogleAuthService] Checking Play Services...');
    await GoogleAuth.checkPlayServices(true);
  }

  console.log('[GoogleAuthService] Calling GoogleAuth.signIn()...');
  try {
    const response = await GoogleAuth.signIn();
    console.log('[GoogleAuthService] Sign-In Success:', response);
    return response;
  } catch (error) {
    console.error('[GoogleAuthService] Sign-In Error:', error);
    throw error;
  }
};

export const signOutFromGoogle = async () => {
  if (!googleAuthConfigured) {
    return;
  }

  await GoogleAuth.signOut();
};
