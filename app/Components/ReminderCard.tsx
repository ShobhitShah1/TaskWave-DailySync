import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { useAppContext } from '@Contexts/ThemeProvider';
import isGridView from '@Hooks/isGridView';
import { useAddressFromCoords } from '@Hooks/useAddressFromCoords';
import { useCountdownTimer } from '@Hooks/useCountdownTimer';
import useNotificationIconColors from '@Hooks/useNotificationIconColors';
import useDatabase, { scheduleNotification } from '@Hooks/useReminder';
import useThemeColors from '@Hooks/useThemeMode';
import { ReminderCardProps } from '@Types/Interface';
import { getNotificationIcon } from '@Utils/getNotificationIcon';
import { getNotificationTitle } from '@Utils/getNotificationTitle';
import GridView from './ReminderCards/GridList';
import ListView from './ReminderCards/ListView';

const ReminderCard: React.FC<ReminderCardProps> = ({
  notification,
  deleteReminder,
  onRefreshData,
  setFullScreenPreview,
}) => {
  const isGrid = isGridView();
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const navigation = useNavigation();
  const { createNotification } = useDatabase();

  const [dateTimePickerState, setDateTimePickerState] = useState({
    show: false,
    mode: 'date' as any,
    value: notification.date,
  });

  const { timeLeft, timeIsOver } = useCountdownTimer(notification?.date);
  const notificationColors = useNotificationIconColors(notification?.type);

  useEffect(() => {
    if (timeIsOver && onRefreshData) {
      onRefreshData();
    }
  }, [timeIsOver, timeLeft]);

  const title = useMemo(() => getNotificationTitle(notification), [notification]);

  const coords = useMemo(
    () => ({
      latitude: notification.latitude as number,
      longitude: notification.longitude as number,
    }),
    [notification.latitude, notification.longitude],
  );

  const { shortLocationLabel } = useAddressFromCoords(coords);

  const cardBackgroundColor = useMemo(() => {
    return theme === 'dark' ? colors.reminderCardBackground : notificationColors.backgroundColor;
  }, [theme, colors.reminderCardBackground, notificationColors.backgroundColor]);

  const typeColor = useMemo(() => {
    return notification.type === 'gmail' && theme === 'light'
      ? colors.gmailText
      : notification.type === 'whatsappBusiness'
        ? notificationColors.createViewColor
        : notificationColors.typeColor;
  }, [notification.type, theme, colors.gmailText, notificationColors]);

  const icon = useMemo(() => getNotificationIcon(notification.type), [notification.type]);

  const onCardPress = useCallback(() => {
    const notificationData = {
      ...notification,
      date: notification.date instanceof Date ? notification.date.toISOString() : notification.date,
    };

    if (notification.type === 'location') {
      navigation.navigate('LocationPreview', {
        notificationData,
      });
    } else {
      navigation.navigate('ReminderPreview', {
        notificationData,
      });
    }

    setFullScreenPreview && setFullScreenPreview(false);
  }, [notification]);

  const onEditPress = useCallback(() => {
    if (notification.type === 'location') {
      navigation.navigate('LocationDetails', {
        notificationType: notification.type,
        id: notification?.id,
      });
    } else {
      navigation.navigate('CreateReminder', {
        notificationType: notification.type,
        id: notification?.id,
      });
    }
  }, [notification]);

  const onDuplicatePress = useCallback(() => {
    setDateTimePickerState({
      show: true,
      mode: 'date',
      value: new Date(notification.date),
    });
  }, []);

  const handleDateTimeChange = useCallback(
    (event: any, selectedDateTime?: Date) => {
      const currentState = dateTimePickerState;

      if (Platform.OS === 'android') {
        setDateTimePickerState((prev) => ({ ...prev, show: false }));

        if (event.type === 'set' && selectedDateTime) {
          if (currentState.mode === 'date') {
            const newDateTime = new Date(selectedDateTime);
            const now = new Date();
            newDateTime.setHours(now.getHours(), now.getMinutes(), 0, 0);

            setDateTimePickerState({
              show: true,
              mode: 'time',
              value: newDateTime,
            });
          } else {
            const finalDateTime = new Date(currentState.value);
            finalDateTime.setHours(
              selectedDateTime.getHours(),
              selectedDateTime.getMinutes(),
              0,
              0,
            );
            createDuplicateReminder(finalDateTime);
          }
        }
      } else {
        if (selectedDateTime) {
          setDateTimePickerState((prev) => ({
            ...prev,
            value: selectedDateTime,
          }));
        }
      }
    },
    [dateTimePickerState],
  );

  const createDuplicateReminder = async (scheduledDateTime: Date) => {
    try {
      const newNotification = {
        ...notification,
        date: scheduledDateTime,
        id: '',
      };

      const notificationScheduleId = await scheduleNotification(newNotification);

      if (notificationScheduleId?.trim()) {
        const data = {
          ...newNotification,
          id: notificationScheduleId,
        };

        const created = await createNotification(data);

        if (!created) {
          showMessage({ message: String(created), type: 'danger' });
        } else {
          showMessage({ message: 'Reminder duplicated successfully.', type: 'success' });
          onRefreshData?.();
        }
      } else {
        showMessage({ message: 'Failed to schedule notification.', type: 'danger' });
      }
    } catch (error: any) {
      showMessage({
        message: error?.message?.toString() || 'Failed to create reminder',
        type: 'danger',
      });
    }
  };

  const renderDateTimePicker = useCallback(
    () => (
      <DateTimePicker
        mode={dateTimePickerState.mode}
        display="default"
        value={new Date(dateTimePickerState.value)}
        minimumDate={new Date()}
        themeVariant={theme === 'dark' ? 'dark' : 'light'}
        onChange={handleDateTimeChange}
      />
    ),
    [dateTimePickerState, theme],
  );

  return (
    <>
      {isGrid ? (
        <GridView
          notification={notification}
          onCardPress={onCardPress}
          onEditPress={onEditPress}
          onDuplicatePress={onDuplicatePress}
          cardBackgroundColor={cardBackgroundColor}
          icon={icon}
          title={title}
          typeColor={typeColor}
          deleteReminder={deleteReminder}
          address={shortLocationLabel}
        />
      ) : (
        <ListView
          notification={notification}
          onCardPress={onCardPress}
          onEditPress={onEditPress}
          onDuplicatePress={onDuplicatePress}
          cardBackgroundColor={cardBackgroundColor}
          icon={icon}
          title={title}
          typeColor={typeColor}
          deleteReminder={deleteReminder}
          address={shortLocationLabel}
        />
      )}

      {dateTimePickerState.show && renderDateTimePicker()}
    </>
  );
};

export default memo(ReminderCard);
