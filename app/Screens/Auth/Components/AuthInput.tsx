import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';
import React, { forwardRef, useState } from 'react';
import {
  KeyboardTypeOptions,
  StyleSheet,
  Text,
  TextInput,
  View,
  ReturnKeyTypeOptions,
} from 'react-native';

interface AuthInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (value: string) => void;
  iconName: keyof typeof Ionicons.glyphMap;
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  returnKeyType?: ReturnKeyTypeOptions;
  onSubmitEditing?: () => void;
  blurOnSubmit?: boolean;
}

const AuthInput = forwardRef<TextInput, AuthInputProps>(
  (
    {
      label,
      placeholder,
      value,
      onChangeText,
      iconName,
      keyboardType = 'default',
      secureTextEntry = false,
      autoCapitalize = 'none',
      returnKeyType = 'done',
      onSubmitEditing,
      blurOnSubmit = true,
    },
    ref,
  ) => {
    const colors = useThemeColors();
    const { theme } = useAppContext();
    const [isFocused, setIsFocused] = useState(false);
    const [isHidden, setIsHidden] = useState(secureTextEntry);
    const surfaceColor = colors.contactBackground;
    const inputTextColor = theme === 'dark' ? colors.white : colors.text;
    const placeholderColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.58)' : 'rgba(0, 0, 0, 0.45)';

    return (
      <View style={styles.wrapper}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: surfaceColor,
            },
          ]}
        >
          <Ionicons
            name={iconName}
            size={22}
            color={isFocused ? colors.darkBlue : placeholderColor}
          />

          <TextInput
            ref={ref}
            autoCapitalize={autoCapitalize}
            autoCorrect={false}
            keyboardType={keyboardType}
            onBlur={() => setIsFocused(false)}
            onChangeText={onChangeText}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            secureTextEntry={isHidden}
            returnKeyType={returnKeyType}
            onSubmitEditing={onSubmitEditing}
            style={[styles.input, { color: inputTextColor }]}
            value={value}
          />

          {secureTextEntry ? (
            <Ionicons
              name={isHidden ? 'eye-outline' : 'eye-off-outline'}
              size={22}
              color={placeholderColor}
              onPress={() => setIsHidden((current) => !current)}
            />
          ) : null}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.Bold,
  },
  inputContainer: {
    minHeight: 62,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    fontFamily: FONTS.Medium,
    paddingVertical: 14,
  },
});

export default AuthInput;
