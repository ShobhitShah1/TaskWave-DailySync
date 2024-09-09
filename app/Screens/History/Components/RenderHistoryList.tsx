import { useNavigation } from "@react-navigation/native";
import { memo, useCallback, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useAppContext } from "../../../Contexts/ThemeProvider";
import AssetsPath from "../../../Global/AssetsPath";
import { FONTS } from "../../../Global/Theme";
import useNotificationIconColors from "../../../Hooks/useNotificationIconColors";
import useThemeColors from "../../../Theme/useThemeMode";
import { Notification } from "../../../Types/Interface";
import { getNotificationIcon } from "../../../Utils/getNotificationIcon";

export interface ReminderCardProps {
  notification: Notification;
}

export interface NotificationColor {
  backgroundColor: string;
  typeColor: string;
  iconColor: string;
  createViewColor: string;
}

const RenderHistoryList: React.FC<ReminderCardProps> = memo(
  ({ notification }) => {
    const colors = useThemeColors();
    const { theme } = useAppContext();
    const navigation = useNavigation();
    const notificationColors = useNotificationIconColors(notification.type);

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

    const onCardPress = useCallback(() => {
      navigation.navigate("ReminderPreview", {
        notificationData: notification,
      });
    }, [notification]);

    const onEditPress = useCallback(() => {
      navigation.navigate("CreateReminder", {
        notificationType: notification.type,
      });
    }, [notification]);

    return (
      <Animated.View
        entering={FadeIn.duration(1 * Number(notification.id))}
        style={[styles.cardContainer, { borderColor: typeColor }]}
      >
        <Pressable style={styles.pressableContainer} onPress={onCardPress}>
          <View style={styles.rowContainer}>
            <View style={styles.textContainer}>
              <Text
                numberOfLines={1}
                style={[styles.titleText, { color: colors.text }]}
              >
                To: Shobhit
              </Text>
              <Text
                style={[styles.descriptionText, { color: colors.grayTitle }]}
                numberOfLines={2}
              >
                Paragraphs are the building blocks of papers. Many students
                define paragraphs in terms of length: a paragraph is a group of
                at least five sentences, a paragraph is half a page long, etc.
                In reality, though, the unity and coherence of ideas among
                sentences is what constitutes a paragraph.
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
                    Wed 23, Jan
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
                    9:30
                  </Text>
                </View>
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
  }
);

export default RenderHistoryList;

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    height: 120,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginVertical: 5,
    borderWidth: 1,
  },
  pressableContainer: {
    flex: 1,
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
    fontSize: 22,
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
