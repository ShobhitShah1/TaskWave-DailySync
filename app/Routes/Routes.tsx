import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import { setStatusBarStyle } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React from 'react';
import { StyleSheet } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBottomSheet } from '../Contexts/BottomSheetProvider';
import { storage, useAppContext } from '../Contexts/ThemeProvider';
import useThemeColors from '../Hooks/useThemeMode';
import AddReminder from '../Screens/AddReminder/AddReminder';
import ReminderScheduled from '../Screens/AddReminder/ReminderScheduled';
import LocationDetails from '../Screens/LocationDetails/LocationDetails';
import OnBoarding from '../Screens/OnBoarding/Index';
import ReminderPreview from '../Screens/Preview/ReminderPreview';
import AboutApp from '../Screens/Setting/AboutApp';
import HowAppWorks from '../Screens/Setting/HowAppWorks';
import NotificationSound from '../Screens/Setting/NotificationSound';
import { RootStackParamList } from '../Types/Interface';
import BottomTab from './BottomTab';
import { navigationRef } from './RootNavigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Routes = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const { bottomSheetModalRef } = useBottomSheet();

  const MyTheme: Theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.background,
      card: colors.background,
    },
  };

  useQuickActionCallback((action) => {
    if (action.id === '0') {
      bottomSheetModalRef.current?.present();
    }
  });

  const showOnboarding = storage.getString('onboardingShown');

  return (
    <NavigationContainer
      ref={navigationRef}
      theme={MyTheme}
      onReady={async () => {
        setStatusBarStyle(theme === 'dark' ? 'light' : 'dark');
        SystemUI.setBackgroundColorAsync(theme === 'dark' ? '#303334' : '#ffffff');

        setTimeout(() => {
          BootSplash.hide({ fade: true });
        }, 500);
      }}
    >
      <SafeAreaView style={styles.container}>
        <Stack.Navigator
          screenOptions={({}) => ({ headerShown: false, animation: 'ios_from_right' })}
        >
          {showOnboarding !== 'no' && <Stack.Screen name="OnBoarding" component={OnBoarding} />}
          <Stack.Screen name="BottomTab" component={BottomTab} />
          <Stack.Screen name="CreateReminder" component={AddReminder} />
          <Stack.Screen name="ReminderScheduled" component={ReminderScheduled} />
          <Stack.Screen name="ReminderPreview" component={ReminderPreview} />
          <Stack.Screen name="AboutApp" component={AboutApp} />
          <Stack.Screen name="HowAppWorks" component={HowAppWorks} />
          <Stack.Screen name="NotificationSound" component={NotificationSound} />
          <Stack.Screen name="LocationDetails" component={LocationDetails} />
        </Stack.Navigator>
      </SafeAreaView>
    </NavigationContainer>
  );
};

export default Routes;

const styles = StyleSheet.create({
  container: { flex: 1 },
});
