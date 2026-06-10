declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_AUTH_API_URL?: string;
    EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
    EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
    GOOGLE_CLIENT_ID_ANDROID?: string;
    GOOGLE_CLIENT_ID_IOS?: string;
    GOOGLE_CLIENT_ID_WEB?: string;
    JWT_SECRET?: string;
    PORT?: string;
  }
}
