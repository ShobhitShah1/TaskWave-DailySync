import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetModalProvider,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useSharedValue, withTiming } from "react-native-reanimated";
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
import { CustomTabBar } from "./Components/CustomTabBar";
import RenderCategoryItem from "./Components/RenderCategoryItem";

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

const Bottom = createBottomTabNavigator();

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
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] =
    useState<NotificationType | null>("whatsapp");
  const navigation = useNavigation();

  const tabWidth = 80;
  const indicatorPosition = useSharedValue(0);

  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const colors = useThemeColors();
  const { theme } = useAppContext();

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  useEffect(() => {
    indicatorPosition.value = withTiming(selectedIndex * tabWidth + 20, {
      duration: 500,
    });
  }, [selectedIndex]);

  const handleIndexChange = (index: number) => {
    setSelectedIndex(index);
  };

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

  return (
    <React.Fragment>
      <Bottom.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: { borderTopWidth: 0, display: "none" },
        })}
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            indicatorPosition={indicatorPosition}
            onAddReminderPress={handlePresentModalPress}
            onTabChange={handleIndexChange}
            tabWidth={tabWidth}
            shouldShowTabBar={
              props.state.index !== 3 && props.state.index !== 4
            }
          />
        )}
      >
        <Bottom.Screen name="Home" component={Home} />
        <Bottom.Screen name="Notification" component={Notification} />
        <Bottom.Screen name="AddReminder" component={AddReminder} />
        <Bottom.Screen name="History" component={History} />
        <Bottom.Screen name="Setting" component={Setting} />
      </Bottom.Navigator>

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
              onPress={() => {
                if (selectedCategory && bottomSheetModalRef) {
                  bottomSheetModalRef.current?.dismiss();

                  navigation.navigate("CreateReminder", {
                    notificationType: selectedCategory,
                  });
                }
              }}
              style={styles.sheetNextButton}
            >
              <Text
                style={[styles.sheetNextButtonText, { color: colors.text }]}
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
  container: {
    shadowRadius: 2,
    shadowOffset: { width: 0, height: -10 },
    shadowColor: "#000000",
    elevation: 4,
    shadowOpacity: 1.0,
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,

    paddingTop: 10,

    shadowRadius: 2,
    shadowOffset: { width: 0, height: -10 },
    shadowColor: "#000000",
    elevation: 4,
    shadowOpacity: 1.0,
  },
  iconContainer: {
    alignItems: "center",
  },
  icon: {
    width: 24,
    height: 24,
  },
  indicator: {
    position: "absolute",
    top: 0,
    width: 35,
    height: 2,
    borderRadius: 2,
  },

  contentContainer: {
    flex: 1,
    padding: 16,
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
    width: 110,
    height: 35,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(64, 93, 240, 1)",
  },
  sheetNextButtonText: {
    fontFamily: FONTS.Medium,
    fontSize: 17,
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
});

export default BottomTab;
