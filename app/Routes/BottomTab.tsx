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
  Animated,
  FlatList,
  Image,
  ImageSourcePropType,
  Linking,
  NativeModules,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import { CurvedBottomBar } from "react-native-curved-bottom-bar";
import LinearGradient from "react-native-linear-gradient";
import { useAppContext } from "../Contexts/ThemeProvider";
import AssetsPath from "../Global/AssetsPath";
import TextString from "../Global/TextString";
import { FONTS } from "../Global/Theme";
import AddReminder from "../Screens/AddReminder/AddReminder";
import History from "../Screens/History/History";
import Home from "../Screens/Home/Home";
import Notification from "../Screens/Notification/Notification";
import Setting from "../Screens/Setting/Setting";
import useThemeColors from "../Theme/useThemeMode";
import { NotificationType } from "../Types/Interface";
import { getIconSourceForBottomTabs } from "../Utils/getIconSourceForBottomTabs";
import RenderCategoryItem from "./Components/RenderCategoryItem";
import { showMessage } from "react-native-flash-message";

interface RenderTabBarProps {
  routeName: string;
  selectedTab: string;
  navigate: (routeName: string) => void;
}

export type categoriesType = {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  icon: ImageSourcePropType;
};

const categories: categoriesType[] = [
  {
    id: "1",
    type: "whatsapp",
    title: "Whatsapp",
    description: "Let’s create whatsapp event",
    icon: AssetsPath.ic_whatsapp,
  },
  {
    id: "2",
    type: "SMS",
    title: "SMS",
    description: "Let’s create text messages event",
    icon: AssetsPath.ic_sms,
  },
  {
    id: "3",
    type: "whatsappBusiness",
    title: "WA Business",
    description: "Let’s create business event",
    icon: AssetsPath.ic_whatsappBusiness,
  },
  {
    id: "4",
    type: "gmail",
    title: "Email",
    description: "Let’s compose mail event",
    icon: AssetsPath.ic_gmail,
  },
  {
    id: "4",
    type: "phone",
    title: "Phone",
    description: "Let’s create phone event",
    icon: AssetsPath.ic_phone,
  },
];

export const TabBarIcon = ({
  source,
  focused,
}: {
  source: any;
  focused: boolean;
}) => {
  const colors = useThemeColors();
  return (
    <View style={styles.iconContainer}>
      <Image
        source={source}
        tintColor={focused ? colors.gmail : undefined}
        resizeMode="contain"
        style={[styles.icon]}
      />
    </View>
  );
};

const BottomTab = () => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const navigation = useNavigation();
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const [hideBottomTab, setHideBottomTab] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<NotificationType>("whatsapp");

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
          source={getIconSourceForBottomTabs(routeName)}
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
        const result =
          await SendMessagesModule.CheckisAppInstalled(packageName);
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
            description: "Click here to install",
            type: "warning",

            onPress: () => {
              Linking.openURL(appStoreUrl).catch((err) =>
                console.error("An error occurred", err)
              );
            },
            duration: 5000,
            floating: true,
          });
        }
      } catch (error) {
        showMessage({
          message: errorMessage,
          type: "danger",
        });
        console.error("Error checking app installation:", error);
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

  return (
    <React.Fragment>
      <CurvedBottomBar.Navigator
        type="DOWN"
        style={[
          styles.bottomBar,
          { display: hideBottomTab ? "none" : undefined },
        ]}
        height={60}
        circleWidth={50}
        screenOptions={{ headerShown: false }}
        bgColor={colors.bottomTab}
        initialRouteName="Home"
        borderTopLeftRight
        renderCircle={() => (
          <Animated.View style={styles.btnCircleUp}>
            <Pressable
              style={styles.addButton}
              onPress={handlePresentModalPress}
            >
              <Text style={styles.addButtonText}>+</Text>
            </Pressable>
          </Animated.View>
        )}
        tabBar={renderTabBar}
        screenListeners={{
          state: (e) => {
            const currentIndex = e.data.state.index;
            const currentRouteName = e.data.state.routeNames?.[currentIndex];

            if (
              currentRouteName === "History" ||
              currentRouteName === "Setting"
            ) {
              setHideBottomTab(true);
            } else {
              setHideBottomTab(false);
            }
          },
        }}
      >
        <CurvedBottomBar.Screen name="Home" component={Home} position="LEFT" />
        <CurvedBottomBar.Screen
          name="Notification"
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
          snapPoints={["50%"]}
        >
          <BottomSheetScrollView
            style={[
              styles.contentContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <View>
              <StatusBar
                translucent
                backgroundColor={colors.background}
                style={theme === "dark" ? "light" : "dark"}
              />
              <FlatList
                numColumns={2}
                data={categories}
                renderItem={({ item }) => (
                  <RenderCategoryItem
                    item={item}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                  />
                )}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={{ rowGap: 15, paddingBottom: 90 }}
                columnWrapperStyle={{ justifyContent: "space-between" }}
              />
            </View>
          </BottomSheetScrollView>

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
                style={[styles.sheetNextButtonText, { color: colors.white }]}
              >
                {TextString.Next}
              </Text>
            </Pressable>
          </LinearGradient>
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
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    bottom: 30,
    backgroundColor: "rgba(64, 93, 240, 1)",
    shadowColor: "rgba(71, 134, 249, 1)",
    shadowOffset: { width: 10, height: 10 },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,

    elevation: 7,
  },
  tabBarItem: {
    flex: 1,
    // marginTop: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 5,
    fontFamily: FONTS.Medium,
  },
  addButton: {
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
    width: 24,
    height: 24,
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
});

export default memo(BottomTab);
