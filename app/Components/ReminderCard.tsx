import React, { memo, useEffect, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../Contexts/ThemeProvider";
import { Notification, NotificationType } from "../Screens/Home/Home";
import useThemeColors from "../Theme/useThemeMode";
import Animated, { FadeIn } from "react-native-reanimated";
import AssetsPath from "../Global/AssetsPath";
import { FONTS } from "../Global/Theme";
import { useCountdownTimer } from "../Hooks/useCountdownTimer";

const LOGO_SIZE = 65;

interface ReminderCardProps {
  notification: Notification;
}

export interface NotificationColor {
  backgroundColor: string;
  typeColor: string;
  iconColor: string;
}

function formatNotificationType(type: string) {
  if (type === "whatsappBusiness") {
    return "Whatsapp Business";
  }
  return type
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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
  const { timeLeft, startCountdown } = useCountdownTimer();

  useEffect(() => {
    startCountdown(notification.timer);
  }, [notification.timer, startCountdown]);

  const NotificationColors: Record<NotificationType, NotificationColor> = {
    whatsapp: {
      backgroundColor: colors.whatsappBackground,
      typeColor: colors.whatsapp,
      iconColor: colors.whatsappDark,
    },
    whatsappBusiness: {
      backgroundColor: colors.whatsappBusinessBackground,
      typeColor: colors.whatsappBusiness,
      iconColor: colors.whatsappBusinessDark,
    },
    SMS: {
      backgroundColor: colors.smsBackground,
      typeColor: colors.sms,
      iconColor: colors.smsDark,
    },
    gmail: {
      backgroundColor: colors.gmailBackground,
      typeColor: colors.gmail,
      iconColor: colors.gmailDark,
    },
  };

  const notificationColors = useMemo(
    () => NotificationColors[notification.type],
    [notification.type]
  );

  const cardBackgroundColor = useMemo(
    () =>
      theme === "dark"
        ? colors.reminderCardBackground
        : notificationColors.backgroundColor,
    [theme, colors.reminderCardBackground, notificationColors.backgroundColor]
  );

  const typeColor = useMemo(
    () =>
      theme === "dark"
        ? notificationColors.typeColor
        : notificationColors.typeColor,
    [theme, colors.reminderCardBackground, notificationColors.typeColor]
  );

  const iconColor = useMemo(
    () =>
      theme === "dark"
        ? notificationColors.iconColor
        : notificationColors.iconColor,
    [theme, colors.reminderCardBackground, notificationColors.iconColor]
  );

  const icon = useMemo(
    () => getNotificationIcon(notification.type),
    [notification.type]
  );

  const style = styles();

  return (
    <Animated.View entering={FadeIn.duration(1 * Number(notification.id))}>
      <Pressable
        style={[style.cardContainer, { backgroundColor: cardBackgroundColor }]}
      >
        <View
          style={{
            flex: 0.8,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <View
            style={{
              width: "20%",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View style={[style.logoContainer, { backgroundColor: typeColor }]}>
              <Image source={icon} style={style.logo} />
            </View>
          </View>
          <View style={{ width: "60%", paddingHorizontal: 15 }}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.text,
                fontFamily: FONTS.SemiBold,
                fontSize: 21,
              }}
            >
              {notification.senderName}
            </Text>
            <Text
              style={{
                color:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(139, 142, 142, 1)",
                fontFamily: FONTS.Medium,
                fontSize: 16,
                lineHeight: 20,
                marginTop: 5,
              }}
              numberOfLines={3}
            >
              {notification.message}
            </Text>
          </View>

          <View
            style={{
              width: "20%",
              flexDirection: "row",
              justifyContent: "flex-end",
              alignSelf: "flex-start",
            }}
          >
            <Text
              style={{
                color: typeColor,
                fontSize: 16,
                fontFamily: FONTS.Medium,
                right: 4,
              }}
            >
              {formatNotificationType(notification.type)}
            </Text>
            <Image
              tintColor={typeColor}
              source={AssetsPath.ic_notification}
              style={style.notificationIcon}
            />
          </View>
        </View>
        <View
          style={{
            flex: 0.2,
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: typeColor,
              fontSize: 16,
              fontFamily: FONTS.Medium,
            }}
          >
            {timeLeft}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

export default ReminderCard;

const styles = () =>
  StyleSheet.create({
    cardContainer: {
      width: "100%",
      height: 115,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      marginVertical: 5,
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
    notificationIcon: {
      width: 17,
      height: 17,
      justifyContent: "center",
      alignItems: "center",
      resizeMode: "contain",
    },
  });
