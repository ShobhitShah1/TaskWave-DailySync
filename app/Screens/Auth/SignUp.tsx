import { APP_CONFIG } from '@Constants/AppConfig';
import { FONTS } from '@Constants/Theme';
import { useAuth } from '@Hooks/useAuth';
import useThemeColors from '@Hooks/useThemeMode';
import useNotificationPermission from '@Hooks/useNotificationPermission';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { RootStackParamList } from '@Types/Interface';
import { validateSignUpInput } from '@Utils/authValidators';
import AuthButton from './Components/AuthButton';
import AuthCard from './Components/AuthCard';
import AuthDivider from './Components/AuthDivider';
import AuthGoogleButton from './Components/AuthGoogleButton';
import AuthInput from './Components/AuthInput';
import AuthPhoneInput from './Components/AuthPhoneInput';
import AuthScreenLayout from './Components/AuthScreenLayout';
import { normalizePhoneCountryCode, normalizePhoneNumber } from '@Utils/phoneNumber';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to create account.';

const SignUpScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signInWithGoogle, signUp } = useAuth();
  const { requestPermission: requestNotificationPermission } = useNotificationPermission();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phoneCountryCode: '+91',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    const validationMessage = validateSignUpInput(form);

    if (validationMessage) {
      showMessage({ message: validationMessage, type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      await requestNotificationPermission();
      await signUp(form);
    } catch (error) {
      showMessage({ message: getErrorMessage(error), type: 'danger' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSubmit = async () => {
    try {
      setIsGoogleSubmitting(true);
      await requestNotificationPermission();
      await signInWithGoogle();
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Google sign-up failed.',
        type: 'danger',
      });
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <AuthScreenLayout
      iconName="person-add-outline"
      subtitle="Join Sync Alarm today"
      title="Create account"
      type="signUp"
      footer={
        <View style={styles.footerRow}>
          <Text style={[styles.footerText, { color: colors.grayTitle }]}>
            Already have an account?
          </Text>
          <Pressable onPress={() => navigation.navigate('SignIn')}>
            <Text style={[styles.footerLink, { color: colors.darkBlue }]}>Sign In</Text>
          </Pressable>
        </View>
      }
    >
      <View style={styles.form}>
        <AuthInput
          autoCapitalize="words"
          iconName="person-outline"
          label="FULL NAME"
          onChangeText={(fullName) => setForm((current) => ({ ...current, fullName }))}
          placeholder="John Doe"
          value={form.fullName}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
        />

        <AuthInput
          ref={emailRef}
          autoCapitalize="none"
          iconName="mail-outline"
          keyboardType="email-address"
          label="EMAIL"
          onChangeText={(email) => setForm((current) => ({ ...current, email }))}
          placeholder="your@email.com"
          value={form.email}
          returnKeyType="next"
          blurOnSubmit
        />

        <AuthPhoneInput
          label="PHONE NUMBER"
          countryCode={form.phoneCountryCode}
          phoneNumber={form.phoneNumber}
          onChangeCountryCode={(phoneCountryCode) =>
            setForm((current) => ({
              ...current,
              phoneCountryCode: normalizePhoneCountryCode(phoneCountryCode),
            }))
          }
          onChangePhoneNumber={(phoneNumber) =>
            setForm((current) => ({
              ...current,
              phoneNumber: normalizePhoneNumber(phoneNumber),
            }))
          }
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <AuthInput
          ref={passwordRef}
          autoCapitalize="none"
          iconName="lock-closed-outline"
          label="PASSWORD"
          onChangeText={(password) => setForm((current) => ({ ...current, password }))}
          placeholder="Min. 8 characters"
          secureTextEntry
          value={form.password}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <AuthInput
          ref={confirmPasswordRef}
          autoCapitalize="none"
          iconName="lock-closed-outline"
          label="CONFIRM PASSWORD"
          onChangeText={(confirmPassword) =>
            setForm((current) => ({ ...current, confirmPassword }))
          }
          placeholder="Repeat password"
          secureTextEntry
          value={form.confirmPassword}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <AuthButton loading={isSubmitting} onPress={handleSubmit} title="Create Account" />

        <AuthDivider label="or sign up with" />

        <AuthGoogleButton
          loading={isGoogleSubmitting}
          onPress={handleGoogleSubmit}
          title="Sign up with Google"
        />
      </View>

      <Text style={[styles.legalText, { color: colors.grayTitle }]}>
        By signing up, you agree to our{' '}
        <Text
          style={[styles.legalLink, { color: colors.darkBlue }]}
          onPress={() => Linking.openURL(APP_CONFIG.privacyPolicyUrl)}
        >
          Privacy Policy
        </Text>
        .
      </Text>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 16,
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
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  footerLink: {
    fontSize: 16,
    fontFamily: FONTS.Bold,
  },
});

export default SignUpScreen;
