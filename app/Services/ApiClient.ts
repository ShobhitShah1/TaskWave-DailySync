import axios, { AxiosError } from 'axios';
import { getAuthApiBaseUrl } from '@Constants/AuthConfig';

type ApiErrorPayload = {
  message?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export const apiClient = axios.create({
  baseURL: getAuthApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

import { authStorage } from '@Utils/authStorage';

// Request Logger & Auth Injector
apiClient.interceptors.request.use((config) => {
  const auth = authStorage.getAuth();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
    data: config.data,
    params: config.params,
    headers: config.headers,
  });
  return config;
});

type AuthErrorListener = () => void;
let authErrorListener: AuthErrorListener | null = null;

export const setAuthErrorListener = (listener: AuthErrorListener) => {
  authErrorListener = listener;
};

// Response Interceptor for 401s
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Response] ${response.status} ${response.config.url}`, {
      data: response.data,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      console.log(`[API Error Response] ${error.response.status} ${error.config?.url}`, {
        data: error.response.data,
      });

      // Handle global logout on 401
      if (error.response.status === 401 && authErrorListener) {
        console.log('[API Interceptor] 401 detected, triggering global logout.');
        authErrorListener();
      }
    } else {
      console.log(`[API Error] ${error.message}`, { config: error.config });
    }
    return Promise.reject(error);
  },
);

export const toApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof AxiosError) {
    const payload = error.response?.data as ApiErrorPayload | undefined;
    return new ApiError(
      payload?.message || error.message || 'Request failed.',
      error.response?.status || 0,
    );
  }

  if (error instanceof Error) {
    return new ApiError(error.message);
  }

  return new ApiError('Request failed.');
};
