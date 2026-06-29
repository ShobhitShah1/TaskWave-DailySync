import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AuthScreenLayoutProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  footer?: React.ReactNode;
  header?: React.ReactNode;
  centerContent?: boolean;
  type: 'signIn' | 'profile' | 'onBoarding';
}

const AuthScreenLayout: React.FC<React.PropsWithChildren<AuthScreenLayoutProps>> = ({
  centerContent = false,
  children,
  footer,
  header,
  iconName,
  subtitle,
  title,
  type,
}) => {
  const colors = useThemeColors();
  const { top } = useSafeAreaInsets();

  return (
    <View style={[styles.safeArea, { backgroundColor: colors.background, paddingTop: top }]}>
      <KeyboardAwareScrollView
        bounces={false}
        contentContainerStyle={[styles.contentContainer, centerContent && styles.centeredContent]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        {header ? <View style={styles.header}>{header}</View> : null}

        {type === 'signIn' ? (
          <View style={{ marginVertical: 10 }}>
            <Image
              source={AssetsPath.login}
              style={{ width: '100%', height: 280 }}
              resizeMode="contain"
            />
          </View>
        ) : (
          <View style={styles.hero}>
            <Image source={AssetsPath.appLogoAndroid} style={{ width: 60, height: 60 }} />
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: colors.grayTitle }]}>{subtitle}</Text>
          </View>
        )}

        {children}

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 22,
    gap: 18,
  },
  header: {
    paddingTop: 4,
  },
  centeredContent: {
    justifyContent: 'center',
  },
  hero: {
    gap: 5,
    paddingTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontFamily: FONTS.Bold,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 16,
  },
});

export default AuthScreenLayout;
