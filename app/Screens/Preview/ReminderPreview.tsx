import { DocumentPickerResponse } from '@react-native-documents/picker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import ImagePreviewModal from '@Components/ImagePreviewModal';
import AudioMemoItem from '@Components/MemoListItem';
import AssetsPath from '@Constants/AssetsPath';
import { FONTS, SIZE } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { handleNotificationPress } from '@Hooks/handleNotificationPress';
import { useCountdownTimer } from '@Hooks/useCountdownTimer';
import useNotificationIconColors from '@Hooks/useNotificationIconColors';
import useReminder from '@Hooks/useReminder';
import useThemeColors from '@Hooks/useThemeMode';
import { Notification } from '@Types/Interface';
import { formatNotificationType } from '@Utils/formatNotificationType';
import { getNotificationIcon } from '@Utils/getNotificationIcon';
import { linkifyText } from '@Utils/linkify';
import { formatDate, formatTime } from '../AddReminder/ReminderScheduled';

type NotificationProps = {
  params: { notificationData: Notification };
};

const LIGHT_COLORS = 'rgba(255, 255, 255, 0.8)';
const DARK_COLORS = 'rgba(48, 51, 52, 1)';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const ReminderPreview = () => {
  let imageIndexCounter = 0;
  const style = styles();
  const navigation = useNavigation();
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const { params } = useRoute<RouteProp<NotificationProps, 'params'>>();

  const [showFilePreview, setShowFilePreview] = useState({
    isVisible: false,
    index: -1,
  });

  const notificationData = useMemo(() => {
    return params.notificationData;
  }, [params]);

  const notificationType = useMemo(() => {
    return notificationData?.type;
  }, [params, notificationData]);

  const { createViewColor, history_icon } = useNotificationIconColors(notificationType);
  const { formattedTimeLeft, timeIsOver } = useCountdownTimer(notificationData?.date || '');
  const { deleteNotification } = useReminder();

  const [hours, minutes, seconds] = formattedTimeLeft.split(' : ');

  const documentPreviews = useMemo(
    () =>
      notificationData?.attachments &&
      notificationData?.attachments?.map((document: DocumentPickerResponse) => {
        const isImage = document.type?.startsWith('image');
        const imageIndex: number | null = isImage ? imageIndexCounter++ : null;

        const documentStyle = isImage ? style.fullImage : style.attachmentIconSmall;

        const onPressDoc = () => {
          if (document.type?.startsWith('image') && imageIndex != null) {
            setShowFilePreview({ isVisible: true, index: imageIndex });
          }
        };

        return (
          <React.Fragment key={document.uri}>
            <Animated.View
              style={style.documentPreview}
              exiting={FadeOut}
              entering={FadeIn}
              layout={LinearTransition.springify(300)}
            >
              <Pressable onPress={onPressDoc} style={style.imageButton}>
                <Image
                  resizeMode={isImage ? 'cover' : 'contain'}
                  source={isImage ? { uri: `file://${document.uri}` } : AssetsPath.ic_attachment}
                  tintColor={isImage ? undefined : createViewColor}
                  style={documentStyle}
                />
              </Pressable>
            </Animated.View>
          </React.Fragment>
        );
      }),
    [notificationData],
  );

  const onDeleteClick = useCallback(async () => {
    if (!notificationData?.id) {
      showMessage({
        message: 'Invalid reminder ID',
        type: 'danger',
      });
      return;
    }

    Alert.alert(
      'Confirmation',
      `Are you sure you want to delete this event? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            try {
              if (!notificationData?.id) {
                showMessage({
                  message: 'Invalid reminder ID',
                  type: 'danger',
                });
                return;
              }

              await deleteNotification(notificationData?.id);
              navigation.goBack();
            } catch (error: any) {
              showMessage({
                message: String(error?.message || error),
                type: 'danger',
              });
            }
          },
          style: 'destructive',
        },
      ],
    );
  }, [notificationData]);

  const imageUrls = useMemo(() => {
    return (
      notificationData.attachments &&
      notificationData.attachments
        .filter((doc) => doc.type?.startsWith('image') && doc.uri)
        .map((doc) => doc.uri)
    );
  }, [notificationData]);

  const scrollY = useSharedValue(0);

  const shouldHide = useDerivedValue(() => scrollY.value > 175);

  const timerStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(shouldHide.value ? 1 : 0, {
        duration: 300,
        easing: Easing.linear,
      }),
    };
  });

  return (
    <SafeAreaView style={style.container}>
      <View style={style.innerContainer}>
        <View style={style.backView}>
          <Pressable hitSlop={10} onPress={() => navigation.goBack()} style={style.menuIconView}>
            <Image
              source={AssetsPath.ic_leftArrow}
              tintColor={colors.text}
              style={style.menuIcon}
            />
          </Pressable>

          <View>
            <Animated.View style={[style.timeContainer, timerStyle]}>
              <Text style={[style.timeText, { color: createViewColor, fontSize: 25 }]}>
                {hours.split('Hrs')[0]}
                <Text style={[style.timeLabelText, { color: colors.text }]}>Hrs</Text>
              </Text>
              <Text style={[style.timeSeparator, { color: createViewColor, fontSize: 25 }]}>
                {' '}
                :{' '}
              </Text>
              <Text style={[style.timeText, { color: createViewColor, fontSize: 25 }]}>
                {minutes.split('Min')[0]}
                <Text style={[style.timeLabelText, { color: colors.text }]}>Min</Text>
              </Text>
              <Text style={[style.timeSeparator, { color: createViewColor, fontSize: 25 }]}>
                {' '}
                :{' '}
              </Text>
              <Text style={[style.timeText, { color: createViewColor, fontSize: 25 }]}>
                {seconds.split('Sec')[0]}
                <Text style={[style.timeLabelText, { color: colors.text }]}>Sec</Text>
              </Text>
            </Animated.View>
          </View>

          <View />
        </View>

        <ScrollView
          bounces={false}
          style={style.centeredContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={style.containContainer}
          onScroll={(event) => {
            scrollY.value = event.nativeEvent.contentOffset.y;
          }}
        >
          <View
            style={[
              style.notificationIconContainer,
              {
                backgroundColor: notificationType === 'gmail' ? colors.white : createViewColor,
              },
            ]}
          >
            <Image source={history_icon} style={style.notificationIcon} />
          </View>

          <Text style={[style.notificationText, { color: colors.text }]}>
            {formatNotificationType(notificationType)}
          </Text>

          <View style={style.timeContainer}>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {hours.split('Hrs')[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>Hrs</Text>
            </Text>
            <Text style={[style.timeSeparator, { color: createViewColor }]}> : </Text>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {minutes.split('Min')[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>Min</Text>
            </Text>
            <Text style={[style.timeSeparator, { color: createViewColor }]}> : </Text>
            <Text style={[style.timeText, { color: createViewColor }]}>
              {seconds.split('Sec')[0]}
              <Text style={[style.timeLabelText, { color: colors.text }]}>Sec</Text>
            </Text>
          </View>

          <View style={style.reminderDetails}>
            <View style={style.reminderDateTime}>
              <Text
                style={[
                  style.dateTimeText,
                  { color: theme === 'dark' ? LIGHT_COLORS : DARK_COLORS },
                ]}
              >
                {formatDate(notificationData.date)}
              </Text>
              <Text
                style={[
                  style.dateTimeText,
                  { color: theme === 'dark' ? LIGHT_COLORS : DARK_COLORS },
                ]}
              >
                {formatTime(new Date(notificationData.date))}
              </Text>
            </View>

            {(notificationData.message || notificationData.subject) && (
              <View style={[style.reminderCard, { backgroundColor: colors.previewBackground }]}>
                <Text style={[style.reminderCardText, { color: colors.text }]}>
                  {linkifyText(String(notificationData.message || notificationData.subject)).map(
                    (part, idx) => {
                      if (part.type === 'url') {
                        return (
                          <Text
                            key={idx}
                            style={{ color: createViewColor, textDecorationLine: 'underline' }}
                            onPress={() => Linking.openURL(part.value)}
                          >
                            {part.value}
                          </Text>
                        );
                      }
                      return <Text key={idx}>{part.value}</Text>;
                    },
                  )}
                </Text>
              </View>
            )}
          </View>

          {notificationData?.memo && notificationData?.memo?.length !== 0 && (
            <View style={style.recorderContainer}>
              <AudioMemoItem
                memo={notificationData?.memo?.[0]}
                themeColor={createViewColor}
                renderRightIcon={<></>}
              />
            </View>
          )}

          <View style={style.attachmentContainer}>
            {notificationData?.attachments?.length !== 0 && (
              <ScrollView
                horizontal
                style={style.previewContainer}
                contentContainerStyle={style.scrollContent}
                showsHorizontalScrollIndicator={false}
              >
                {documentPreviews}
              </ScrollView>
            )}
          </View>

          <View style={style.contactOrMailContainer}>
            {notificationData?.type === 'gmail'
              ? notificationData?.toMail?.map((item, index) =>
                  item.split(',').map((email, emailIndex) => (
                    <View key={`${index}-${emailIndex}`} style={style.toContainer}>
                      <Text key={`${index}-${emailIndex}`} style={style.toText}>
                        {email?.trim()}
                      </Text>
                    </View>
                  )),
                )
              : notificationData?.toContact?.map((item, index) => (
                  <View key={index} style={style.toContainer}>
                    <Text style={[style.toText, { color: createViewColor }]}>{item?.name}</Text>
                    <Text style={[style.toText, { fontSize: 14, marginTop: 3 }]}>
                      {item?.number}
                    </Text>
                  </View>
                ))}
          </View>
        </ScrollView>
      </View>

      <View style={style.bottomButtons}>
        <AnimatedPressable
          layout={LinearTransition}
          style={[style.baseButton, style.deleteButton]}
          onPress={onDeleteClick}
        >
          <Image source={AssetsPath.ic_delete} style={style.buttonIcon} />
          <Text style={style.buttonText}>Delete</Text>
        </AnimatedPressable>

        <AnimatedPressable
          layout={LinearTransition}
          style={[style.baseButton, style.editButton]}
          onPress={() => {
            navigation.navigate('CreateReminder', {
              notificationType: notificationData.type,
              id: notificationData.id,
            });
          }}
        >
          <Image source={AssetsPath.ic_edit} style={style.buttonIcon} />
          <Text style={style.buttonText}>Edit</Text>
        </AnimatedPressable>

        {timeIsOver && notificationType !== 'note' && (
          <AnimatedPressable
            layout={LinearTransition}
            style={[style.baseButton, { backgroundColor: createViewColor }]}
            onPress={() => {
              handleNotificationPress(notificationData);
            }}
          >
            <Image
              source={getNotificationIcon(notificationData.type)}
              style={style.buttonIcon}
              tintColor={colors.white}
            />
            <Text style={style.buttonText}>Open</Text>
          </AnimatedPressable>
        )}
      </View>

      <ImagePreviewModal
        isVisible={showFilePreview.isVisible}
        onClose={() => setShowFilePreview({ isVisible: false, index: -1 })}
        images={imageUrls}
        initialIndex={showFilePreview.index}
      />
    </SafeAreaView>
  );
};

export default memo(ReminderPreview);

const styles = () => {
  const colors = useThemeColors();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    containContainer: {
      paddingBottom: 135,
    },
    innerContainer: {
      width: SIZE.appContainWidth,
      alignSelf: 'center',
    },
    backView: {
      width: '100%',
      paddingTop: 10,
      paddingBottom: 5,
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    menuIconView: {
      width: 28,
      height: 28,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuIcon: {
      width: 18,
      height: 18,
      resizeMode: 'contain',
    },
    centeredContainer: {
      width: '100%',
      alignContent: 'center',
      alignSelf: 'center',
    },
    notificationIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 10,
      alignSelf: 'center',
      justifyContent: 'center',
    },
    notificationIcon: {
      width: 55,
      height: 55,
      resizeMode: 'contain',
      alignSelf: 'center',
    },
    notificationText: {
      fontSize: 20,
      marginVertical: 10,
      fontFamily: FONTS.Medium,
      textAlign: 'center',
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 10,
      alignSelf: 'center',
    },
    timeText: {
      fontSize: 34,
      fontFamily: FONTS.Medium,
    },
    timeLabelText: {
      fontSize: 16,
      fontFamily: FONTS.Medium,
    },
    timeSeparator: {
      fontSize: 34,
      fontFamily: FONTS.Medium,
    },
    reminderDetails: {
      marginTop: 20,
    },
    reminderDateTime: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateTimeText: {
      fontSize: 19,
      fontFamily: FONTS.SemiBold,
    },
    reminderCard: {
      width: '100%',
      marginTop: 15,
      borderRadius: 10,
      padding: 10,
    },
    reminderCardText: {
      fontSize: 17.5,
      lineHeight: 28,
      fontFamily: FONTS.Medium,
    },
    contactOrMailContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    toContainer: {
      padding: 10,
      backgroundColor: colors.previewBackground,
      borderRadius: 15,
    },
    toText: {
      color: colors.text,
      fontFamily: FONTS.Medium,
      fontSize: 16,
    },
    attachmentContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 15,
      gap: 10,
    },
    previewContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 15,
      marginTop: 5,
    },
    scrollContent: {
      gap: 10,
    },
    documentPreview: {
      width: 65,
      height: 65,
      backgroundColor: '#f8d7da',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 8,
    },
    fullImage: {
      width: '100%',
      height: '100%',
    },
    attachmentIconSmall: {
      width: 40,
      height: 40,
    },
    imageButton: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
      borderRadius: 8,
    },
    recorderContainer: {
      marginTop: 15,
      justifyContent: 'center',
      overflow: 'visible',
    },

    bottomButtons: {
      bottom: 0,
      position: 'absolute',
      flexDirection: 'row',
      alignSelf: 'center',
      justifyContent: 'space-between',
      paddingVertical: 15,
      gap: 8,
      width: '100%',
      paddingHorizontal: 16,
    },
    baseButton: {
      flex: 1,
      paddingVertical: 13,
      borderRadius: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 100,
    },
    deleteButton: {
      backgroundColor: '#ff4c4c',
    },
    editButton: {
      backgroundColor: '#4c8dff',
    },
    buttonIcon: {
      width: 18,
      height: 18,
      alignItems: 'center',
      resizeMode: 'contain',
      marginRight: 5,
    },
    buttonText: {
      color: 'white',
      fontSize: 19,
      fontFamily: FONTS.Medium,
    },
  });
};
