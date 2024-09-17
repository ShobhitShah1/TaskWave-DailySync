import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS, SIZE } from "../../Global/Theme";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import useNotificationIconColors from "../../Hooks/useNotificationIconColors";
import useThemeColors from "../../Theme/useThemeMode";
import { Notification } from "../../Types/Interface";
import { formatNotificationType } from "../../Utils/formatNotificationType";
import { formatDate, formatTime } from "../AddReminder/ReminderScheduled";

type NotificationProps = {
  params: { notificationData: Notification };
};

const ReminderPreview = () => {
  const style = styles();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { params } = useRoute<RouteProp<NotificationProps, "params">>();

  const notificationData = useMemo(() => {
    return params.notificationData;
  }, [params]);

  const notificationType = useMemo(() => {
    return notificationData?.type;
  }, [params, notificationData]);

  const { createViewColor, icon } = useNotificationIconColors(notificationType);
  const { formattedTimeLeft } = useCountdownTimer(notificationData?.date);

  const [hours, minutes, seconds] = formattedTimeLeft.split(" : ");

  return (
    <View style={style.container}>
      <View style={style.innerContainer}>
        <View style={style.backView}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={style.menuIconView}
          >
            <Image
              source={AssetsPath.ic_leftArrow}
              tintColor={colors.text}
              style={style.menuIcon}
            />
          </Pressable>
        </View>

        <View style={style.centeredContainer}>
          <View
            style={[
              style.notificationIconContainer,
              {
                backgroundColor:
                  notificationType === "gmail" ? colors.white : createViewColor,
              },
            ]}
          >
            <Image source={icon} style={style.notificationIcon} />
          </View>

          <Text style={[style.notificationText, { color: colors.text }]}>
            {formatNotificationType(notificationType)}
          </Text>

          <View style={style.timeContainer}>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {hours.split("Hrs")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Hrs
              </Text>
            </Text>
            <Text style={[style.timeSeparator, { color: createViewColor }]}>
              {" "}
              :{" "}
            </Text>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {minutes.split("Min")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Min
              </Text>
            </Text>
            <Text style={[style.timeSeparator, { color: createViewColor }]}>
              {" "}
              :{" "}
            </Text>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {seconds.split("Sec")[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>
                Sec
              </Text>
            </Text>
          </View>

          <View style={style.reminderDetails}>
            <View style={style.reminderDateTime}>
              <Text style={[style.dateTimeText, { color: colors.text }]}>
                {formatDate(notificationData.date)}
              </Text>
              <Text style={[style.dateTimeText, { color: colors.text }]}>
                {formatTime(notificationData.date)}
              </Text>
            </View>

            <View
              style={[
                style.reminderCard,
                { backgroundColor: colors.reminderCardBackground },
              ]}
            >
              <Text style={[style.reminderCardText, { color: colors.text }]}>
                {notificationData.message || notificationData.subject}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ReminderPreview;

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    innerContainer: {
      width: SIZE.appContainWidth,
      alignSelf: "center",
    },
    backView: {
      width: "100%",
      paddingVertical: 10,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    menuIconView: {
      width: 28,
      height: 28,
      borderRadius: 5,
      alignItems: "center",
      justifyContent: "center",
    },
    menuIcon: {
      width: 18,
      height: 18,
      resizeMode: "contain",
    },
    centeredContainer: {
      width: "100%",
      alignContent: "center",
      alignSelf: "center",
    },
    notificationIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 10,
      alignSelf: "center",
      justifyContent: "center",
    },
    notificationIcon: {
      width: 55,
      height: 55,
      resizeMode: "contain",
      alignSelf: "center",
    },
    notificationText: {
      fontSize: 20,
      marginVertical: 10,
      fontFamily: FONTS.Medium,
      textAlign: "center",
    },
    timeContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 10,
      alignSelf: "center",
    },
    timeText: {
      fontSize: 34,
      fontFamily: FONTS.Medium,
    },
    timeLabelText: {
      fontSize: 16,
      fontFamily: FONTS.Medium,
    },
    timeSeparator: {
      fontSize: 34,
      fontFamily: FONTS.Medium,
    },
    reminderDetails: {
      marginVertical: 20,
    },
    reminderDateTime: {
      flexDirection: "row",
      justifyContent: "space-between",
    },
    dateTimeText: {
      fontSize: 19,
      fontFamily: FONTS.Medium,
    },
    reminderCard: {
      width: "100%",
      marginVertical: 15,
      borderRadius: 10,
      padding: 10,
    },
    reminderCardText: {
      fontSize: 18,
      lineHeight: 28,
      fontFamily: FONTS.Medium,
    },
  });
};
