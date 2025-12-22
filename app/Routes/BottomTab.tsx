import { FONTS } from '@Constants/Theme';
import { BottomSheetProvider, useBottomSheet } from '@Contexts/BottomSheetProvider';
import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import { useBottomSheetBackHandler } from '@Hooks/useBottomSheetBackHandler';
import useThemeColors from '@Hooks/useThemeMode';
import { useNavigation } from '@react-navigation/native';
import AddReminder from '@Screens/AddReminder/AddReminder';
import History from '@Screens/History/History';
import Home from '@Screens/Home/Home';
import Notification from '@Screens/Notification/Notification';
import Setting from '@Screens/Setting/Setting';
import { NotificationCategory, NotificationType, RenderTabBarProps } from '@Types/Interface';
import { getCategories } from '@Utils/getCategories';
import { getIconSourceForBottomTabs } from '@Utils/getIconSourceForBottomTabs';
import * as Location from 'expo-location';
import React, { memo, useCallback, useState } from 'react';
import {
  Dimensions,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CurvedBottomBar } from 'react-native-curved-bottom-bar';
import { showMessage } from 'react-native-flash-message';
import { isAppInstalled } from 'send-message';
import RenderSheetView from './Components/RenderSheetView';

const { width } = Dimensions.get('window');

const BottomTab = () => {
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { bottomSheetModalRef } = useBottomSheet();
  const { handleSheetPositionChange } = useBottomSheetBackHandler(bottomSheetModalRef);

  const [hideBottomTab, setHideBottomTab] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<NotificationType | null>(null);
  const initialCategories = getCategories(colors);

  const [categories, setCategories] = useState<NotificationCategory[]>(initialCategories);

  const handleTabChange = useCallback(
    (selectedTab: string) => {
      const shouldHide = selectedTab === 'History' || selectedTab === 'Setting';

      if (hideBottomTab !== shouldHide) {
        setHideBottomTab(shouldHide);
      }
    },
    [hideBottomTab],
  );

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const renderTabBar = useCallback(
    ({ routeName, selectedTab, navigate }: RenderTabBarProps) => (
      <View style={{ flex: 1 }}>
        <Pressable
          onPress={() => {
            handleTabChange(selectedTab);
            navigate(routeName);
          }}
          style={styles.tabBarItem}
        >
          <Image
            source={getIconSourceForBottomTabs(routeName, selectedTab === routeName)}
            tintColor={selectedTab === routeName ? colors.white : 'rgba(255, 255, 255, 0.6)'}
            style={styles.icon}
          />
          <Text
            style={[
              styles.tabLabel,
              {
                color: selectedTab === routeName ? colors.white : 'rgba(255, 255, 255, 0.6)',
              },
            ]}
          >
            {routeName}
          </Text>
        </Pressable>
      </View>
    ),
    [colors.white, handleTabChange],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        opacity={0.5}
        // appearsOnIndex={0}
        pressBehavior="close"
        // disappearsOnIndex={-1}
        style={[props.style, { backgroundColor: 'rgba(0,0,0,0.7)' }]}
      />
    ),
    [],
  );

  const onCloseSheet = useCallback(() => {
    bottomSheetModalRef?.current?.dismiss();
  }, [bottomSheetModalRef]);

  const checkAppAndNavigate = useCallback(
    async (
      packageName: string,
      appStoreUrl: string,
      categories: NotificationType,
      errorMessage: string,
    ) => {
      try {
        const result = await isAppInstalled(packageName);

        if (result) {
          onCloseSheet();

          setTimeout(() => {
            navigation.navigate('CreateReminder', {
              notificationType: categories,
            });
          }, 200);
        } else {
          showMessage({
            message: errorMessage,
            description: 'Click here to install application',
            type: 'warning',
            onPress: () => Linking.openURL(appStoreUrl),
            duration: 5000,
            floating: true,
          });
        }
      } catch (error) {
        showMessage({
          message: errorMessage,
          type: 'danger',
        });
      }
    },
    [isAppInstalled, navigation],
  );

  const onPressNext = useCallback(
    async (category: NotificationType) => {
      switch (category) {
        case 'whatsapp':
          await checkAppAndNavigate(
            'com.whatsapp',
            Platform.OS === 'android'
              ? 'https://play.google.com/store/apps/details?id=com.whatsapp'
              : 'https://apps.apple.com/app/whatsapp-messenger/id310633997',
            category,
            'WhatsApp is not installed',
          );
          break;
        case 'whatsappBusiness':
          await checkAppAndNavigate(
            'com.whatsapp.w4b',
            Platform.OS === 'android'
              ? 'https://play.google.com/store/apps/details?id=com.whatsapp.w4b'
              : 'https://apps.apple.com/app/whatsapp-business/id1386412985',
            category,
            'WhatsApp Business is not installed',
          );
          break;
        case 'instagram':
          await checkAppAndNavigate(
            'com.instagram.android',
            Platform.OS === 'android'
              ? 'https://play.google.com/store/apps/details?id=com.instagram.android'
              : 'https://apps.apple.com/us/app/instagram/id389801252',
            category,
            'Instagram is not installed',
          );
          break;
        case 'location':
          const response = await Location.requestForegroundPermissionsAsync();

          if (response.status !== 'granted') {
            showMessage({
              message: 'Location Permission required',
              description: 'Allow location permission to use this feature',
            });

            return;
          }

          onCloseSheet();

          setTimeout(() => {
            navigation.navigate('LocationDetails', {
              notificationType: 'location',
            });
          }, 200);
          break;
        default:
          onCloseSheet();

          setTimeout(() => {
            navigation.navigate('CreateReminder', {
              notificationType: category,
            });
          }, 200);
          break;
      }
    },
    [checkAppAndNavigate, navigation, onCloseSheet],
  );

  const onCategoryClick = useCallback(
    (item: any, isSort: boolean) => {
      const newCategories = categories.filter((cat) => cat.type !== item.type);
      isSort && setCategories([item, ...newCategories]);

      setSelectedCategory(item.type);
    },
    [categories, selectedCategory],
  );

  return (
    <React.Fragment>
      <CurvedBottomBar.Navigator
        type="DOWN"
        circlePosition="CENTER"
        id="bottom-tab"
        width={width}
        borderColor="transparent"
        borderWidth={0}
        shadowStyle={{}}
        defaultScreenOptions={{}}
        backBehavior="initialRoute"
        style={[
          styles.bottomBar,
          {
            display: hideBottomTab ? 'none' : undefined,
            zIndex: hideBottomTab ? -1 : undefined,
          },
        ]}
        height={60}
        circleWidth={50}
        screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
        bgColor={colors.bottomTab}
        initialRouteName="Home"
        borderTopLeftRight
        renderCircle={() => (
          <View style={styles.btnCircleUp}>
            <Pressable
              style={[
                styles.addButton,
                {
                  backgroundColor: colors.darkBlue,
                  boxShadow: '0px 0px 10px rgba(64, 93, 240, 0.8)',
                },
              ]}
              onPress={handlePresentModalPress}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </View>
        )}
        tabBar={renderTabBar}
        screenListeners={{
          state: (e: any) => {
            const currentIndex = e?.data?.state?.index;
            const currentRouteName = e?.data?.state?.routeNames?.[currentIndex];
            const hideTab = currentRouteName === 'History' || currentRouteName === 'Setting';

            setHideBottomTab(hideTab);
          },
        }}
      >
        <CurvedBottomBar.Screen name="Home" component={Home} position="LEFT" />
        <CurvedBottomBar.Screen name="Coming Soon" component={Notification} position="LEFT" />
        <CurvedBottomBar.Screen name="AddReminder" component={AddReminder} position="CIRCLE" />
        <CurvedBottomBar.Screen name="History" component={History} position="RIGHT" />
        <CurvedBottomBar.Screen name="Setting" component={Setting} position="RIGHT" />
      </CurvedBottomBar.Navigator>

      <BottomSheetProvider>
        <BottomSheetModal
          ref={bottomSheetModalRef}
          index={0}
          snapPoints={['80%', '100%']}
          enableDynamicSizing={false}
          // enableContentPanningGesture={false}
          // enableOverDrag={false}
          backdropComponent={renderBackdrop}
          onChange={handleSheetPositionChange}
          onDismiss={() => setSelectedCategory(null)}
          containerStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          backgroundStyle={{ backgroundColor: colors.background }}
          handleStyle={[styles.handleStyle, { backgroundColor: colors.background }]}
          handleIndicatorStyle={[styles.handleIndicatorStyle, { backgroundColor: colors.text }]}
        >
          <BottomSheetScrollView
            bounces={false}
            style={[styles.contentContainer, { backgroundColor: colors.background }]}
            showsVerticalScrollIndicator={false}
          >
            <RenderSheetView
              categories={categories}
              onCategoryClick={(category, isTopCategory) => {
                onCategoryClick(category, isTopCategory);

                if (!isTopCategory && category?.type) {
                  onPressNext(category?.type);
                }
              }}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          </BottomSheetScrollView>
        </BottomSheetModal>
      </BottomSheetProvider>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  btnCircleUp: {
    bottom: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 6,
    fontFamily: FONTS.Medium,
  },
  addButton: {
    flex: 1,
    width: 60,
    height: 60,
    borderRadius: 500,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 50,
    fontFamily: FONTS.Regular,
  },
  modalBackground: {
    backgroundColor: 'white',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 10,
  },
  flatListContainer: {
    rowGap: 15,
    paddingBottom: 90,
  },
  sheetNextButtonContainer: {
    position: 'absolute',
    bottom: 0,
    padding: 0,
    height: 80,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetNextButton: {
    width: 120,
    height: 38,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(64, 93, 240, 1)',
  },
  iconContainer: {
    alignItems: 'center',
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: 'contain',
  },
  handleStyle: {
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
  },
  handleIndicatorStyle: {
    top: 2,
    width: 35,
    marginTop: 10,
  },
  sheetNextButtonText: {
    fontFamily: FONTS.Medium,
    fontSize: 17,
    color: 'white',
  },
  sheetSuggestionView: {
    alignSelf: 'center',
    marginBottom: 20,
    gap: 15,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sheetSuggestionImageView: {
    width: 35,
    height: 35,
    elevation: 5,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    borderRadius: 500,
    justifyContent: 'center',
  },
  sheetSuggestionImage: {
    width: '55%',
    height: '55%',
    alignSelf: 'center',
  },
});

export default memo(BottomTab);
