import { FONTS } from '@Constants/Theme';
import { useAuth } from '@Hooks/useAuth';
import useThemeColors from '@Hooks/useThemeMode';
import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import {
  validatePhoneInput,
  normalizePhoneCountryCode,
  normalizePhoneNumber,
} from '@Utils/phoneNumber';
import AuthButton from './Components/AuthButton';
import AuthCard from './Components/AuthCard';
import AuthPhoneInput from './Components/AuthPhoneInput';
import AuthScreenLayout from './Components/AuthScreenLayout';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unable to save phone number.';

const CompleteProfileScreen = () => {
  const colors = useThemeColors();
  const { auth, completePhoneProfile, isAuthMutationPending } = useAuth();

  const [phoneCountryCode, setPhoneCountryCode] = useState(auth?.user.phoneCountryCode || '+91');
  const [phoneNumber, setPhoneNumber] = useState(auth?.user.phoneNumber || '');

  const helperText = useMemo(() => {
    return auth?.user.provider === 'google'
      ? 'Add your phone number to continue with shared alarms and invitations.'
      : 'Add your phone number to finish your account setup.';
  }, [auth?.user.provider]);

  const handleSubmit = async () => {
    const validationMessage = validatePhoneInput(phoneCountryCode, phoneNumber);

    if (validationMessage) {
      showMessage({ message: validationMessage, type: 'warning' });
      return;
    }

    try {
      await completePhoneProfile({
        phoneCountryCode,
        phoneNumber,
      });
    } catch (error) {
      showMessage({ message: getErrorMessage(error), type: 'danger' });
    }
  };

  return (
    <AuthScreenLayout
      centerContent
      iconName="call-outline"
      subtitle={helperText}
      title="Add phone number"
      footer={
        <Text style={[styles.footerText, { color: colors.grayTitle }]}>
          We keep the number separate with country code so contacts and alarm invites stay reliable
          later.
        </Text>
      }
    >
      <AuthCard>
        <View style={styles.form}>
          <AuthPhoneInput
            label="PHONE NUMBER"
            countryCode={phoneCountryCode}
            phoneNumber={phoneNumber}
            onChangeCountryCode={(value) => setPhoneCountryCode(normalizePhoneCountryCode(value))}
            onChangePhoneNumber={(value) => setPhoneNumber(normalizePhoneNumber(value))}
            onSubmitEditing={handleSubmit}
          />

          <AuthButton loading={isAuthMutationPending} onPress={handleSubmit} title="Continue" />
        </View>
      </AuthCard>
    </AuthScreenLayout>
  );
};

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
  footerText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
});

export default CompleteProfileScreen;
