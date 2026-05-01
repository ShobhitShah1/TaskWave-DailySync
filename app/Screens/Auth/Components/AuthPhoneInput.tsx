import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';
import React, { useMemo, useState } from 'react';
import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface AuthPhoneInputProps {
  label: string;
  countryCode: string;
  phoneNumber: string;
  onChangeCountryCode: (value: string) => void;
  onChangePhoneNumber: (value: string) => void;
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  keyboardType?: KeyboardTypeOptions;
}

const AuthPhoneInput: React.FC<AuthPhoneInputProps> = ({
  label,
  countryCode,
  phoneNumber,
  onChangeCountryCode,
  onChangePhoneNumber,
  returnKeyType = 'done',
  onSubmitEditing,
  keyboardType = 'phone-pad',
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const [isFocused, setIsFocused] = useState(false);

  const placeholderColor = useMemo(
    () => (theme === 'dark' ? 'rgba(255, 255, 255, 0.58)' : 'rgba(0, 0, 0, 0.45)'),
    [theme],
  );

  const inputTextColor = theme === 'dark' ? colors.white : colors.text;

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

      <View style={[styles.container, { backgroundColor: colors.contactBackground }]}>
        <Ionicons
          name="call-outline"
          size={22}
          color={isFocused ? colors.darkBlue : placeholderColor}
        />

        <View style={styles.dividerWrap}>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="phone-pad"
            maxLength={5}
            onBlur={() => setIsFocused(false)}
            onChangeText={onChangeCountryCode}
            onFocus={() => setIsFocused(true)}
            placeholder="+91"
            placeholderTextColor={placeholderColor}
            style={[styles.countryCodeInput, { color: inputTextColor }]}
            value={countryCode}
          />
          <View style={[styles.divider, { backgroundColor: colors.borderColor }]} />
        </View>

        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          onBlur={() => setIsFocused(false)}
          onChangeText={onChangePhoneNumber}
          onFocus={() => setIsFocused(true)}
          placeholder="Phone number"
          placeholderTextColor={placeholderColor}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          style={[styles.phoneInput, { color: inputTextColor }]}
          value={phoneNumber}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.Bold,
  },
  container: {
    minHeight: 62,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countryCodeInput: {
    width: 50,
    fontSize: 17,
    fontFamily: FONTS.Medium,
    paddingVertical: 14,
  },
  divider: {
    width: 1,
    height: 24,
    marginHorizontal: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.Medium,
    paddingVertical: 14,
  },
});

export default AuthPhoneInput;
