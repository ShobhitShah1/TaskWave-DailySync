import { APP_CONFIG } from '@Constants/AppConfig';
import { FONTS } from '@Constants/Theme';
import { useAuth } from '@Hooks/useAuth';
import useThemeColors from '@Hooks/useThemeMode';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { RootStackParamList } from '@Types/Interface';
import { validateSignInInput } from '@Utils/authValidators';
import AuthButton from './Components/AuthButton';
import AuthCard from './Components/AuthCard';
import AuthDivider from './Components/AuthDivider';
import AuthGoogleButton from './Components/AuthGoogleButton';
import AuthInput from './Components/AuthInput';
import AuthScreenLayout from './Components/AuthScreenLayout';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to sign in.';

const SignInScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { signIn, signInWithGoogle } = useAuth();

  const [form, setForm] = useState({
    identifier: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const passwordRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    const validationMessage = validateSignInInput(form);

    if (validationMessage) {
      showMessage({ message: validationMessage, type: 'warning' });
      return;
    }

    try {
      setIsSubmitting(true);
      await signIn(form);
    } catch (error) {
      showMessage({ message: getErrorMessage(error), type: 'danger' });
    } finally {
      setIsSubmitting(false);
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
      // centerContent
      type="signIn"
      iconName="notifications-outline"
      subtitle="Sign in to Sync Alarm"
      title="Welcome back"
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
        <AuthInput
          autoCapitalize="none"
          iconName="person-outline"
          label="EMAIL OR USERNAME"
          onChangeText={(identifier) => setForm((current) => ({ ...current, identifier }))}
          placeholder="your@email.com or username"
          value={form.identifier}
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
        />

        <AuthInput
          ref={passwordRef}
          autoCapitalize="none"
          iconName="lock-closed-outline"
          label="PASSWORD"
          onChangeText={(password) => setForm((current) => ({ ...current, password }))}
          placeholder="Enter your password"
          secureTextEntry
          value={form.password}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <Pressable
          onPress={() =>
            showMessage({
              message: 'Reset password will be added with the backend email flow.',
              type: 'info',
            })
          }
        >
          <Text style={[styles.forgotPassword, { color: colors.darkBlue }]}>Forgot password?</Text>
        </Pressable>

        <AuthButton loading={isSubmitting} onPress={handleSubmit} title="Sign In" />

        <AuthDivider label="or continue with" />

        <AuthGoogleButton
          loading={isGoogleSubmitting}
          onPress={handleGoogleSubmit}
          title="Continue with Google"
        />
      </View>

      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.grayTitle }]}>Don't have an account?</Text>
        <Pressable onPress={() => navigation.navigate('SignUp')}>
          <Text style={[styles.footerLink, { color: colors.darkBlue }]}>Sign Up</Text>
        </Pressable>
      </View>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  forgotPassword: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
    textAlign: 'right',
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
    justifyContent: 'center',
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

export default SignInScreen;
