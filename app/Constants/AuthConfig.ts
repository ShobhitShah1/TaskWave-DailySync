const normalize = (value?: string) => value?.trim() ?? '';
const defaultGoogleWebClientId =
  '965182017324-b98namhrmi7sa4ise5t89bk00lhssvej.apps.googleusercontent.com';

const apiBaseUrl = 'https://nirvanatechlabs.in/dailysync';
// const apiBaseUrl = 'http://192.168.29.87:4000';

export const authConfig = {
  apiBaseUrl,
  google: {
    iosClientId: normalize(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
    webClientId:
      normalize(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) || defaultGoogleWebClientId,
    scopes: ['openid', 'email', 'profile'],
  },
} as const;

export const getAuthApiBaseUrl = () => {
  if (!authConfig.apiBaseUrl) {
    throw new Error('EXPO_PUBLIC_AUTH_API_URL is missing. Point the app to your backend first.');
  }

  return authConfig.apiBaseUrl;
};
