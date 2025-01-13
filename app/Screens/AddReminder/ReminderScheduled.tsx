import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import React, { memo, useMemo } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AssetsPath from "../../Constants/AssetsPath";
import { FONTS, SIZE } from "../../Constants/Theme";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import useThemeColors from "../../Hooks/useThemeMode";
import { Notification } from "../../Types/Interface";
import { getNotificationTitle } from "../../Utils/getNotificationTitle";

type ReminderScheduledProps = {
  params: { themeColor: string; notification: Notification };
};

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const sortDaysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  const hours = date.getHours() % 12 || 12;
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = date.getHours() >= 12 ? "PM" : "AM";
  return `${hours}:${minutes} ${ampm}`;
};

export const formatDate = (date: Date, isSortDayName: boolean = false) => {
  const dayName = isSortDayName
    ? sortDaysOfWeek[date.getDay()]
    : daysOfWeek[date.getDay()];
  const day = date.getDate();
  const month = monthsOfYear[date.getMonth()];

  return `${dayName}, ${day} ${month}`;
};

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

  const { formattedTimeLeft } = useCountdownTimer(params?.notification?.date);

  const themeColor = useMemo(() => {
    return params?.themeColor;
  }, [params]);

  const notificationData = useMemo(() => {
    return params?.notification;
  }, [params]);

  const title = useMemo(
    () => getNotificationTitle(notificationData),
    [notificationData]
  );

  const [hours, minutes, seconds] = formattedTimeLeft.split(" : ");

  return (
    <SafeAreaView style={style.container}>
      <View style={style.contentWrapper}>
        <View
          style={{ height: "60%", width: "100%", justifyContent: "flex-end" }}
        >
          <LottieView
            source={AssetsPath.success_animation}
            style={{ width: "100%", height: "80%" }}
            autoPlay
            loop
          />
        </View>

        <View
          style={{
            height: "40%",
            alignItems: "center",
            width: "100%",
            justifyContent: "flex-end",
          }}
        >
          <View style={style.timeContainer}>
            <Text style={[style.timeText, { color: themeColor }]}>
              {hours.split("Hrs")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Hrs
              </Text>
            </Text>
            <Text style={[style.timeSeparator, { color: themeColor }]}>
              {" "}
              :{" "}
            </Text>
            <Text style={[style.timeText, { color: themeColor }]}>
              {minutes.split("Min")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Min
              </Text>
            </Text>
            <Text style={[style.timeSeparator, { color: themeColor }]}>
              {" "}
              :{" "}
            </Text>
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
                { backgroundColor: colors.previewBackground },
              ]}
            >
              <View style={style.cardHeader}>
                <View style={style.userInfo}>
                  <Image
                    resizeMode="cover"
                    source={AssetsPath.appLogoRound}
                    style={style.userImage}
                  />
                  <Text
                    numberOfLines={2}
                    style={[style.userName, { color: colors.text }]}
                  >
                    {title?.toString()}
                  </Text>
                  <Text
                    style={[style.timeAgo, { color: colors.placeholderText }]}
                  >
                    12m ago
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  style.notificationText,
                  { color: colors.placeholderText },
                ]}
                numberOfLines={3}
              >
                {notificationData.message ||
                  notificationData.subject ||
                  "No Message Available"}
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
              {`You have received a notification at ${formatDateTime(
                notificationData.date
              )}, tap on it.`}
            </Text>
          </View>
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
    </SafeAreaView>
  );
};

export default memo(ReminderScheduled);

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
      maxWidth: "100%",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    userInfo: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    userImage: {
      width: 40,
      height: 40,
      borderRadius: 5,
    },
    userName: {
      width: "68%",
      fontSize: 18,
      marginLeft: 10,
      fontFamily: FONTS.Medium,
    },
    timeAgo: {
      fontFamily: FONTS.Medium,
      fontSize: 16,
      alignItems: "flex-end",
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
