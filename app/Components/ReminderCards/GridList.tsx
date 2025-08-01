import { MenuComponentRef, MenuView } from '@react-native-menu/menu';
import React, { FC, memo, useMemo, useRef } from 'react';
import { Dimensions, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { useCountdownTimer } from '@Hooks/useCountdownTimer';
import useThemeColors from '@Hooks/useThemeMode';
import { formatTime } from '@Screens/AddReminder/ReminderScheduled';
import { IListViewProps } from '@Types/Interface';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const LOGO_SIZE = SCREEN_WIDTH * 0.06;
const CARD_WIDTH = SCREEN_WIDTH < 375 ? '47%' : '49%';

const GridView: FC<IListViewProps> = ({
  cardBackgroundColor,
  icon,
  title,
  address,
  notification,
  onCardPress,
  typeColor,
  deleteReminder,
  onEditPress,
  onDuplicatePress,
}) => {
  const colors = useThemeColors();
  const isLocation = notification?.type === 'location';
  const { theme } = useAppContext();
  const menuRef = useRef<MenuComponentRef>(null);
  const { timeLeft } = useCountdownTimer(notification.date);

  const description = useMemo(
    () => notification.message?.toString() || notification.subject?.toString() || 'No note',
    [notification],
  );

  const onMenuPress = () => {
    menuRef.current?.show();
  };

  const handleMenuAction = ({ nativeEvent }: { nativeEvent: { event: string } }) => {
    switch (nativeEvent.event) {
      case 'view':
        onCardPress();
        break;
      case 'edit':
        onEditPress();
        break;
      case 'duplicate':
        onDuplicatePress();
        break;
      case 'delete':
        deleteReminder(notification?.id);
        break;
    }
  };

  const menuActions = useMemo(
    () => [
      { id: 'view', title: 'View' },
      { id: 'edit', title: 'Edit' },
      { id: 'duplicate', title: 'Duplicate' },
      {
        id: 'delete',
        title: 'Delete',
        attributes: { destructive: true },
      },
    ],
    [colors.text],
  );

  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      style={[styles.cardContainer, { backgroundColor: cardBackgroundColor }]}
    >
      <Pressable onPress={onCardPress} style={styles.pressableContainer}>
        <View style={styles.headerContainer}>
          <Text numberOfLines={1} style={[styles.senderName, { color: colors.text }]}>
            {title?.toString()}
          </Text>

          <View style={styles.typeContainer}>
            {isLocation ? (
              <Image
                source={icon}
                style={{ width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: 12, marginRight: 3 }}
              />
            ) : (
              <View
                style={[
                  styles.logoContainer,
                  {
                    backgroundColor: notification.type === 'gmail' ? colors.gmail : typeColor,
                  },
                ]}
              >
                <Image source={icon} style={styles.logo} />
              </View>
            )}
            <Image
              tintColor={typeColor}
              source={AssetsPath.ic_notification}
              style={styles.notificationIcon}
            />
          </View>
        </View>

        <View style={styles.contentContainer}>
          <Text
            numberOfLines={3}
            style={[
              styles.messageText,
              {
                color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(139, 142, 142, 1)',
              },
            ]}
          >
            {description}
          </Text>
        </View>

        <View style={styles.footerContainer}>
          <View style={[styles.timeWrapper]}>
            <Text style={[styles.timeText, { color: typeColor }]}>
              {formatTime(new Date(notification.date))}
            </Text>

            <View style={[styles.separator, { borderColor: typeColor }]} />

            <View style={styles.countdownContainer}>
              {!isLocation && (
                <Image
                  tintColor={colors.text}
                  source={AssetsPath.ic_timerClock}
                  style={styles.timerIcon}
                />
              )}
              <Text
                numberOfLines={2}
                style={[
                  styles.countdownText,
                  { color: typeColor, marginHorizontal: isLocation ? 4 : 0 },
                ]}
              >
                {isLocation ? address : timeLeft}
              </Text>
            </View>
          </View>
          <Pressable hitSlop={15} onPress={onMenuPress} style={[styles.menuPressable]}>
            <MenuView
              ref={menuRef}
              actions={menuActions ?? []}
              onOpenMenu={() => {}}
              style={styles.menuView}
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
    width: CARD_WIDTH,
    borderRadius: 15,
    overflow: 'hidden',
  },
  pressableContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 12,
    marginRight: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE / 1.8,
    height: LOGO_SIZE / 1.8,
    resizeMode: 'contain',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 10,
    marginTop: 5,
  },
  senderName: {
    fontSize: 18,
    width: '70%',
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
    paddingHorizontal: 8,
    paddingBottom: 7,
    overflow: 'hidden',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeWrapper: {
    width: '95%',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    marginRight: 4,
    fontFamily: FONTS.Medium,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerIcon: {
    width: 11,
    height: 11,
    marginHorizontal: 4,
  },
  countdownText: {
    width: '80%',
    marginLeft: 4,
    fontSize: 12.5,
    fontFamily: FONTS.Medium,
  },
  separator: {
    height: 13,
    justifyContent: 'center',
    alignSelf: 'center',
    borderRightWidth: 1,
  },
  menu: {
    width: 12.5,
    height: 12.5,
    resizeMode: 'contain',
  },
  dropDownContainer: {
    width: 18,
    height: 20,
    zIndex: 999999,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  menuPressable: {
    width: '5%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuView: {
    right: 2,
    zIndex: 99999999999,
  },
});

export default memo(GridView);
