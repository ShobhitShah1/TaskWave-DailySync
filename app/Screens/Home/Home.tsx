import { FlashList } from "@shopify/flash-list";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Image,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import ReminderCard from "../../Components/ReminderCard";
import AssetsPath from "../../Global/AssetsPath";
import TextString from "../../Global/TextString";
import { SIZE } from "../../Global/Theme";
import { useFakeNotifications } from "../../Hooks/useFakeNotifications";
import useThemeColors from "../../Theme/useThemeMode";
import HomeHeader from "./Components/HomeHeader";
import styles from "./styles";
import FullScreenPreviewModal from "../../Components/FullScreenPreviewModal";
import useDatabase from "../../Hooks/useReminder";
import { Contact, Notification } from "../../Types/Interface";

const Home = () => {
  const style = styles();
  const colors = useThemeColors();
  const { height, width } = useWindowDimensions();
  const fakeNotifications = useFakeNotifications(100);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);

  const {
    createNotification,
    getAllNotifications,
    updateNotification,
    deleteNotification,
  } = useDatabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    console.log("notifications:", notifications);
  }, [notifications]);

  const loadNotifications = async () => {
    const allNotifications = await getAllNotifications();
    setNotifications(allNotifications);
  };

  const handleCreateNotification = async () => {
    const newNotification: Notification = {
      id: `new ${Math.random()}`,
      type: "whatsapp",
      message: "Remember to call",
      date: new Date(Date.now() + 86400000), // Tomorrow
      to: [
        { name: "John Doe", number: "+1234567890" },
        { name: "Jane Doe", number: "+0987654321" },
      ],
      subject: "",
      attachments: [],
    };
    const newId = await createNotification(newNotification);
    if (newId === null) {
      Alert.alert(
        "Error",
        "Failed to create notification. Database might not be initialized."
      );
    } else {
      loadNotifications();
    }
  };

  const renderEmptyView = () => {
    return (
      <View style={[style.emptyViewContainer, { width, height: "80%" }]}>
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

      {/* <Button onPress={() => handleCreateNotification()} title="Create" /> */}

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

        <View style={{ flex: 1, zIndex: 99999 }}>
          <FlashList
            extraData={true}
            data={notifications}
            estimatedItemSize={300}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyView}
            contentContainerStyle={{ paddingBottom: 30 }}
            renderItem={({ item }) => <ReminderCard notification={item} />}
          />
        </View>
      </View>

      <FullScreenPreviewModal
        isVisible={fullScreenPreview}
        onClose={() => setFullScreenPreview(false)}
      />
    </View>
  );
};

export default Home;
