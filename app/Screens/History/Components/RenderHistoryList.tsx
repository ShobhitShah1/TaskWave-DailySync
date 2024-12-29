import { useNavigation } from "@react-navigation/native";
import { memo, useCallback, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Constants/AssetsPath";
import { FONTS } from "../../../Constants/Theme";
import { useDuplicateReminder } from "../../../Hooks/useDuplicateReminder";
import useNotificationIconColors from "../../../Hooks/useNotificationIconColors";
import useThemeColors from "../../../Hooks/useThemeMode";
import { ReminderCardProps } from "../../../Types/Interface";
import { getNotificationIcon } from "../../../Utils/getNotificationIcon";
import { formatDate, formatTime } from "../../AddReminder/ReminderScheduled";
import React from "react";
import { getNotificationTitle } from "../../../Utils/getNotificationTitle";

const RenderHistoryList: React.FC<ReminderCardProps> = memo(
  ({ notification, deleteReminder, loadNotifications }) => {
    const colors = useThemeColors();
    const { theme } = useAppContext();
    const navigation = useNavigation();
    const notificationColors = useNotificationIconColors(notification.type);

    const typeColor = useMemo(() => {
      return notification.type === "gmail" && theme === "light"
        ? colors.gmailText
        : notification.type === "whatsappBusiness"
        ? notificationColors.createViewColor
        : notificationColors.typeColor;
    }, [notification.type, theme, colors.gmailText, notificationColors]);

    const gmailBorder = useMemo(
      () =>
        notification.type === "gmail"
          ? notificationColors.iconColor
          : typeColor,
      [notificationColors]
    );

    const title = useMemo(
      () => getNotificationTitle(notification),
      [notification]
    );

    const icon = useMemo(
      () => getNotificationIcon(notification.type),
      [notification.type]
    );

    const onCardPress = useCallback(() => {
      navigation.navigate("ReminderPreview", {
        notificationData: notification,
      });
    }, [notification]);

    const { showDateTimeModal, renderDateTimePicker, openDuplicateModal } =
      useDuplicateReminder({
        notification: notification,
        theme: theme,
        onSuccess() {
          loadNotifications();
        },
      });

    return (
      <>
        <Animated.View
          entering={FadeIn.duration(1 * Number(notification.id))}
          style={[
            styles.cardContainer,
            {
              borderColor:
                notification.type === "gmail" ? gmailBorder : typeColor,
            },
          ]}
        >
          <Pressable
            style={styles.pressableContainer}
            onPress={onCardPress}
            onLongPress={() =>
              notification.id && deleteReminder(notification.id)
            }
          >
            <View style={styles.rowContainer}>
              <View style={styles.textContainer}>
                <Text
                  numberOfLines={1}
                  style={[styles.titleText, { color: colors.text }]}
                >
                  To: {title?.toString()}
                </Text>
                <Text
                  style={[styles.descriptionText, { color: colors.grayTitle }]}
                  numberOfLines={2}
                >
                  {notification?.message || notification.subject}
                </Text>
              </View>
              <View style={styles.iconContainer}>
                <Image
                  source={icon}
                  tintColor={
                    notification.type === "gmail" ? undefined : typeColor
                  }
                  resizeMode="contain"
                  style={styles.notificationIcon}
                />
              </View>
            </View>
            <View style={styles.footerContainer}>
              <View style={styles.timeContainer}>
                <View
                  style={[
                    styles.timeBadge,
                    {
                      backgroundColor:
                        theme === "dark"
                          ? colors.darkPrimaryBackground
                          : typeColor,
                    },
                  ]}
                >
                  <View style={styles.dateContainer}>
                    <Image
                      tintColor={colors.white}
                      source={AssetsPath.ic_calender}
                      style={styles.dateIcon}
                    />
                    <Text
                      style={[
                        styles.dateText,
                        {
                          color:
                            theme === "dark" ? colors.grayTitle : colors.white,
                        },
                      ]}
                    >
                      {formatDate(notification.date)}
                    </Text>
                  </View>
                  <View style={styles.timeIconContainer}>
                    <Image
                      tintColor={colors.white}
                      source={AssetsPath.ic_timerClock}
                      style={styles.timeIcon}
                    />
                    <Text
                      style={[
                        styles.timeText,
                        {
                          color:
                            theme === "dark" ? colors.grayTitle : colors.white,
                        },
                      ]}
                    >
                      {formatTime(notification.date)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsContainer}>
                <Pressable onPress={onCardPress}>
                  <Image
                    tintColor={theme === "dark" ? colors.white : typeColor}
                    source={AssetsPath.ic_view}
                    style={styles.actionIcon}
                  />
                </Pressable>
                <Pressable onPress={openDuplicateModal}>
                  <Image
                    tintColor={theme === "dark" ? colors.white : typeColor}
                    source={AssetsPath.ic_duplicate}
                    style={styles.actionIcon}
                  />
                </Pressable>
                <Pressable
                  onPress={() =>
                    notification?.id && deleteReminder(notification?.id)
                  }
                >
                  <Image
                    tintColor={theme === "dark" ? colors.white : typeColor}
                    source={AssetsPath.ic_delete}
                    style={[styles.actionIcon, { height: 17, width: 17 }]}
                  />
                </Pressable>
              </View>
            </View>
          </Pressable>
        </Animated.View>

        {showDateTimeModal && renderDateTimePicker()}
      </>
    );
  }
);

export default memo(RenderHistoryList);

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    marginVertical: 5,
    borderWidth: 1,
  },
  pressableContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowContainer: {
    flex: 0.75,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  textContainer: {
    width: "85%",
  },
  titleText: {
    fontSize: 20,
    marginBottom: 5,
    fontFamily: FONTS.Medium,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  iconContainer: {
    width: "10%",
    marginVertical: 5,
    alignItems: "center",
  },
  notificationIcon: {
    width: 28,
    height: 28,
  },
  footerContainer: {
    flex: 0.25,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeContainer: {
    maxWidth: "70%",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 25,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 5,
  },
  dateIcon: {
    width: 13,
    height: 13,
  },
  dateText: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
  timeIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 5,
    marginLeft: 5,
  },
  timeIcon: {
    width: 13,
    height: 13,
  },
  timeText: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
  },
  actionsContainer: {
    width: "25%",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginLeft: 13,
  },
});
