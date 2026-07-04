import { APP_CONFIG } from '@Constants/AppConfig';
import { FONTS } from '@Constants/Theme';
import { useAuth } from '@Hooks/useAuth';
import useThemeColors from '@Hooks/useThemeMode';
import React, { useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import AuthButton from './Components/AuthButton';
import AuthDivider from './Components/AuthDivider';
import AuthGoogleButton from './Components/AuthGoogleButton';
import AuthScreenLayout from './Components/AuthScreenLayout';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to continue.';

const SignInScreen = () => {
  const colors = useThemeColors();
  const { continueAsGuest, signInWithGoogle } = useAuth();

  const [isGuestSubmitting, setIsGuestSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const handleGuestSubmit = async () => {
    try {
      setIsGuestSubmitting(true);
      await continueAsGuest();
    } catch (error) {
      showMessage({ message: getErrorMessage(error), type: 'danger' });
    } finally {
      setIsGuestSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    try {
      setIsGoogleSubmitting(true);
      await signInWithGoogle();
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Google sign-in failed.',
        type: 'danger',
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      type="signIn"
      iconName="notifications-outline"
      subtitle="Sign in to Sync Alarm"
      title="Continue to DailySync"
      footer={
        <Text style={[styles.legalText, { color: colors.grayTitle }]}>
          By continuing, you agree to our{' '}
          <Text
            style={[styles.legalLink, { color: colors.darkBlue }]}
            onPress={() => Linking.openURL(APP_CONFIG.privacyPolicyUrl)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      }
    >
      <View style={styles.form}>
        <AuthGoogleButton
          loading={isGoogleSubmitting}
          onPress={handleGoogleSubmit}
          title="Continue with Google"
        />

        <AuthDivider label="or" />

        <AuthButton loading={isGuestSubmitting} onPress={handleGuestSubmit} title="Skip for now" />
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 18,
    paddingTop: 4,
  },
  legalText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  legalLink: {
    fontFamily: FONTS.Bold,
  },
});

export default SignInScreen;
