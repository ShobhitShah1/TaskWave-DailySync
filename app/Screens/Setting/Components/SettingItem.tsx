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
  onPress: () => void;
}

const SettingItem: FC<SettingProps> = ({
  icon,
  ionicon,
  ioniconColor,
  title,
  subtitle,
  showAlert,
  onPress,
}) => {
  const style = styles();
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const isLastItems = title === 'Portfolio' || title === 'How app works';

  return (
    <Pressable style={style.itemContainer} onPress={onPress}>
      <View
        style={[
          style.iconContainer,
          ionicon && {
            // Use light yellow background if icon is yellow, otherwise light blue
            backgroundColor: ioniconColor === '#FFB340' ? 'rgba(255, 179, 64, 0.15)' : '#E6E9FC',
            borderRadius: 8,
          },
        ]}
      >
        {ionicon ? (
          <Ionicons name={ionicon} size={20} color={ioniconColor || colors.darkBlue} />
        ) : icon ? (
          <Image
            source={icon}
            tintColor={theme === 'dark' ? colors.white : colors.black}
            style={{
              width: isLastItems ? 20 : 22,
              height: isLastItems ? 20 : 22,
            }}
            resizeMode="contain"
          />
        ) : null}
      </View>
      <View style={style.textContainer}>
        <Text style={style.title}>{title}</Text>
        {subtitle && (
          <Text
            style={[
              style.subtitle,
              { color: showAlert ? ioniconColor || colors.darkBlue : colors.grayTitle },
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {showAlert && (
        <View style={style.alertBadge}>
          <View style={[style.alertDot, { backgroundColor: ioniconColor || colors.darkBlue }]} />
        </View>
      )}
      <Image
        resizeMode="contain"
        source={AssetsPath.ic_leftArrow}
        tintColor={theme === 'dark' ? colors.white : colors.black}
        style={[style.arrow, { transform: [{ rotate: '180deg' }] }]}
      />
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
    iconContainer: {
      width: 30,
      height: 30,
      justifyContent: 'center',
      alignItems: 'center',
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
    subtitle: {
      fontSize: 12,
      fontFamily: FONTS.Regular,
      marginTop: 2,
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
