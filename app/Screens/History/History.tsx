import { FlashList } from "@shopify/flash-list";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { useSharedValue, withTiming } from "react-native-reanimated";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS, SIZE } from "../../Global/Theme";
import { useFakeNotifications } from "../../Hooks/useFakeNotifications";
import useThemeColors from "../../Theme/useThemeMode";
import { countNotificationsByType } from "../../Utils/countNotificationsByType";
import HomeHeader from "../Home/Components/HomeHeader";
import RenderHistoryList from "./Components/RenderHistoryList";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const History = () => {
  const style = styles();
  const colors = useThemeColors();
  const fakeNotifications = useFakeNotifications(100);
  const flashListRef = useRef<any>(null);

  const notificationCounts = useMemo(
    () => countNotificationsByType(fakeNotifications),
    [fakeNotifications]
  );

  const filterTabData = useMemo(
    () => [
      {
        title: "All",
        reminders: fakeNotifications.length,
        icon: null,
        type: null,
      },
      {
        title: "Whatsapp",
        reminders: notificationCounts["whatsapp"] || 0,
        icon: AssetsPath.ic_whatsapp,
        type: "whatsapp",
      },
      {
        title: "SMS",
        reminders: notificationCounts["SMS"] || 0,
        icon: AssetsPath.ic_sms,
        type: "SMS",
      },
      {
        title: "Whatsapp Business",
        reminders: notificationCounts["whatsappBusiness"] || 0,
        icon: AssetsPath.ic_whatsappBusiness,
        type: "whatsappBusiness",
      },
      {
        title: "Email",
        reminders: notificationCounts["gmail"] || 0,
        icon: AssetsPath.ic_gmail,
        type: "gmail",
      },
    ],
    [notificationCounts, fakeNotifications]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [filteredNotifications, setFilteredNotifications] =
    useState(fakeNotifications);

  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const tabWidth = SCREEN_WIDTH / filterTabData.length;

  const handleTabPress = useCallback(
    (index: number) => {
      setActiveIndex(index);
      translateX.value = withTiming(index * tabWidth, { duration: 300 });
      scale.value = 1.1;

      const selectedType = filterTabData[index].type;
      if (selectedType) {
        setFilteredNotifications(
          fakeNotifications.filter(
            (notification) => notification.type === selectedType
          )
        );
      } else {
        setFilteredNotifications(fakeNotifications);
      }
    },
    [filterTabData, fakeNotifications, tabWidth]
  );

  return (
    <View style={style.container}>
      <HomeHeader hideGrid={true} hideThemeButton={true} />

      <View
        style={{ flex: 1, width: SIZE.appContainWidth, alignSelf: "center" }}
      >
        <FlashList
          ref={flashListRef}
          estimatedItemSize={300}
          data={filteredNotifications}
          stickyHeaderHiddenOnScroll={true}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          renderItem={({ item }) => <RenderHistoryList notification={item} />}
        />

        <View style={style.tabsContainer}>
          {filterTabData.map((res, index) => {
            const isActive = index === activeIndex;

            const onTabPress = () => {
              if (isActive) {
                if (flashListRef.current) {
                  flashListRef.current?.scrollToOffset({
                    animated: true,
                    offset: 0,
                  });
                }
              } else {
                handleTabPress(index);
              }
            };

            return (
              <Pressable
                key={index}
                onPress={onTabPress}
                style={[style.tabButton, { width: "100%" }]}
              >
                <Animated.View
                  style={[style.tabContainer, isActive && style.activeTab]}
                >
                  {res.icon && (
                    <Image
                      tintColor={colors.grayTitle}
                      source={res.icon}
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
                          backgroundColor: isActive
                            ? colors.yellow
                            : colors.grayTitle,
                        },
                      ]}
                    >
                      <Text style={style.badgeText}>{res.reminders}</Text>
                    </View>
                  )}
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

export default History;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    tabsContainer: {
      bottom: 38,
      height: 68,
      width: "100%",
      elevation: 5,
      borderRadius: 10,
      shadowColor: "#000",
      position: "absolute",
      flexDirection: "row",
      alignItems: "center",
      shadowOpacity: 0.3,
      shadowRadius: 3.84,
      justifyContent: "space-around",
      backgroundColor: colors.bottomTab,
      shadowOffset: { width: 0, height: 2 },
    },
    tabButton: {
      flex: 1,
      height: "98%",
      alignItems: "center",
      justifyContent: "center",
    },
    tabContainer: {
      flex: 1,
      width: "95%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    activeTab: {
      flex: 1,
      justifyContent: "center",
      borderRadius: 10,
      backgroundColor: "rgba(38, 107, 235, 1)",
    },
    iconStyle: {
      width: 20,
      height: 20,
      marginBottom: 10,
    },
    tabTitle: {
      rowGap: 10,
      fontFamily: FONTS.Medium,
    },
    badgeContainer: {
      position: "absolute",
      top: -5,
      right: 0,
      borderRadius: 50,
      width: 22,
      height: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    badgeText: {
      fontSize: 12,
      textAlign: "center",
      color: colors.black,
      fontFamily: FONTS.Medium,
    },
  });
};
