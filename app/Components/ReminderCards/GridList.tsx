import { MenuComponentRef, MenuView } from "@react-native-menu/menu";
import React, { FC, memo, useMemo, useRef } from "react";
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import AssetsPath from "../../Constants/AssetsPath";
import { FONTS } from "../../Constants/Theme";
import { useAppContext } from "../../Contexts/ThemeProvider";
import { useCountdownTimer } from "../../Hooks/useCountdownTimer";
import useThemeColors from "../../Hooks/useThemeMode";
import { formatTime } from "../../Screens/AddReminder/ReminderScheduled";
import { IListViewProps } from "../../Types/Interface";

const LOGO_SIZE = 25;

export type MenuItem = "view" | "edit" | "duplicate" | "delete";

const GridView: FC<IListViewProps> = ({
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
  const menuRef = useRef<MenuComponentRef>(null);
  const { timeLeft } = useCountdownTimer(notification.date);

  const description = useMemo(
    () =>
      notification.message?.toString() ||
      notification.subject?.toString() ||
      "No note",
    [notification]
  );

  const onMenuPress = () => {
    if (menuRef.current) {
      menuRef.current?.show();
    }
  };

  const handleMenuAction = ({
    nativeEvent,
  }: {
    nativeEvent: { event: string };
  }) => {
    switch (nativeEvent.event) {
      case "view":
        onCardPress();
        break;
      case "edit":
        onEditPress();
        break;
      case "duplicate":
        onDuplicatePress();
        break;
      case "delete":
        deleteReminder(notification?.id);
        break;
    }
  };

  const menuActions = useMemo(
    () => [
      {
        id: "view",
        title: "View",
      },
      {
        id: "edit",
        title: "Edit",
      },
      {
        id: "duplicate",
        title: "Duplicate",
      },
      {
        id: "delete",
        title: "Delete",
        attributes: {
          destructive: true,
        },
      },
    ],
    [colors.text]
  );

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.cardContainer, { backgroundColor: cardBackgroundColor }]}
    >
      <Pressable onPress={onCardPress} style={styles.pressableContainer}>
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
            {description}
          </Text>
        </View>

        <View style={styles.footerContainer}>
          <View style={styles.timeWrapper}>
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
          <Pressable onPress={onMenuPress}>
            <MenuView
              ref={menuRef}
              actions={menuActions}
              style={{ zIndex: 99999999999 }}
              onPressAction={handleMenuAction}
              shouldOpenOnLongPress={true}
              hitSlop={{ bottom: 25, left: 25, right: 25, top: 25 }}
            >
              <View style={styles.dropDownContainer}>
                <Image
                  source={AssetsPath.ic_dotMenu}
                  style={[styles.menu, { tintColor: colors.text }]}
                />
              </View>
            </MenuView>
          </Pressable>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: 4.5,
    height: 130,
    width: "49%",
    borderRadius: 15,
    overflow: "hidden",
  },
  pressableContainer: {
    flex: 1,
    padding: 10,
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
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
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
    fontSize: 13,
    letterSpacing: 0.5,
    fontFamily: FONTS.Medium,
  },
  actionsContainer: {},
  actionIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
    marginLeft: 12,
  },
  separator: {
    height: 14,
    justifyContent: "center",
    alignSelf: "center",
    marginLeft: 6,
    borderRightWidth: 1.5,
  },
  menu: {
    width: 14,
    height: 14,
    resizeMode: "contain",
  },
  dropDownContainer: {
    width: 18,
    height: 20,
    zIndex: 999999,
    justifyContent: "center",
    alignItems: "flex-end",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuContainer: {
    width: 200,
    borderRadius: 10,
    padding: 10,
    position: "absolute",
    right: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    marginLeft: 12,
  },
  menuIcon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
  },
});

export default memo(GridView);
