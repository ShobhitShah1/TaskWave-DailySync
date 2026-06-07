import { GoogleAuthScopes } from 'react-native-google-auth';

const normalize = (value?: string) => value?.trim() ?? '';

const apiBaseUrl = 'http://nirvanatechlabs.in/dailysync';

export const authConfig = {
  apiBaseUrl,
  google: {
    androidClientId: normalize(process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID),
    iosClientId: normalize(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
    webClientId: normalize(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
    scopes: [GoogleAuthScopes.OPENID, GoogleAuthScopes.EMAIL, GoogleAuthScopes.PROFILE] as string[],
  },
} as const;

export const getAuthApiBaseUrl = () => {
  if (!authConfig.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_AUTH_API_URL is missing. Point the app to your backend first.');
  }

  return authConfig.apiBaseUrl;
};
