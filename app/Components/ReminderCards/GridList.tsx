import React, { FC, memo, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../../Contexts/ThemeProvider";
import AssetsPath from "../../Global/AssetsPath";
import { FONTS } from "../../Global/Theme";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import { formatTime } from "../../Screens/AddReminder/ReminderScheduled";
import { IListViewProps } from "../../Types/Interface";

const LOGO_SIZE = 25;

const GridView: FC<IListViewProps> = ({
  cardBackgroundColor,
  colors,
  icon,
  notification,
  onCardPress,
  typeColor,
  deleteReminder,
  onEditPress,
}) => {
  const { theme } = useAppContext();
  const { timeLeft } = useCountdownTimer(notification.date);

  const title = useMemo(
    () =>
      notification.type === "gmail"
        ? notification?.toMail?.[0]
        : notification?.toContact?.map(
            (res) =>
              `${res.name}${notification?.toContact?.length >= 2 ? "," : ""} `
          ),
    [notification]
  );

  return (
    <View
      style={[styles.cardContainer, { backgroundColor: cardBackgroundColor }]}
    >
      <Pressable
        onPress={onCardPress}
        onLongPress={() => deleteReminder(notification?.id)}
        style={styles.pressableContainer}
      >
        <View style={styles.headerContainer}>
          <Text
            numberOfLines={1}
            style={[styles.senderName, { color: colors.text }]}
          >
            {title?.toString()}
          </Text>

          <View style={styles.typeContainer}>
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
            <Image
              tintColor={typeColor}
              source={AssetsPath.ic_notification}
              style={styles.notificationIcon}
            />
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <Text
            numberOfLines={2}
            style={[
              styles.messageText,
              {
                color:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.7)"
                    : "rgba(139, 142, 142, 1)",
              },
            ]}
          >
            {notification.message?.toString() ||
              notification.subject?.toString() ||
              "No note"}
          </Text>
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.timeWrapper}>
            <Text style={[styles.timeText, { color: typeColor }]}>
              {formatTime(notification.date)}
            </Text>
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
          <View style={styles.actionsContainer}>{/* 3 Dot */}</View>
        </View>
      </Pressable>
    </View>
  );
};

export default memo(GridView);

const styles = StyleSheet.create({
  cardContainer: {
    margin: 5,
    height: 130,
    padding: 10,
    width: "48%",
    borderRadius: 15,
  },
  pressableContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 12,
    marginRight: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: LOGO_SIZE / 1.8,
    height: LOGO_SIZE / 1.8,
    resizeMode: "contain",
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    marginRight: 4,
  },
  notificationIcon: {
    width: 16,
    height: 16,
    resizeMode: "contain",
  },
  contentContainer: {
    flex: 1,
    marginTop: 10,
  },
  senderName: {
    fontSize: 18,
    width: "70%",
    marginBottom: 4,
    fontFamily: FONTS.SemiBold,
  },
  messageText: {
    fontFamily: FONTS.Medium,
    fontSize: 14,
    lineHeight: 18,
  },
  footerContainer: {
    marginTop: 3,
  },
  timeWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  countdownContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timerIcon: {
    width: 12,
    height: 12,
    marginHorizontal: 5,
  },
  countdownText: {
    fontSize: 14,
    letterSpacing: 1,
    fontFamily: FONTS.Medium,
  },
  actionsContainer: {},
  actionIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginLeft: 12,
  },
});
