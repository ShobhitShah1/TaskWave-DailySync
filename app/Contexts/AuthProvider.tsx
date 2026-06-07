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
import {
  AuthContextValue,
  AuthData,
  CompletePhoneInput,
  SignInInput,
  SignUpInput,
} from '@Types/Auth';
import { authStorage } from '@Utils/authStorage';
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

  const isProfileComplete = Boolean(auth?.user.phoneCountryCode && auth?.user.phoneNumber);

  useEffect(() => {
    const authOnMount = authStorage.getAuth();

    if (authOnMount) {
      setAuth(authOnMount);
      setStatus('signedIn');
      queryClient.setQueryData(AUTH_QUERY_KEYS.auth, authOnMount);
      queryClient.setQueryData(AUTH_QUERY_KEYS.currentUser, authOnMount.user);

      // Fetch fresh profile from API to validate session and get current DB fcmToken
      authApi
        .getCurrentUser()
        .then((freshUser) => {
          const updatedAuth = { ...authOnMount, user: freshUser };
          persistAuth(updatedAuth);

          // Check if the actual device token matches the one in the database
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

  const signInMutation = useMutation({
    mutationKey: ['auth', 'sign-in'],
    mutationFn: async (input: SignInInput) => {
      const device = await getRegistrationPayload();
      return authApi.signIn({ ...input, ...(device || {}) });
    },
    onSuccess: persistAuth,
  });

  const signUpMutation = useMutation({
    mutationKey: ['auth', 'sign-up'],
    mutationFn: async (input: SignUpInput) => {
      const device = await getRegistrationPayload(true);
      return authApi.signUp({ ...input, ...(device || {}) });
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

      if (result.type === 'noSavedCredentialFound') {
        throw new Error('No Google account is available on this device.');
      }

      const device = await getRegistrationPayload(true);
      return authApi.signInWithGoogle({
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

  const signIn = async (input: SignInInput) => {
    return signInMutation.mutateAsync(input);
  };

  const signUp = async (input: SignUpInput) => {
    return signUpMutation.mutateAsync(input);
  };

  const signInWithGoogle = async () => {
    return googleMutation.mutateAsync();
  };

  const completePhoneProfile = async (input: CompletePhoneInput) => {
    return completePhoneMutation.mutateAsync(input);
  };

  const signOut = async () => {
    try {
      if (auth?.accessToken) {
        await authApi.signOut().catch(() => undefined);
      }

      if (auth?.user.provider === 'google') {
        await signOutFromGoogle();
      }
    } finally {
      clearAuth();
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
        signInMutation.isPending ||
        signUpMutation.isPending ||
        googleMutation.isPending ||
        completePhoneMutation.isPending,
      signIn,
      signUp,
      signInWithGoogle,
      completePhoneProfile,
      signOut,
    }),
    [
      completePhoneMutation.isPending,
      googleMutation.isPending,
      auth,
      isProfileComplete,
      signInMutation.isPending,
      signUpMutation.isPending,
      status,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext };
