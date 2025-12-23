import AssetsPath from '@Constants/AssetsPath';
import { FONTS, SIZE } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { useCountdownTimer } from '@Hooks/useCountdownTimer';
import useThemeColors from '@Hooks/useThemeMode';
import { RouteProp, StackActions, useNavigation, useRoute } from '@react-navigation/native';
import { Notification } from '@Types/Interface';
import { getNotificationTitle } from '@Utils/getNotificationTitle';
import LottieView from 'lottie-react-native';
import React, { memo, useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ReminderScheduledProps = {
  params: { themeColor: string; notification: Notification };
};

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const sortDaysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const monthsOfYear = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const formatTime = (date: Date) => {
  try {
    if (!date) {
      return null;
    }

    const formatDate = new Date(date);

    const hours = formatDate?.getHours() % 12 || 12;
    const minutes = formatDate?.getMinutes()?.toString()?.padStart(2, '0');
    const ampm = formatDate?.getHours() >= 12 ? 'PM' : 'AM';
    return `${hours || '00'}:${minutes || '00'} ${ampm || '00'}`;
  } catch (error) {}
};

export const formatDate = (date: Date | string, isSortDayName: boolean = false) => {
  try {
    if (!date) {
      return null;
    }

    const formatDate = new Date(date);

    const dayName = isSortDayName
      ? sortDaysOfWeek?.[formatDate?.getDay()]
      : daysOfWeek?.[formatDate?.getDay()];
    const day = formatDate?.getDate();
    const month = monthsOfYear?.[formatDate.getMonth()];

    return `${dayName || ''}, ${day || ''} ${month || ''}`;
  } catch (error) {
    console.error('[Date] Failed to format date:', error);
    return null;
  }
};

export const formatDateTime = (date: Date | string) => {
  try {
    if (!date) {
      return null;
    }
    const formattedTime = formatTime(new Date(date));
    const formattedDate = formatDate(date);
    return `${formattedTime} on ${formattedDate}`;
  } catch (error) {
    console.error('[Date] Failed to format date time:', error);
    return null;
  }
};

// Format remaining time in short format like "2h 30m" or "45m" or "30s"
export const formatRemainingTimeShort = (date: Date | string | undefined | null): string => {
  if (!date) return '';

  const now = new Date();
  const targetDate = new Date(date);
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) return 'now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `in ${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `in ${minutes}m`;
  } else {
    return `in ${seconds}s`;
  }
};

const ReminderScheduled = () => {
  const style = styles();
  const { theme } = useAppContext();
  const colors = useThemeColors();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const { params } = useRoute<RouteProp<ReminderScheduledProps, 'params'>>();

  const { formattedTimeLeft } = useCountdownTimer(params?.notification?.date);

  const themeColor = useMemo(() => {
    return params?.themeColor;
  }, [params]);

  const notificationData = useMemo(() => {
    return params?.notification;
  }, [params]);

  const title = useMemo(() => getNotificationTitle(notificationData), [notificationData]);

  const remainingTimeShort = useMemo(
    () => formatRemainingTimeShort(notificationData?.date),
    [notificationData?.date],
  );

  const [hours, minutes, seconds] = formattedTimeLeft.split(' : ');

  return (
    <SafeAreaView style={style.container}>
      <View style={style.contentWrapper}>
        <View style={{ height: '60%', width: '100%', justifyContent: 'flex-end' }}>
          <LottieView
            source={AssetsPath.success_animation}
            style={{ width: '100%', height: '80%' }}
            autoPlay
            loop
          />
        </View>

        <View
          style={{
            height: '40%',
            alignItems: 'center',
            width: '100%',
            justifyContent: 'flex-end',
          }}
        >
          <View style={style.timeContainer}>
            <Text style={[style.timeText, { color: themeColor }]}>
              {hours.split('Hrs')[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>Hrs</Text>
            </Text>
            <Text style={[style.timeSeparator, { color: themeColor }]}> : </Text>
            <Text style={[style.timeText, { color: themeColor }]}>
              {minutes.split('Min')[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>Min</Text>
            </Text>
            <Text style={[style.timeSeparator, { color: themeColor }]}> : </Text>
            <Text style={[style.timeText, { color: themeColor }]}>
              {seconds.split('Sec')[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>Sec</Text>
            </Text>
          </View>

          <View style={style.notificationWrapper}>
            <View style={style.card}>
              <View style={style.cardHeader}>
                <Image
                  resizeMode="contain"
                  source={AssetsPath.appLogoAndroid}
                  style={style.userImage}
                />
                <View style={style.titleContainer}>
                  <Text numberOfLines={1} style={[style.userName, { color: colors.text }]}>
                    {title?.toString()?.trim()}
                  </Text>
                  <Text
                    style={[style.notificationText, { color: colors.placeholderText }]}
                    numberOfLines={2}
                  >
                    {notificationData.message?.trim() ||
                      notificationData.subject?.trim() ||
                      'No Message Available'}
                  </Text>
                </View>
                <Text style={[style.timeAgo, { color: colors.placeholderText }]}>
                  {remainingTimeShort}
                </Text>
              </View>

              <Image
                resizeMode="contain"
                source={AssetsPath.ic_hand}
                style={[style.handImage, { left: width / 2.2 }]}
              />
            </View>

            <Text
              style={[
                style.receivedNotificationText,
                { color: theme === 'dark' ? colors.text : 'rgba(139, 142, 142, 1)' },
              ]}
            >
              {`You have received a notification at ${formatDateTime(
                notificationData.date,
              )}, tap on it.`}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => {
          navigation.dispatch(StackActions.popTo('BottomTab', { screen: 'Home' }));
        }}
        style={style.contactDoneButtonView}
      >
        <Image
          resizeMode="contain"
          source={AssetsPath.ic_leftPointyArrow}
          style={style.pointyRightArrow}
        />
        <Text style={style.contactDoneButtonText}>Home</Text>
      </Pressable>
    </SafeAreaView>
  );
};

export default memo(ReminderScheduled);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-end',
      backgroundColor: colors.background,
    },
    contentWrapper: {
      width: SIZE.appContainWidth,
      alignItems: 'center',
    },
    notificationWrapper: {
      width: '100%',
      marginVertical: 30,
    },
    card: {
      padding: 15,
      width: '100%',
      borderRadius: 10,
      marginBottom: 50,
      backgroundColor: colors.previewBackground,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    userImage: {
      width: 38,
      height: 38,
      borderRadius: 5,
    },
    titleContainer: {
      flex: 1,
      marginHorizontal: 10,
    },
    userName: {
      fontSize: 18,
      fontFamily: FONTS.Medium,
      marginBottom: 4,
    },
    timeAgo: {
      fontFamily: FONTS.Medium,
      fontSize: 16,
      color: colors.placeholderText,
    },
    notificationText: {
      fontSize: 16,
      fontFamily: FONTS.Regular,
      lineHeight: 20,
    },
    handImage: {
      width: 33,
      height: 33,
      alignSelf: 'center',
      position: 'absolute',
      bottom: -25,
    },
    receivedNotificationText: {
      fontSize: 18,
      marginVertical: 15,
      textAlign: 'center',
      fontFamily: FONTS.Medium,
    },
    contactDoneButtonText: {
      color: colors.white,
      fontFamily: FONTS.Bold,
      fontSize: 18,
    },
    contactDoneButtonView: {
      width: 150,
      height: 43,
      borderRadius: 25,
      marginVertical: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(64, 93, 240, 1)',
    },
    pointyRightArrow: {
      width: 18,
      height: 18,
      marginRight: 10,
      alignItems: 'center',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
    },
    timeText: {
      fontSize: 32,
      fontFamily: FONTS.Medium,
    },
    timeLabelText: {
      fontSize: 14,
      fontFamily: FONTS.Medium,
    },
    timeSeparator: {
      fontSize: 32,
      fontFamily: FONTS.Medium,
    },
  });
};
