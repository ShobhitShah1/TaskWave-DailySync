import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
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

  const { createNotification, getAllNotifications } = useDatabase();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (isFocus) loadNotifications();
  }, [isFocus]);

  const loadNotifications = async () => {
    const allNotifications = await getAllNotifications();
    if (allNotifications) {
      setNotifications(allNotifications.reverse());
    }
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

        <View style={{ flex: 1, height }}>
          <Animated.FlatList
            data={notifications}
            extraData={notifications}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyView}
            contentContainerStyle={{ paddingBottom: 30 }}
            keyExtractor={(item, index) => index.toString()}
            layout={LinearTransition.easing(Easing.ease).duration(500)}
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
