import { useNavigation } from "@react-navigation/native";
import React, { memo, useCallback, useEffect, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../Contexts/ThemeProvider";
import AssetsPath from "../Global/AssetsPath";
import { FONTS } from "../Global/Theme";
import { useCountdownTimer } from "../Hooks/useCountdownTimer";
import useNotificationIconColors from "../Hooks/useNotificationIconColors";
import useThemeColors from "../Theme/useThemeMode";
import { Notification } from "../Types/Interface";
import { formatNotificationType } from "../Utils/formatNotificationType";
import { getNotificationIcon } from "../Utils/getNotificationIcon";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { formatTime } from "../Screens/AddReminder/ReminderScheduled";

const LOGO_SIZE = 65;

export interface ReminderCardProps {
  notification: Notification;
  deleteReminder: (id?: string) => void;
  onRefreshData?: () => void;
}

export interface NotificationColor {
  backgroundColor: string;
  typeColor: string;
  iconColor: string;
  createViewColor: string;
  icon: number;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  notification,
  deleteReminder,
  onRefreshData,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const navigation = useNavigation();
  const { timeLeft, timeIsOver } = useCountdownTimer(notification.date);
  const notificationColors = useNotificationIconColors(notification.type);

  useEffect(() => {
    if (timeIsOver && onRefreshData) {
      onRefreshData();
    }
  }, [timeIsOver, timeLeft]);

  const cardBackgroundColor = useMemo(() => {
    return theme === "dark"
      ? colors.reminderCardBackground
      : notificationColors.backgroundColor;
  }, [
    theme,
    colors.reminderCardBackground,
    notificationColors.backgroundColor,
  ]);

  const typeColor = useMemo(() => {
    return notification.type === "gmail" && theme === "light"
      ? colors.gmailText
      : notification.type === "whatsappBusiness"
        ? notificationColors.createViewColor
        : notificationColors.typeColor;
  }, [notification.type, theme, colors.gmailText, notificationColors]);

  const icon = useMemo(
    () => getNotificationIcon(notification.type),
    [notification.type]
  );

  const onCardPress = useCallback(() => {
    navigation.navigate("ReminderPreview", {
      notificationData: notification,
    });
  }, [notification]);

  const onEditPress = useCallback(() => {
    navigation.navigate("CreateReminder", {
      notificationType: notification.type,
      id: notification?.id,
    });
  }, [notification]);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.cardContainer, { backgroundColor: cardBackgroundColor }]}
    >
      <Pressable
        onPress={onCardPress}
        onLongPress={() => deleteReminder(notification?.id)}
        style={styles.pressableContainer}
      >
        <View style={styles.rowContainer}>
          <View style={styles.logoWrapper}>
            <View
              style={[
                styles.logoContainer,
                {
                  backgroundColor:
                    notification.type === "gmail" ? colors.gmail : typeColor,
                },
              ]}
            >
              <Image source={icon} style={styles.logo} />
            </View>
          </View>
          <View style={styles.textContainer}>
            <Text
              numberOfLines={1}
              style={[styles.senderName, { color: colors.text }]}
            >
              {notification.type === "gmail"
                ? notification?.toMail?.[0]
                : notification?.toContact?.map(
                    (res) =>
                      `${res.name}${notification?.toContact?.length >= 2 ? "," : ""} `
                  )}
            </Text>
            <Text
              numberOfLines={3}
              style={{
                color:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(139, 142, 142, 1)",
                fontFamily: FONTS.Medium,
                fontSize: 16,
                lineHeight: 20,
                marginTop: 3,
              }}
            >
              {notification.message || notification.subject}
            </Text>
          </View>
          <View style={styles.typeContainer}>
            <Text style={[styles.typeText, { color: typeColor }]}>
              {formatNotificationType(notification.type)}
            </Text>

            <Image
              tintColor={typeColor}
              source={AssetsPath.ic_notification}
              style={styles.notificationIcon}
            />
          </View>
        </View>
        <View style={styles.footerContainer}>
          <View style={styles.timeContainer}>
            <Text style={[styles.timeText, { color: typeColor }]}>
              {formatTime(notification.date)}
            </Text>
            <View style={[styles.separator, { borderColor: typeColor }]} />
            <View style={styles.countdownContainer}>
              <Image
                tintColor={colors.text}
                source={AssetsPath.ic_timerClock}
                style={styles.timerIcon}
              />
              <Text style={[styles.countdownText, { color: typeColor }]}>
                {timeLeft}
              </Text>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <Pressable onPress={onEditPress}>
              <Image
                tintColor={typeColor}
                source={AssetsPath.ic_edit}
                style={styles.actionIcon}
              />
            </Pressable>
            <Pressable onPress={onCardPress}>
              <Image
                tintColor={typeColor}
                source={AssetsPath.ic_view}
                style={styles.actionIcon}
              />
            </Pressable>
            <Pressable onPress={() => console.log("duplicate")}>
              <Image
                tintColor={typeColor}
                source={AssetsPath.ic_duplicate}
                style={styles.actionIcon}
              />
            </Pressable>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default memo(ReminderCard);

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    height: 125,
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 5,
  },
  pressableContainer: {
    flex: 1,
  },
  rowContainer: {
    flex: 0.8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logoWrapper: {
    width: "20%",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: LOGO_SIZE / 1.8,
    height: LOGO_SIZE / 1.8,
    resizeMode: "contain",
  },
  textContainer: {
    width: "60%",
    paddingHorizontal: 15,
  },
  senderName: {
    fontSize: 20,
    fontFamily: FONTS.SemiBold,
  },
  typeContainer: {
    width: "20%",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    right: 4,
  },
  notificationIcon: {
    width: 17,
    height: 17,
    justifyContent: "center",
    alignItems: "center",
    resizeMode: "contain",
  },
  footerContainer: {
    flex: 0.2,
    top: 4,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeContainer: {
    flexDirection: "row",
    width: "73%",
  },
  timeText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  separator: {
    height: 15,
    justifyContent: "center",
    alignSelf: "center",
    marginHorizontal: 10,
    borderRightWidth: 1.5,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerIcon: {
    width: 12,
    height: 12,
    marginRight: 5,
  },
  countdownText: {
    fontSize: 16,
    letterSpacing: 1.5,
    fontFamily: FONTS.Medium,
  },
  actionsContainer: {
    flexDirection: "row",
    width: "25%",
    justifyContent: "flex-end",
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginLeft: 13,
  },
});
