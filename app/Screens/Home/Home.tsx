import { useIsFocused } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  Pressable,
  RefreshControl,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  LinearTransition,
} from "react-native-reanimated";
import FullScreenPreviewModal from "../../Components/FullScreenPreviewModal";
import ReminderCard from "../../Components/ReminderCard";
import AssetsPath from "../../Global/AssetsPath";
import TextString from "../../Global/TextString";
import { SIZE } from "../../Global/Theme";
import useDatabase from "../../Hooks/useReminder";
import useThemeColors from "../../Theme/useThemeMode";
import { Notification } from "../../Types/Interface";
import HomeHeader from "./Components/HomeHeader";
import styles from "./styles";

const Home = () => {
  const style = styles();
  const colors = useThemeColors();
  const isFocus = useIsFocused();
  const { height, width } = useWindowDimensions();
  const [fullScreenPreview, setFullScreenPreview] = useState(false);

  const { getAllNotifications, deleteNotification, initializeDatabase } =
    useDatabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  useEffect(() => {
    if (isFocus) loadNotifications();
  }, [isFocus]);

  const loadNotifications = async () => {
    try {
      const allNotifications = await getAllNotifications();
      console.log("Fetched Notifications:", allNotifications);
      if (allNotifications && allNotifications.length > 0) {
        setNotifications(allNotifications.reverse());
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const deleteReminder = useCallback(async (id?: string) => {
    if (!id) {
      return;
    }

    const deleteResponse = await deleteNotification(id);
    console.log("deleteResponse:", deleteResponse);
    loadNotifications();
  }, []);

  const renderEmptyView = () => {
    return (
      <View style={[style.emptyViewContainer, { width, height: height - 180 }]}>
        <Image
          style={style.emptyDateTimeImage}
          source={AssetsPath.ic_emptyDateTime}
        />
        <View style={style.emptyTextContainer}>
          <Text style={style.emptyNoEventTitle}>
            {TextString.NoScheduleYet}
          </Text>
          <Text style={style.emptyListText}>
            {TextString.LetsScheduleYourDailyEvents}
          </Text>
        </View>
        <Image
          source={AssetsPath.ic_emptyRocket}
          resizeMode="contain"
          style={style.emptyArrowRocket}
        />
      </View>
    );
  };

  const RenderHeaderView = () => {
    return (
      <View style={style.listHeaderView}>
        <Text style={style.headerScheduleText}>Schedule</Text>
        <View>
          <View></View>
          <Pressable onPress={() => setFullScreenPreview(true)}>
            <Image
              resizeMode="contain"
              tintColor={colors.text}
              source={AssetsPath.ic_fullScreen}
              style={style.fullScreenIcon}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={style.container}>
      <HomeHeader hideGrid={notifications?.length === 0} />

      <View
        style={{ flex: 1, width: SIZE.appContainWidth, alignSelf: "center" }}
      >
        {notifications?.length !== 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={style.wrapper}>
            <View style={style.dateContainer}>
              <Text style={style.todayText}>Today</Text>
              <Text style={style.dateText}>Monday, 23 Nov</Text>
            </View>

            <View style={style.statusContainer}>
              <View style={style.statusItem}>
                <View
                  style={[style.statusDot, { backgroundColor: colors.green }]}
                />
                <Text style={style.statusText}>12</Text>
              </View>
              <View style={style.statusItem}>
                <View style={[style.statusDot, { backgroundColor: "gray" }]} />
                <Text style={style.statusText}>23</Text>
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View></Animated.View>

        {notifications?.length !== 0 && <RenderHeaderView />}

        <View style={{ flex: 1, height }}>
          <Animated.FlatList
            data={notifications}
            extraData={notifications}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                progressBackgroundColor={colors.background}
                colors={[colors.text]}
                onRefresh={onRefresh}
              />
            }
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyView}
            contentContainerStyle={{ paddingBottom: 30 }}
            keyExtractor={(item, index) => index.toString()}
            layout={LinearTransition.easing(Easing.ease).duration(500)}
            renderItem={({ item }) => (
              <ReminderCard
                notification={item}
                deleteReminder={deleteReminder}
              />
            )}
          />
        </View>
      </View>

      <FullScreenPreviewModal
        isVisible={fullScreenPreview}
        notifications={notifications}
        onClose={() => setFullScreenPreview(false)}
      />
    </View>
  );
};

export default Home;
