import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { memo, useCallback, useRef, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  Animated as RNAnimated,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CurvedBottomBar } from "react-native-curved-bottom-bar";
import { showMessage } from "react-native-flash-message";
import LinearGradient from "react-native-linear-gradient";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { useAppContext } from "../Contexts/ThemeProvider";
import AssetsPath from "../Constants/AssetsPath";
import TextString from "../Constants/TextString";
import { FONTS } from "../Constants/Theme";
import { useBottomSheetBackHandler } from "../Hooks/useBottomSheetBackHandler";
import useThemeColors from "../Hooks/useThemeMode";
import AddReminder from "../Screens/AddReminder/AddReminder";
import History from "../Screens/History/History";
import Home from "../Screens/Home/Home";
import Notification from "../Screens/Notification/Notification";
import Setting from "../Screens/Setting/Setting";
import {
  NotificationCategory,
  NotificationType,
  remindersCategoriesType,
  RenderTabBarProps,
} from "../Types/Interface";
import { getIconSourceForBottomTabs } from "../Utils/getIconSourceForBottomTabs";
import RenderCategoryItem from "./Components/RenderCategoryItem";
import { getCategories } from "../Utils/getCategories";

const BottomTab = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const { handleSheetPositionChange } =
    useBottomSheetBackHandler(bottomSheetModalRef);

  const [hideBottomTab, setHideBottomTab] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<NotificationType>("whatsapp");
  const initialCategories = getCategories(colors);

  const [categories, setCategories] =
    useState<NotificationCategory[]>(initialCategories);

  const handleTabChange = useCallback(
    (selectedTab: string) => {
      const shouldHide = selectedTab === "History" || selectedTab === "Setting";

      if (hideBottomTab !== shouldHide) {
        setHideBottomTab(shouldHide);
      }
    },
    [hideBottomTab]
  );

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const renderTabBar = useCallback(
    ({ routeName, selectedTab, navigate }: RenderTabBarProps) => (
      <Pressable
        onPress={() => {
          handleTabChange(selectedTab);
          navigate(routeName);
        }}
        style={styles.tabBarItem}
      >
        <Image
          source={getIconSourceForBottomTabs(
            routeName,
            selectedTab === routeName
          )}
          tintColor={selectedTab === routeName ? colors.white : colors.white}
          style={styles.icon}
        />
        <Text style={[styles.tabLabel, { color: colors.white }]}>
          {routeName}
        </Text>
      </Pressable>
    ),
    [colors.white, handleTabChange]
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        style={[props.style, { backgroundColor: "rgba(0,0,0,0.7)" }]}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    []
  );

  const onCloseSheet = useCallback(() => {
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef.current.dismiss();
    }
  }, [bottomSheetModalRef]);

  const { SendMessagesModule } = NativeModules;

  const checkAppAndNavigate = useCallback(
    async (packageName: string, appStoreUrl: string, errorMessage: string) => {
      try {
        const result = await SendMessagesModule.CheckisAppInstalled(
          packageName
        );
        if (result) {
          onCloseSheet();
          setTimeout(() => {
            navigation.navigate("CreateReminder", {
              notificationType: selectedCategory,
            });
          }, 200);
        } else {
          showMessage({
            message: errorMessage,
            description: "Click here to install application",
            type: "warning",
            onPress: () => Linking.openURL(appStoreUrl),
            duration: 5000,
            floating: true,
          });
        }
      } catch (error) {
        showMessage({
          message: errorMessage,
          type: "danger",
        });
      }
    },
    [SendMessagesModule, navigation, selectedCategory]
  );

  const onPressNext = useCallback(() => {
    switch (selectedCategory) {
      case "whatsapp":
        checkAppAndNavigate(
          "com.whatsapp",
          Platform.OS === "android"
            ? "https://play.google.com/store/apps/details?id=com.whatsapp"
            : "https://apps.apple.com/app/whatsapp-messenger/id310633997",
          "WhatsApp is not installed"
        );
        break;
      case "whatsappBusiness":
        checkAppAndNavigate(
          "com.whatsapp.w4b",
          Platform.OS === "android"
            ? "https://play.google.com/store/apps/details?id=com.whatsapp.w4b"
            : "https://apps.apple.com/app/whatsapp-business/id1386412985",
          "WhatsApp Business is not installed"
        );
        break;
      case "instagram":
        checkAppAndNavigate(
          "com.instagram.android",
          Platform.OS === "android"
            ? "https://play.google.com/store/apps/details?id=com.instagram.android"
            : "https://apps.apple.com/us/app/instagram/id389801252",
          "Instagram is not installed"
        );
        break;
      default:
        onCloseSheet();
        setTimeout(() => {
          navigation.navigate("CreateReminder", {
            notificationType: selectedCategory,
          });
        }, 200);
        break;
    }
  }, [checkAppAndNavigate, selectedCategory, navigation]);

  const onCategoryClick = useCallback(
    (item: any) => {
      const newCategories = categories.filter((cat) => cat.type !== item.type);
      setCategories([item, ...newCategories]);

      setSelectedCategory(item.type);
    },
    [categories]
  );

  return (
    <React.Fragment>
      <CurvedBottomBar.Navigator
        type="DOWN"
        style={[
          styles.bottomBar,
          {
            display: hideBottomTab ? "none" : undefined,
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
          <RNAnimated.View style={styles.btnCircleUp}>
            <Pressable
              style={styles.addButton}
              onPress={handlePresentModalPress}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </RNAnimated.View>
        )}
        tabBar={renderTabBar}
        screenListeners={{
          state: (e) => {
            const currentIndex = e?.data?.state?.index;
            const currentRouteName = e?.data?.state?.routeNames?.[currentIndex];
            const hideTab =
              currentRouteName === "History" || currentRouteName === "Setting";

            setHideBottomTab(hideTab);
          },
        }}
      >
        <CurvedBottomBar.Screen name="Home" component={Home} position="LEFT" />
        <CurvedBottomBar.Screen
          name="Coming Soon"
          component={Notification}
          position="LEFT"
        />
        <CurvedBottomBar.Screen
          name="AddReminder"
          component={AddReminder}
          position="CIRCLE"
        />
        <CurvedBottomBar.Screen
          name="History"
          component={History}
          position="RIGHT"
        />
        <CurvedBottomBar.Screen
          name="Setting"
          component={Setting}
          position="RIGHT"
        />
      </CurvedBottomBar.Navigator>

      <BottomSheetModalProvider>
        <BottomSheetModal
          enablePanDownToClose
          footerComponent={() => {
            return (
              <LinearGradient
                start={{ x: 0, y: 1 }}
                end={{ x: 0, y: 0 }}
                colors={["rgba(0,0,0,1)", "rgba(0,0,0,0.4)", "rgba(0,0,0,0.0)"]}
                style={styles.sheetNextButtonContainer}
              >
                <Pressable
                  disabled={selectedCategory?.length === 0}
                  onPress={onPressNext}
                  style={styles.sheetNextButton}
                >
                  <Text
                    style={[
                      styles.sheetNextButtonText,
                      { color: colors.white },
                    ]}
                  >
                    {TextString.Next}
                  </Text>
                </Pressable>
              </LinearGradient>
            );
          }}
          backdropComponent={renderBackdrop}
          containerStyle={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          backgroundStyle={{ backgroundColor: colors.background }}
          handleStyle={[
            styles.handleStyle,
            { backgroundColor: colors.background },
          ]}
          handleIndicatorStyle={[
            styles.handleIndicatorStyle,
            { backgroundColor: colors.text },
          ]}
          ref={bottomSheetModalRef}
          snapPoints={["80%"]}
          onChange={handleSheetPositionChange}
        >
          <BottomSheetScrollView
            style={[
              styles.contentContainer,
              { backgroundColor: colors.background },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View>
              <StatusBar
                translucent
                backgroundColor={colors.background}
                style={theme === "dark" ? "light" : "dark"}
              />
              <View style={styles.sheetSuggestionView}>
                {initialCategories?.map((res) => {
                  const isSelected = res.type === selectedCategory;
                  return (
                    <Pressable
                      onPress={() => {
                        onCategoryClick(res);
                        setSelectedCategory(res.type);
                      }}
                      key={res.id}
                      style={[
                        styles.sheetSuggestionImageView,
                        {
                          backgroundColor: isSelected
                            ? res.color.background
                            : "rgba(209, 209, 209, 0.6)",
                        },
                      ]}
                    >
                      <Image
                        source={res.icon}
                        tintColor={
                          isSelected && res.type === "gmail"
                            ? undefined
                            : colors.white
                        }
                        style={styles.sheetSuggestionImage}
                      />
                    </Pressable>
                  );
                })}
              </View>
              <FlatList
                numColumns={2}
                data={categories}
                renderItem={({ item }) => (
                  <RenderCategoryItem
                    item={item}
                    onCategoryClick={onCategoryClick}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                  />
                )}
                keyExtractor={(item, index) => item.id?.toString()}
                contentContainerStyle={{ rowGap: 15, paddingBottom: 90 }}
                columnWrapperStyle={{ justifyContent: "space-between" }}
              />
            </View>
          </BottomSheetScrollView>
        </BottomSheetModal>
      </BottomSheetModalProvider>
    </React.Fragment>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  btnCircleUp: {
    alignItems: "center",
    justifyContent: "center",
    bottom: 30,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 5,
  },
  tabBarItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    borderRadius: 30,
    backgroundColor: "rgba(64, 93, 240, 1)",
    shadowColor: "rgba(71, 134, 249, 1)",

    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    color: "white",
    fontSize: 50,
    fontFamily: FONTS.Regular,
  },
  modalBackground: {
    backgroundColor: "white",
  },
  contentContainer: {
    padding: 16,
  },
  flatListContainer: {
    rowGap: 15,
    paddingBottom: 90,
  },
  sheetNextButtonContainer: {
    position: "absolute",
    bottom: 0,
    padding: 0,
    height: 80,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sheetNextButton: {
    width: 120,
    height: 38,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(64, 93, 240, 1)",
  },
  iconContainer: {
    alignItems: "center",
  },
  icon: {
    width: 22,
    height: 22,
    resizeMode: "contain",
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
    color: "white",
  },
  sheetSuggestionView: {
    alignSelf: "center",
    marginBottom: 20,
    gap: 15,
    flexDirection: "row",
    overflow: "hidden",
  },
  sheetSuggestionImageView: {
    width: 35,
    height: 35,
    elevation: 5,
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 3,
    borderRadius: 500,
    justifyContent: "center",
  },
  sheetSuggestionImage: {
    width: "55%",
    height: "55%",
    alignSelf: "center",
  },
});

export default memo(BottomTab);
