import { getAuthApiBaseUrl } from '@Constants/AuthConfig';
import { apiClient, toApiError } from '@Services/ApiClient';
import {
  CompletePhoneInput,
  DeviceRegistrationInput,
  AuthData,
  GoogleAuthPayload,
  SignInInput,
  SignUpInput,
} from '@Types/Auth';

interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
}

type AuthResponseBody = ApiResponse<AuthData>;
type MeResponseBody = ApiResponse<AuthData['user']>;
type DeviceResponseBody = ApiResponse<{ success: boolean }>;
type SignOutResponseBody = ApiResponse<{ success: boolean }>;
type CompletePhoneResponseBody = ApiResponse<AuthData>;

export const authApi = {
  signUp: async (input: SignUpInput) => {
    try {
      const response = await apiClient.post<AuthResponseBody>('/api/auth/register', {
        ...input,
        fullName: input.fullName.trim(),
        email: input.email.trim().toLowerCase(),
        phoneCountryCode: input.phoneCountryCode.trim(),
        phoneNumber: input.phoneNumber.trim(),
      });

      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
  signIn: async (input: SignInInput) => {
    try {
      const response = await apiClient.post<AuthResponseBody>('/api/auth/login', {
        ...input,
        identifier: input.identifier.trim(),
      });

      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
  signInWithGoogle: async (payload: GoogleAuthPayload) => {
    try {
      const response = await apiClient.post<AuthResponseBody>('/api/auth/google', {
        ...payload,
      });

      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<MeResponseBody>('/api/auth/me');

      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
  completePhoneProfile: async (input: CompletePhoneInput) => {
    try {
      const response = await apiClient.patch<CompletePhoneResponseBody>('/api/auth/phone', {
        phoneCountryCode: input.phoneCountryCode.trim(),
        phoneNumber: input.phoneNumber.trim(),
      });

      return response.data.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
  signOut: async () => {
    try {
      await apiClient.post<SignOutResponseBody>('/api/auth/logout');
    } catch (error) {
      throw toApiError(error);
    }
  },

  registerDevice: async (device: DeviceRegistrationInput) => {
    try {
      await apiClient.post<DeviceResponseBody>('/api/devices/register', device);
    } catch (error) {
      throw toApiError(error);
    }
  },
  assertConfigured: () => {
    return getAuthApiBaseUrl();
  },
};
