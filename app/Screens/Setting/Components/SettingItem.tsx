import { Ionicons } from '@expo/vector-icons';
import React, { FC, memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';

interface SettingProps {
  icon?: number;
  ionicon?: keyof typeof Ionicons.glyphMap;
  ioniconColor?: string;
  title: string;
  subtitle?: string;
  showAlert?: boolean;
  variant?: 'default' | 'premium';
  badgeText?: string;
  onPress: () => void;
}

const SettingItem: FC<SettingProps> = ({
  icon,
  ionicon,
  ioniconColor,
  title,
  subtitle,
  showAlert,
  variant = 'default',
  badgeText,
  onPress,
}) => {
  const style = styles();
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const isLastItems = title === 'Portfolio' || title === 'How app works';

  const isPremiumCard = variant === 'premium';

  return (
    <Pressable
      style={[style.itemContainer, isPremiumCard && style.premiumContainer]}
      onPress={onPress}
    >
      <View style={[style.iconContainer, isPremiumCard && style.premiumIconContainer]}>
        {ionicon ? (
          <Ionicons
            name={ionicon}
            size={20}
            color={isPremiumCard ? colors.white : ioniconColor || colors.darkBlue}
          />
        ) : icon ? (
          <Image
            source={icon}
            tintColor={
              isPremiumCard ? colors.white : theme === 'dark' ? colors.white : colors.black
            }
            style={{
              width: title === 'Location Radius' ? 26 : isLastItems ? 20 : 22,
              height: title === 'Location Radius' ? 26 : isLastItems ? 20 : 22,
            }}
            resizeMode="contain"
          />
        ) : null}
      </View>
      <View style={style.textContainer}>
        <Text style={[style.title, isPremiumCard && style.premiumTitle]}>{title}</Text>
        {subtitle && (
          <Text
            style={[
              style.subtitle,
              isPremiumCard
                ? style.premiumSubtitle
                : { color: showAlert ? ioniconColor || colors.darkBlue : colors.grayTitle },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {badgeText && (
        <View style={[style.badge, isPremiumCard && style.premiumBadge]}>
          <Text style={[style.badgeText, isPremiumCard && style.premiumBadgeText]}>
            {badgeText}
          </Text>
        </View>
      )}
      {showAlert && (
        <View style={style.alertBadge}>
          <View style={[style.alertDot, { backgroundColor: ioniconColor || colors.darkBlue }]} />
        </View>
      )}
      {!isPremiumCard && (
        <Image
          resizeMode="contain"
          source={AssetsPath.ic_leftArrow}
          tintColor={theme === 'dark' ? colors.white : colors.black}
          style={[style.arrow, { transform: [{ rotate: '180deg' }] }]}
        />
      )}
    </Pressable>
  );
};

const styles = () => {
  const { theme } = useAppContext();
  const colors = useThemeColors();

  return StyleSheet.create({
    itemContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 13,
      paddingHorizontal: 10,
      borderRadius: 15,
      alignSelf: 'center',
      borderWidth: 0.5,
      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(251, 252, 255, 1)',
      borderColor: theme === 'dark' ? 'rgba(159, 165, 170, 1)' : 'rgba(211, 218, 252, 1)',
    },
    premiumContainer: {
      minHeight: 92,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.darkBlue,
      borderColor: colors.darkBlue,
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    iconContainer: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
    },
    premiumIconContainer: {
      width: 46,
      height: 46,
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.18)',
    },
    textContainer: {
      flex: 1,
      marginLeft: 10,
      justifyContent: 'center',
    },
    title: {
      color: colors.text,
      fontSize: 16.5,
      fontFamily: FONTS.Medium,
    },
    premiumTitle: {
      color: colors.white,
      fontFamily: FONTS.SemiBold,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: FONTS.Regular,
      marginTop: 2,
    },
    premiumSubtitle: {
      color: 'rgba(255, 255, 255, 0.78)',
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: colors.previewBackground,
    },
    premiumBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.16)',
    },
    badgeText: {
      color: colors.text,
      fontSize: 11,
      fontFamily: FONTS.SemiBold,
    },
    premiumBadgeText: {
      color: colors.white,
    },
    alertBadge: {
      marginRight: 10,
    },
    alertDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    arrow: {
      width: 17,
      height: 17,
      right: 5,
    },
  });
};

export default memo(SettingItem);
