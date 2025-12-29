import { useNavigation } from '@react-navigation/native';
import React, { memo, useState } from 'react';
import { Linking, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Share from 'react-native-share';

import RateUsModal from '@Components/RateUsModal';
import { APP_CONFIG } from '@Constants/AppConfig';
import AssetsPath from '@Constants/AssetsPath';
import { SIZE } from '@Constants/Theme';
import { useBatteryOptimization } from '@Contexts/BatteryOptimizationProvider';
import useThemeColors from '@Hooks/useThemeMode';
import HomeHeader from '../Home/Components/HomeHeader';
import SettingItem from './Components/SettingItem';

const Settings = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { showModal: showBatteryModal, isBatteryOptimized } = useBatteryOptimization();

  const [modalStatus, setModalStatus] = useState({ rateUs: false });

  const settingsData = [
    ...(Platform.OS === 'android' && isBatteryOptimized
      ? [
          {
            title: 'Battery Optimization',
            ionicon: 'battery-half-outline' as const,
            ioniconColor: '#FFB340',
            onPress: () => {
              showBatteryModal();
            },
            subtitle: isBatteryOptimized
              ? 'Tap to fix notification issues'
              : 'Optimized for notifications',
            showAlert: isBatteryOptimized,
          },
        ]
      : []),
    {
      title: 'Notification',
      icon: AssetsPath.ic_notification,
      onPress: () => {
        navigation.navigate('NotificationSound');
      },
    },
    {
      title: 'Share',
      icon: AssetsPath.ic_share,
      onPress: () => {
        try {
          Share.open({ message: APP_CONFIG.shareMessage });
        } catch (error) {}
      },
    },
    {
      title: 'Privacy Policy',
      icon: AssetsPath.ic_support,
      onPress: () => {
        try {
          Linking.openURL(APP_CONFIG.privacyPolicyUrl);
        } catch (error) {}
      },
    },
    {
      title: 'Rate us',
      icon: AssetsPath.ic_star,
      onPress: () => setModalStatus({ ...modalStatus, rateUs: !modalStatus.rateUs }),
    },
    {
      title: 'Contact us',
      icon: AssetsPath.ic_contact,
      onPress: () => {
        try {
          Linking.openURL(`mailto:${APP_CONFIG.supportEmail}`);
        } catch (error) {}
      },
    },
    {
      title: 'About app',
      icon: AssetsPath.ic_info,
      onPress: () => navigation.navigate('AboutApp'),
    },
    {
      title: 'How app works',
      icon: AssetsPath.ic_howAppWork,
      onPress: () => {
        navigation.navigate('HowAppWorks');
      },
    },
    {
      title: 'Portfolio',
      icon: AssetsPath.ic_portfolio,
      onPress: () => {
        try {
          Linking.openURL(APP_CONFIG.portfolioUrl);
        } catch (error) {}
      },
    },
  ];

  return (
    <SafeAreaView style={style.container}>
      <HomeHeader
        title={'Setting'}
        titleAlignment="left"
        leftIconType="back"
        showThemeSwitch={false}
      />

      <View style={style.wrapper}>
        {settingsData.map((item, index) => (
          <SettingItem
            key={index}
            title={item.title}
            icon={item.icon}
            ionicon={item.ionicon}
            ioniconColor={item.ioniconColor}
            subtitle={item.subtitle}
            showAlert={item.showAlert}
            onPress={item.onPress}
          />
        ))}
      </View>

      <RateUsModal
        isVisible={modalStatus.rateUs}
        onClose={() => setModalStatus({ ...modalStatus, rateUs: false })}
      />
    </SafeAreaView>
  );
};

export default memo(Settings);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    wrapper: {
      width: SIZE.appContainWidth,
      alignSelf: 'center',
      marginVertical: 15,
      gap: 10,
    },
  });
};
