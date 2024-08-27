import React, { memo, useEffect, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppContext } from "../Contexts/ThemeProvider";
import AssetsPath from "../Global/AssetsPath";
import { FONTS } from "../Global/Theme";
import { useCountdownTimer } from "../Hooks/useCountdownTimer";
import useThemeColors from "../Theme/useThemeMode";
import { Notification, NotificationType } from "../Types/Interface";
import useNotificationIconColors from "../Hooks/useNotificationIconColors";
import { useNavigation } from "@react-navigation/native";

const LOGO_SIZE = 65;

export interface ReminderCardProps {
  notification: Notification;
}

export interface NotificationColor {
  backgroundColor: string;
  typeColor: string;
  iconColor: string;
  createViewColor: string;
}

export const formatNotificationType = (type: string) => {
  if (type === "whatsappBusiness") return "Whatsapp Business";
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case "whatsapp":
      return AssetsPath.ic_whatsapp;
    case "whatsappBusiness":
      return AssetsPath.ic_whatsappBusiness;
    case "SMS":
      return AssetsPath.ic_sms;
    case "gmail":
      return AssetsPath.ic_gmail;
    default:
      return null;
  }
};

const ReminderCard: React.FC<ReminderCardProps> = memo(({ notification }) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const navigation = useNavigation();
  const { timeLeft, startCountdown } = useCountdownTimer(notification.timer);
  const notificationColors = useNotificationIconColors(notification.type);

  useEffect(() => {
    startCountdown(notification.timer);
  }, [notification.timer, startCountdown]);

  // const notificationColors = useMemo(() => {
  //   const colorMap: Record<NotificationType, NotificationColor> = {
  //     whatsapp: {
  //       backgroundColor: colors.whatsappBackground,
  //       typeColor: colors.whatsapp,
  //       iconColor: colors.whatsappDark,
  //     },
  //     whatsappBusiness: {
  //       backgroundColor: colors.whatsappBusinessBackground,
  //       typeColor: colors.whatsappBusiness,
  //       iconColor: colors.whatsappBusinessDark,
  //     },
  //     SMS: {
  //       backgroundColor: colors.smsBackground,
  //       typeColor: colors.sms,
  //       iconColor: colors.smsDark,
  //     },
  //     gmail: {
  //       backgroundColor: colors.gmailBackground,
  //       typeColor: colors.gmail,
  //       iconColor: colors.gmailDark,
  //     },
  //   };
  //   return colorMap[notification.type];
  // }, [notification.type, colors]);

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
      : notificationColors.typeColor;
  }, [
    notification.type,
    theme,
    colors.gmailText,
    notificationColors.typeColor,
  ]);

  const icon = useMemo(
    () => getNotificationIcon(notification.type),
    [notification.type]
  );

  return (
    <Animated.View
      entering={FadeIn.duration(1 * Number(notification.id))}
      style={[styles.cardContainer, { backgroundColor: cardBackgroundColor }]}
    >
      <Pressable
        style={styles.pressableContainer}
        onPress={() =>
          navigation.navigate("CreateReminder", {
            notificationType: notification.type,
          })
        }
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
              {notification.senderName}
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
              {notification.message}
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
              {notification.time}
            </Text>
            <View style={[styles.separator, { borderColor: typeColor }]} />
            <View style={styles.countdownContainer}>
              <Image
                tintColor={typeColor}
                source={AssetsPath.ic_timerClock}
                style={styles.timerIcon}
              />
              <Text style={[styles.countdownText, { color: typeColor }]}>
                {timeLeft}
              </Text>
            </View>
          </View>
          <View style={styles.actionsContainer}>
            <Pressable onPress={() => console.log("edit")}>
              <Image
                tintColor={typeColor}
                source={AssetsPath.ic_edit}
                style={styles.actionIcon}
              />
            </Pressable>
            <Pressable onPress={() => console.log("view")}>
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
});

export default ReminderCard;

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    height: 120,
    borderRadius: 10,
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
    fontFamily: FONTS.SemiBold,
    fontSize: 21,
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
    top: 2,
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
    marginLeft: 8,
  },
});
