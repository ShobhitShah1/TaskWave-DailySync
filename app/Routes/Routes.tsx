import { useBottomSheet } from '@Contexts/BottomSheetProvider';
import { storage, useAppContext } from '@Contexts/ThemeProvider';
import { useAuth } from '@Hooks/useAuth';
import useThemeColors from '@Hooks/useThemeMode';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AddReminder from '@Screens/AddReminder/AddReminder';
import CompleteProfileScreen from '@Screens/Auth/CompleteProfile';
import SignInScreen from '@Screens/Auth/SignIn';
import SignUpScreen from '@Screens/Auth/SignUp';
import AlarmDetailsScreen from '@Screens/Alarm/AlarmDetails';
import CreateAlarmScreen from '@Screens/Alarm/CreateAlarm';
import ReminderScheduled from '@Screens/AddReminder/ReminderScheduled';
import LocationDetails from '@Screens/LocationDetails/LocationDetails';
import OnBoarding from '@Screens/OnBoarding/Index';
import LocationPreview from '@Screens/Preview/LocationPreview';
import ReminderPreview from '@Screens/Preview/ReminderPreview';
import AboutApp from '@Screens/Setting/AboutApp';
import HowAppWorks from '@Screens/Setting/HowAppWorks';
import NotificationSound from '@Screens/Setting/NotificationSound';
import { RootStackParamList } from '@Types/Interface';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import BootSplash from 'react-native-bootsplash';
import { SystemBars } from 'react-native-edge-to-edge';
import { useMMKVString } from 'react-native-mmkv';
import BottomTab from './BottomTab';
import { navigationRef } from './RootNavigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

const Routes = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const { bottomSheetModalRef } = useBottomSheet();
  const { status, isAuthenticated, isProfileComplete } = useAuth();

  const MyTheme: Theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: colors.background, card: colors.background },
  };

  useQuickActionCallback((action) => {
    if (action.id === '0') {
      bottomSheetModalRef.current?.present();
    }

    if (action.id === '1') {
    }
  });

  const [initialAuthRoute] = React.useState<keyof RootStackParamList>(() => {
    const showOnboarding = storage.getString('onboardingShown');
    return showOnboarding !== 'no' ? 'OnBoarding' : 'SignIn';
  });

  const statusBarStyle =
    (initialAuthRoute === 'OnBoarding' && !isAuthenticated) || theme === 'dark'
      ? 'light-content'
      : 'dark-content';

  if (status === 'loading') {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <>
      <SystemBars
        key={theme}
        style={
          initialAuthRoute === 'OnBoarding' && !isAuthenticated
            ? 'light'
            : theme === 'dark'
              ? 'light'
              : 'dark'
        }
      />

      <StatusBar backgroundColor="transparent" translucent barStyle={statusBarStyle} />

      <NavigationContainer
        ref={navigationRef}
        theme={MyTheme}
        onReady={async () => {
          SystemUI.setBackgroundColorAsync(theme === 'dark' ? '#303334' : '#ffffff');

          setTimeout(() => {
            BootSplash.hide({ fade: true });
          }, 0);
        }}
      >
        <Stack.Navigator
          screenOptions={{ headerShown: false, animation: 'ios_from_right' }}
          initialRouteName={
            !isAuthenticated
              ? initialAuthRoute
              : !isProfileComplete
                ? 'CompleteProfile'
                : 'BottomTab'
          }
        >
          {!isAuthenticated ? (
            <>
              <Stack.Screen name="OnBoarding" component={OnBoarding} />
              <Stack.Screen name="SignIn" component={SignInScreen} />
              <Stack.Screen name="SignUp" component={SignUpScreen} />
            </>
          ) : !isProfileComplete ? (
            <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
          ) : (
            <>
              <Stack.Screen name="BottomTab" component={BottomTab} />
              <Stack.Screen name="CreateReminder" component={AddReminder} />
              <Stack.Screen name="ReminderScheduled" component={ReminderScheduled} />
              <Stack.Screen name="ReminderPreview" component={ReminderPreview} />
              <Stack.Screen name="AboutApp" component={AboutApp} />
              <Stack.Screen name="HowAppWorks" component={HowAppWorks} />
              <Stack.Screen name="NotificationSound" component={NotificationSound} />
              <Stack.Screen name="LocationDetails" component={LocationDetails} />
              <Stack.Screen name="LocationPreview" component={LocationPreview} />
              <Stack.Screen name="CreateAlarm" component={CreateAlarmScreen} />
              <Stack.Screen name="AlarmDetails" component={AlarmDetailsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
};

export default Routes;
