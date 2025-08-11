import { useNavigation } from '@react-navigation/native';
import { memo, useCallback, useMemo } from 'react';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { useDuplicateReminder } from '@Hooks/useDuplicateReminder';
import useNotificationIconColors from '@Hooks/useNotificationIconColors';
import useThemeColors from '@Hooks/useThemeMode';
import { ReminderCardProps } from '@Types/Interface';
import { getNotificationIcon } from '@Utils/getNotificationIcon';
import { getNotificationTitle } from '@Utils/getNotificationTitle';
import { formatDate, formatTime } from '../../AddReminder/ReminderScheduled';
import { useAddressFromCoords } from '@Hooks/useAddressFromCoords';

const RenderHistoryList: React.FC<ReminderCardProps> = ({
  notification,
  deleteReminder,
  loadNotifications,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const navigation = useNavigation();
  const notificationColors = useNotificationIconColors(notification.type);
  const isLocation = notification.type === 'location';

  const typeColor = useMemo(() => {
    return notification.type === 'gmail' && theme === 'light'
      ? colors.gmailText
      : notification.type === 'whatsappBusiness'
        ? notificationColors.createViewColor
        : notificationColors.typeColor;
  }, [notification.type, theme, colors.gmailText, notificationColors]);

  const gmailBorder = useMemo(
    () => (notification.type === 'gmail' ? notificationColors.iconColor : typeColor),
    [notificationColors],
  );

  const title = useMemo(() => getNotificationTitle(notification), [notification]);

  const icon = useMemo(() => getNotificationIcon(notification.type), [notification.type]);

  const coords = useMemo(
    () => ({
      latitude: notification.latitude as number,
      longitude: notification.longitude as number,
    }),
    [notification.latitude, notification.longitude],
  );

  const { locationLabel } = useAddressFromCoords(coords);

  const onCardPress = useCallback(() => {
    if (notification.type === 'location') {
      navigation.navigate('LocationPreview', {
        notificationData: notification,
      });
    } else {
      navigation.navigate('ReminderPreview', {
        notificationData: notification,
      });
    }
  }, [notification]);

  const { showDateTimeModal, renderDateTimePicker, openDuplicateModal } = useDuplicateReminder({
    notification: notification,
    theme: theme,
    onSuccess() {
      loadNotifications && loadNotifications();
    },
  });

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(1 * Number(notification.id))}
        style={[
          styles.cardContainer,
          {
            borderColor: notification.type === 'gmail' ? gmailBorder : typeColor,
          },
        ]}
      >
        <Pressable
          style={styles.pressableContainer}
          onPress={onCardPress}
          onLongPress={() => notification.id && deleteReminder(notification.id)}
        >
          <View style={styles.rowContainer}>
            <View style={styles.textContainer}>
              <Text numberOfLines={1} style={[styles.titleText, { color: colors.text }]}>
                To: {title?.toString()}
              </Text>
              <Text style={[styles.descriptionText, { color: colors.grayTitle }]} numberOfLines={2}>
                {notification?.message || notification.subject}
              </Text>
            </View>
            <View style={styles.iconContainer}>
              <Image
                source={isLocation ? AssetsPath.ic_history_location_icon : icon}
                tintColor={
                  notification.type === 'gmail' || notification.type === 'location'
                    ? undefined
                    : typeColor
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
                    backgroundColor: theme === 'dark' ? colors.darkPrimaryBackground : typeColor,
                  },
                ]}
              >
                {isLocation ? (
                  <View style={styles.dateContainer}>
                    <Image
                      tintColor={colors.white}
                      source={AssetsPath.ic_history_location_icon}
                      style={styles.timeIcon}
                    />
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.timeText,
                        {
                          maxWidth: '95%',
                          color: theme === 'dark' ? colors.grayTitle : colors.white,
                        },
                      ]}
                    >
                      {notification?.locationName?.trim() || locationLabel?.trim() || ''}
                    </Text>
                  </View>
                ) : (
                  <>
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
                            color: theme === 'dark' ? colors.grayTitle : colors.white,
                          },
                        ]}
                      >
                        {formatDate(notification.date, true)}
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
                            color: theme === 'dark' ? colors.grayTitle : colors.white,
                          },
                        ]}
                      >
                        {formatTime(new Date(notification.date))}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={styles.actionsContainer}>
              <Pressable
                style={{ justifyContent: 'center', alignItems: 'center' }}
                hitSlop={{ top: 10, bottom: 10 }}
                onPress={onCardPress}
              >
                <Image
                  tintColor={theme === 'dark' ? colors.white : typeColor}
                  source={AssetsPath.ic_view}
                  style={styles.actionIcon}
                />
              </Pressable>
              {notification.type !== 'location' && (
                <Pressable
                  style={{ justifyContent: 'center', alignItems: 'center' }}
                  hitSlop={{ top: 10, bottom: 10 }}
                  onPress={openDuplicateModal}
                >
                  <Image
                    tintColor={theme === 'dark' ? colors.white : typeColor}
                    source={AssetsPath.ic_duplicate}
                    style={styles.actionIcon}
                  />
                </Pressable>
              )}
              <Pressable
                style={{ justifyContent: 'center', alignItems: 'center' }}
                hitSlop={{ top: 10, bottom: 10 }}
                onPress={() => notification?.id && deleteReminder(notification?.id)}
              >
                <Image
                  tintColor={theme === 'dark' ? colors.white : typeColor}
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
};

export default memo(RenderHistoryList);

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    width: '85%',
  },
  titleText: {
    fontSize: 20,
    marginBottom: 5,
    fontFamily: FONTS.SemiBold,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  iconContainer: {
    width: '10%',
    marginVertical: 5,
    alignItems: 'center',
  },
  notificationIcon: {
    width: 28,
    height: 28,
  },
  footerContainer: {
    flex: 0.25,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeContainer: {
    maxWidth: '74%',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 25,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 13,
    right: 2,
    width: '25%',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    // marginLeft: 13,
  },
});
