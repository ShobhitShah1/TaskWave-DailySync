import { useAuth } from '@Hooks/useAuth';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useState } from 'react';
import { Linking, Platform, StyleSheet, View, ScrollView, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Share from 'react-native-share';
import { Ionicons } from '@expo/vector-icons';

import RateUsModal from '@Components/RateUsModal';
import { APP_CONFIG } from '@Constants/AppConfig';
import AssetsPath from '@Constants/AssetsPath';
import { SIZE } from '@Constants/Theme';
import { useBatteryOptimization } from '@Contexts/BatteryOptimizationProvider';
import { useSettings } from '@Contexts/SettingsProvider';
import useThemeColors from '@Hooks/useThemeMode';
import HomeHeader from '../Home/Components/HomeHeader';
import SettingItem from './Components/SettingItem';
import LocationRadiusModal from './Components/LocationRadiusModal';

const Settings = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { showModal: showBatteryModal, isBatteryOptimized } = useBatteryOptimization();
  const { locationRadius, setLocationRadius } = useSettings();
  const { auth, signOut } = useAuth();

  const [modalStatus, setModalStatus] = useState({ rateUs: false, locationRadius: false });

  const formatRadius = (meters: number): string => {
    if (meters >= 1000) {
      return `${(meters / 1000).toFixed(meters % 1000 === 0 ? 0 : 1)} km`;
    }
    return `${meters}m`;
  };

  interface SettingItemData {
    title: string;
    icon?: number;
    ionicon?: any;
    ioniconColor?: string;
    onPress: () => void;
    subtitle?: string;
    showAlert?: boolean;
  }

  const settingsData: SettingItemData[] = [
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
      title: 'Location Radius',
      icon: AssetsPath.ic_location_history,
      onPress: () => setModalStatus({ ...modalStatus, locationRadius: true }),
      subtitle: `Notify within ${formatRadius(locationRadius)}`,
    },
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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
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

        <View style={style.actionButtonsContainer}>
          {/* {__DEV__ && (
            <Pressable
              onPress={() => navigation.navigate('DevDashboard')}
              style={style.actionButton}
            >
              <Ionicons name="construct-outline" size={20} color={colors.darkBlue} />
              <Text style={[style.actionButtonText, { color: colors.darkBlue }]}>Dev Tools</Text>
            </Pressable>
          )} */}

          {auth && (
            <Pressable onPress={signOut} style={style.actionButton}>
              <Ionicons name="log-out-outline" size={20} color={colors.red} />
              <Text style={[style.actionButtonText, { color: colors.red }]}>Log Out</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      <RateUsModal
        isVisible={modalStatus.rateUs}
        onClose={() => setModalStatus({ ...modalStatus, rateUs: false })}
      />

      <LocationRadiusModal
        isVisible={modalStatus.locationRadius}
        onClose={() => setModalStatus({ ...modalStatus, locationRadius: false })}
        currentRadius={locationRadius}
        onSelectRadius={setLocationRadius}
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
    actionButtonsContainer: {
      width: SIZE.appContainWidth,
      alignSelf: 'center',
      marginTop: 20,
      gap: 5,
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
      paddingHorizontal: 15,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
  });
};
