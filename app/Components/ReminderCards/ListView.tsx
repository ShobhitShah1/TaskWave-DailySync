import React, { FC, memo, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppContext } from "../../Contexts/ThemeProvider";
import AssetsPath from "../../Constants/AssetsPath";
import { FONTS } from "../../Constants/Theme";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import { formatTime } from "../../Screens/AddReminder/ReminderScheduled";
import { IListViewProps } from "../../Types/Interface";
import { formatNotificationType } from "../../Utils/formatNotificationType";
import useThemeColors from "../../Hooks/useThemeMode";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const LOGO_SIZE = 65;

const ListView: FC<IListViewProps> = ({
  cardBackgroundColor,
  icon,
  title,
  notification,
  onCardPress,
  typeColor,
  deleteReminder,
  onEditPress,
  onDuplicatePress,
}) => {
  const colors = useThemeColors();

  const { theme } = useAppContext();
  const { timeLeft } = useCountdownTimer(notification.date);

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[
        styles.cardContainer,
        { width: "100%", backgroundColor: cardBackgroundColor },
      ]}
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
              {title}
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
            <Pressable onPress={onCardPress} style={{ paddingHorizontal: 5 }}>
              <Image
                tintColor={typeColor}
                source={AssetsPath.ic_view}
                style={styles.actionIcon}
              />
            </Pressable>
            <Pressable onPress={onEditPress} style={{ paddingHorizontal: 5 }}>
              <Image
                tintColor={typeColor}
                source={AssetsPath.ic_edit}
                style={styles.actionIcon}
              />
            </Pressable>
            <Pressable
              onPress={onDuplicatePress}
              style={{ paddingHorizontal: 5 }}
            >
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

export default memo(ListView);

const styles = StyleSheet.create({
  cardContainer: {
    height: 128,
    borderRadius: 15,
    marginVertical: 5,
    overflow: "hidden",
  },
  pressableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
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
    bottom: 3,
    right: 3,
    gap: 5,
    flexDirection: "row",
    width: "25%",
    justifyContent: "flex-end",
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    // paddingRight: 13,
  },
});
