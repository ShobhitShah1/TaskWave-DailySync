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

apiClient.interceptors.request.use((config) => {
  const auth = authStorage.getAuth();
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  return config;
});

type AuthErrorListener = () => void;
let authErrorListener: AuthErrorListener | null = null;

export const setAuthErrorListener = (listener: AuthErrorListener) => {
  authErrorListener = listener;
};

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 401 && authErrorListener) {
        authErrorListener();
      }
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
