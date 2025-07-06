import DateTimePicker from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';

import { Notification, Theme } from '../Types/Interface';
import useDatabase, { scheduleNotification } from './useReminder';

interface DateTimePickerState {
  show: boolean;
  mode: 'date' | 'time';
  value: Date;
}

interface UseDuplicateReminderProps {
  notification: Notification;
  theme: Theme;
  onSuccess?: () => void;
}

export const useDuplicateReminder = ({
  notification,
  theme,
  onSuccess,
}: UseDuplicateReminderProps) => {
  const { createNotification } = useDatabase();
  const [dateTimeState, setDateTimeState] = useState<DateTimePickerState>({
    show: false,
    mode: 'date',
    value: new Date(notification.date),
  });

  const showErrorMessage = useCallback((error: any) => {
    showMessage({
      message: error?.message?.toString() || 'An error occurred',
      type: 'danger',
    });
  }, []);

  const resetDateTimePicker = useCallback(() => {
    setDateTimeState((prev) => ({
      ...prev,
      show: false,
      value: new Date(notification.date),
    }));
  }, []);

  const openDuplicateModal = useCallback(() => {
    setDateTimeState({
      show: true,
      mode: 'date',
      value: new Date(notification.date),
    });
  }, []);

  const createDuplicateReminder = useCallback(
    async (scheduledDateTime: Date) => {
      try {
        const newNotification: any = {
          ...notification,
          date: scheduledDateTime,
          id: '',
        };

        const notificationScheduleId = await scheduleNotification(newNotification);

        if (!notificationScheduleId?.trim()) {
          throw new Error('Failed to schedule notification.');
        }

        const data = {
          ...newNotification,
          id: notificationScheduleId,
        };

        const created = await createNotification(data);

        if (!created) {
          throw new Error(String(created));
        }

        showMessage({
          message: 'Reminder duplicated successfully.',
          type: 'success',
        });

        onSuccess?.();
      } catch (error: any) {
        showErrorMessage(error);
      }
    },
    [notification, onSuccess, showErrorMessage],
  );

  const handleDateTimeChange = useCallback(
    async (event: any, selectedDateTime?: Date) => {
      try {
        if (!selectedDateTime) {
          resetDateTimePicker();
          return;
        }

        if (Platform.OS === 'android') {
          resetDateTimePicker();

          if (event.type === 'set') {
            if (dateTimeState.mode === 'date') {
              const newDateTime = new Date(selectedDateTime);
              const now = new Date();
              newDateTime.setHours(now.getHours(), now.getMinutes(), 0, 0);

              setDateTimeState({
                show: true,
                mode: 'time',
                value: newDateTime,
              });
            } else {
              const finalDateTime = new Date(dateTimeState.value);
              finalDateTime.setHours(
                selectedDateTime.getHours(),
                selectedDateTime.getMinutes(),
                0,
                0,
              );
              await createDuplicateReminder(finalDateTime);
            }
          }
        } else {
          setDateTimeState((prev) => ({
            ...prev,
            value: selectedDateTime,
          }));
        }
      } catch (error: any) {
        resetDateTimePicker();
        showErrorMessage(error);
      }
    },
    [dateTimeState, createDuplicateReminder, resetDateTimePicker, showErrorMessage],
  );

  const renderDateTimePicker = useCallback(() => {
    return (
      <DateTimePicker
        mode={dateTimeState.mode}
        display="default"
        value={dateTimeState.value}
        minimumDate={new Date()}
        themeVariant={theme}
        onChange={handleDateTimeChange}
      />
    );
  }, [dateTimeState, theme, handleDateTimeChange]);

  return {
    showDateTimeModal: dateTimeState.show,
    renderDateTimePicker,
    openDuplicateModal,
  };
};
