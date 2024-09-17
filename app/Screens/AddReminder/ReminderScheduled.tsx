import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS, SIZE } from "../../Global/Theme";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import useThemeColors from "../../Theme/useThemeMode";
import { Notification } from "../../Types/Interface";
import TextString from "../../Global/TextString";

type ReminderScheduledProps = {
  params: { themeColor: string; notification: Notification };
};

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthsOfYear = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatTime = (date: Date) => {
  const hours = date.getHours() % 12 || 12; // Convert 24-hour to 12-hour format
  const minutes = date.getMinutes().toString().padStart(2, "0"); // Add leading 0 if needed
  const ampm = date.getHours() >= 12 ? "PM" : "AM"; // AM or PM
  return `${hours}:${minutes} ${ampm}`;
};

// Function to format the date part (e.g., Thu, Jan 23)
export const formatDate = (date: Date) => {
  const dayName = daysOfWeek[date.getDay()]; // e.g., Thu
  const day = date.getDate(); // e.g., 23
  const month = monthsOfYear[date.getMonth()]; // e.g., Jan
  return `${dayName}, ${month} ${day}`;
};

// Function to join both the date and time parts (optional)
export const formatDateTime = (date: Date) => {
  const formattedTime = formatTime(date);
  const formattedDate = formatDate(date);
  return `${formattedTime} on ${formattedDate}`;
};

const ReminderScheduled = () => {
  const style = styles();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { params } = useRoute<RouteProp<ReminderScheduledProps, "params">>();

  const { formattedTimeLeft, timeLeft } = useCountdownTimer(
    params?.notification?.date
  );

  const themeColor = useMemo(() => {
    return params?.themeColor;
  }, [params]);

  const notificationData = useMemo(() => {
    return params?.notification;
  }, [params]);

  const [hours, minutes, seconds] = formattedTimeLeft.split(" : ");

  return (
    <View style={style.container}>
      <View style={style.contentWrapper}>
        <View style={style.timeContainer}>
          <Text style={[style.timeText, { color: themeColor }]}>
            {hours.split("Hrs")[0]}
            <Text style={[style.timeLabelText, { color: colors.text }]}>
              Hrs
            </Text>
          </Text>
          <Text style={[style.timeSeparator, { color: themeColor }]}> : </Text>
          <Text style={[style.timeText, { color: themeColor }]}>
            {minutes.split("Min")[0]}
            <Text style={[style.timeLabelText, { color: colors.text }]}>
              Min
            </Text>
          </Text>
          <Text style={[style.timeSeparator, { color: themeColor }]}> : </Text>
          <Text style={[style.timeText, { color: themeColor }]}>
            {seconds.split("Sec")[0]}
            <Text style={[style.timeLabelText, { color: colors.text }]}>
              Sec
            </Text>
          </Text>
        </View>

        <View style={style.notificationWrapper}>
          <View
            style={[
              style.card,
              { backgroundColor: colors.reminderCardBackground },
            ]}
          >
            <View style={style.cardHeader}>
              <View style={style.userInfo}>
                <Image
                  resizeMode="cover"
                  source={AssetsPath.ic_appLogo}
                  style={style.userImage}
                />
                <Text style={[style.userName, { color: colors.white }]}>
                  {TextString.TaskWave}
                </Text>
              </View>
              <Text style={[style.timeAgo, { color: colors.white08 }]}>
                12m ago
              </Text>
            </View>

            <Text style={[style.notificationText, { color: colors.white08 }]}>
              {notificationData.message || "No Message Available"}
            </Text>

            <Image
              resizeMode="contain"
              source={AssetsPath.ic_hand}
              style={[style.handImage, { left: width / 2.2 }]}
            />
          </View>

          <Text
            style={[style.receivedNotificationText, { color: colors.text }]}
          >
            {`You have received a notification at ${formatDateTime(notificationData.date)}, tap on it.`}
          </Text>
        </View>
      </View>
      <Pressable
        onPress={() => navigation.navigate("Home")}
        style={style.contactDoneButtonView}
      >
        <Image
          resizeMode="contain"
          source={AssetsPath.ic_leftPointyArrow}
          style={style.pointyRightArrow}
        />
        <Text style={style.contactDoneButtonText}>Home</Text>
      </Pressable>
    </View>
  );
};

export default ReminderScheduled;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "flex-end",
      backgroundColor: colors.background,
    },
    contentWrapper: {
      width: SIZE.appContainWidth,
      alignItems: "center",
    },
    notificationWrapper: {
      width: "100%",
      marginVertical: 30,
    },
    card: {
      padding: 15,
      width: "100%",
      borderRadius: 10,
      marginBottom: 50,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
    },
    userImage: {
      width: 40,
      height: 40,
      borderRadius: 5,
    },
    userName: {
      fontSize: 18,
      marginLeft: 10,
      fontFamily: FONTS.Medium,
    },
    timeAgo: {
      fontFamily: FONTS.Medium,
      fontSize: 16,
    },
    notificationText: {
      marginVertical: 5,
      width: "85%",
      fontSize: 16,
      alignSelf: "flex-end",
      fontFamily: FONTS.Medium,
    },
    handImage: {
      width: 33,
      height: 33,
      alignSelf: "center",
      position: "absolute",
      bottom: -25,
    },
    receivedNotificationText: {
      fontSize: 18,
      marginVertical: 15,
      textAlign: "center",
      fontFamily: FONTS.Medium,
    },
    contactDoneButtonText: {
      color: colors.white,
      fontFamily: FONTS.Bold,
      fontSize: 18,
    },
    contactDoneButtonView: {
      width: 150,
      height: 43,
      borderRadius: 25,
      marginVertical: 20,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(64, 93, 240, 1)",
    },
    pointyRightArrow: {
      width: 18,
      height: 18,
      marginRight: 10,
      alignItems: "center",
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
    },
    timeText: {
      fontSize: 32,
      fontFamily: FONTS.Medium,
    },
    timeLabelText: {
      fontSize: 14,
      fontFamily: FONTS.Medium,
    },
    timeSeparator: {
      fontSize: 32,
      fontFamily: FONTS.Medium,
    },
  });
};
