import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AUTH_QUERY_KEYS } from '@Constants/AuthQueryKeys';
import { authApi } from '@Services/AuthService';
import { setAuthErrorListener } from '@Services/ApiClient';

import { startGoogleSignIn, signOutFromGoogle } from '@Services/GoogleAuthService';
import {
  subscribeToPushTokenRefresh,
  syncPushToken,
  getRegistrationPayload,
} from '@Services/PushTokenService';
import { AuthContextValue, AuthData, CompletePhoneInput } from '@Types/Auth';
import { authStorage } from '@Utils/authStorage';
import { getOrCreateDeviceId } from '@Utils/deviceIdentity';
import React, { createContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [status, setStatus] = useState<'loading' | 'signedOut' | 'signedIn'>('loading');
  const [auth, setAuth] = useState<AuthData | null>(null);
  const queryClient = useQueryClient();

  const persistAuth = (nextAuth: AuthData) => {
    authStorage.setAuth(nextAuth);
    setAuth(nextAuth);
    setStatus('signedIn');
    queryClient.setQueryData(AUTH_QUERY_KEYS.auth, nextAuth);
    queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, nextAuth.user);
    return nextAuth;
  };

  const clearAuth = () => {
    authStorage.clearAuth();
    setAuth(null);
    setStatus('signedOut');
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.auth });
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEYS.currentUser });
  };

  const isProfileComplete =
    auth?.user.provider === 'guest' ||
    Boolean(auth?.user.phoneCountryCode && auth?.user.phoneNumber);

  useEffect(() => {
    const authOnMount = authStorage.getAuth();

    if (authOnMount) {
      setAuth(authOnMount);
      setStatus('signedIn');
      queryClient.setQueryData(AUTH_QUERY_KEYS.auth, authOnMount);
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, authOnMount.user);

      authApi
        .getCurrentUser()
        .then((freshUser) => {
          const updatedAuth = { ...authOnMount, user: freshUser };
          persistAuth(updatedAuth);

          syncPushToken(freshUser.fcmToken)
            .then((newToken) => {
              if (newToken) {
                persistAuth({
                  ...updatedAuth,
                  user: { ...freshUser, fcmToken: newToken },
                });
              }
            })
            .catch(() => undefined);
        })
        .catch(() => {
          clearAuth();
        });
    } else {
      setStatus('signedOut');
    }
  }, []);

  useEffect(() => {
    if (!auth?.accessToken) {
      return;
    }

    const unsubscribe = subscribeToPushTokenRefresh((newToken) => {
      persistAuth({
        ...auth,
        user: { ...auth.user, fcmToken: newToken },
      });
    });

    return unsubscribe;
  }, [auth?.accessToken]);

  const guestMutation = useMutation({
    mutationKey: ['auth', 'guest'],
    mutationFn: async () => {
      const deviceId = await getOrCreateDeviceId();
      const device = await getRegistrationPayload(false);
      return authApi.continueAsGuest({
        deviceId,
        ...(device || {}),
      });
    },
    onSuccess: persistAuth,
  });

  const googleMutation = useMutation({
    mutationKey: ['auth', 'google'],
    mutationFn: async () => {
      const result = await startGoogleSignIn();

      if (result.type === 'cancelled') {
        return null;
      }

      const deviceId = await getOrCreateDeviceId();
      const device = await getRegistrationPayload(true);
      return authApi.signInWithGoogle({
        deviceId,
        idToken: result.data.idToken,
        accessToken: result.data.accessToken,
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.name,
          photo: result.data.user.photo,
        },
        ...(device || {}),
      });
    },

    onSuccess: (nextAuth) => {
      if (nextAuth) {
        persistAuth(nextAuth);
      }
    },
  });

  const completePhoneMutation = useMutation({
    mutationKey: ['auth', 'complete-phone'],
    mutationFn: async (input: CompletePhoneInput) => {
      return authApi.completePhoneProfile(input);
    },
    onSuccess: persistAuth,
  });

  const signInWithGoogle = async () => {
    return googleMutation.mutateAsync();
  };

  const continueAsGuest = async () => {
    return guestMutation.mutateAsync();
  };

  const completePhoneProfile = async (input: CompletePhoneInput) => {
    return completePhoneMutation.mutateAsync(input);
  };

  const signOut = async () => {
    const currentAuth = auth;

    clearAuth();

    if (currentAuth?.user.provider === 'google') {
      await signOutFromGoogle().catch(() => undefined);
    }

    if (currentAuth?.accessToken) {
      await authApi.signOut().catch(() => undefined);
    }
  };

  useEffect(() => {
    setAuthErrorListener(clearAuth);
    return () => setAuthErrorListener(() => undefined);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      auth,
      isAuthenticated: Boolean(auth),
      isProfileComplete,
      isAuthMutationPending:
        guestMutation.isPending || googleMutation.isPending || completePhoneMutation.isPending,
      signInWithGoogle,
      continueAsGuest,
      completePhoneProfile,
      signOut,
    }),
    [
      completePhoneMutation.isPending,
      guestMutation.isPending,
      googleMutation.isPending,
      auth,
      isProfileComplete,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
