import React, { FC } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';

interface filterTabProps {
  res: {
    title: string;
    reminders: number;
    history_icon: any;
    icon: any;
    type: any;
  };
  index: number;
  onTabPress: () => void;
  isActive: boolean;
}

const RenderFilterTabData: FC<filterTabProps> = ({ res, index, onTabPress, isActive }) => {
  const style = styles();
  const colors = useThemeColors();

  return (
    <Pressable key={index} onPress={onTabPress} style={[style.tabButton, { width: 70 }]}>
      <Animated.View style={[style.tabContainer, isActive && style.activeTab]}>
        {res.icon && (
          <Image
            resizeMode="contain"
            tintColor={isActive ? colors.white : colors.grayTitle}
            source={res.history_icon}
            style={style.iconStyle}
          />
        )}
        <Text
          style={[
            style.tabTitle,
            {
              fontSize: !res.icon ? 18 : 12,
              color: isActive ? colors.white : colors.grayTitle,
            },
          ]}
        >
          {res.title}
        </Text>
        {res.reminders > 0 && (
          <View
            style={[
              style.badgeContainer,
              {
                zIndex: 9999,
                backgroundColor: isActive ? colors.yellow : colors.grayTitle,
              },
            ]}
          >
            <Text style={style.badgeText}>{res.reminders}</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
};

export default RenderFilterTabData;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    tabButton: {
      height: '98%',
      alignItems: 'center',
      overflow: 'visible',
      justifyContent: 'center',
    },
    tabContainer: {
      flex: 1,
      width: '95%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeTab: {
      flex: 1,
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: 'rgba(38, 107, 235, 1)',
    },
    iconStyle: {
      width: 20,
      height: 20,
      marginBottom: 10,
    },
    tabTitle: {
      rowGap: 10,
      width: '100%',
      alignSelf: 'center',
      textAlign: 'center',
      justifyContent: 'center',
      fontFamily: FONTS.Medium,
    },
    badgeContainer: {
      position: 'absolute',
      top: 0,
      right: 0,
      borderRadius: 50,
      width: 22,
      height: 22,
      zIndex: 1,
      overflow: 'visible',
      justifyContent: 'center',
      alignItems: 'center',
    },
    badgeText: {
      fontSize: 12,
      textAlign: 'center',
      color: colors.black,
      fontFamily: FONTS.Medium,
    },
  });
};
