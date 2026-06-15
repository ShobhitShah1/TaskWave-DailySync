import RNDateTimePicker from '@react-native-community/datetimepicker';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FONTS } from '@Constants/Theme';
import {
  getLocalAlarmDetails,
  useAlarmFeed,
  useCreateGroupAlarm,
  useCreateSoloAlarm,
  useUpdateGroupAlarm,
  useUpdateSoloAlarm,
} from '@Hooks/useAlarm';
import { useAuth } from '@Hooks/useAuth';
import useThemeColors from '@Hooks/useThemeMode';
import AddMessage from '@Screens/AddReminder/Components/AddMessage';
import AddScheduleFrequency, {
  FrequencyType,
} from '@Screens/AddReminder/Components/AddScheduleFrequency';
import AudioRecorder from '@Screens/AddReminder/Components/AudioRecorder';
import useAudioRecorder from '@Screens/AddReminder/hooks/useAudioRecorder';
import useDateTimePicker from '@Screens/AddReminder/hooks/useDateTimePicker';
import useScheduleFrequency from '@Screens/AddReminder/hooks/useScheduleFrequency';
import reminderStyles from '@Screens/AddReminder/styles';
import {
  AlarmMeridiem,
  AlarmMode,
  AlarmRecord,
  AlarmRegisteredUser,
  AlarmRepeat,
} from '@Types/Alarm';
import { RootStackParamList } from '@Types/Interface';

import { sounds } from '@Constants/Data';
import AlarmHeader from './Components/AlarmHeader';
import AlarmInviteField from './Components/AlarmInviteField';
import AlarmModeToggle from './Components/AlarmModeToggle';
import AlarmScheduleRow from './Components/AlarmScheduleRow';
import AlarmNoteSelector from './Components/AlarmNoteSelector';
import RegisteredUserPicker from './Components/RegisteredUserPicker';
import SoloAlarmEditor from './Components/SoloAlarmEditor';
import TonePickerModal from './Components/TonePickerModal';
import useOverlayPermission from '@Hooks/useOverlayPermission';
import OverlayPermissionModal from '@Components/OverlayPermissionModal';

type CreateAlarmRoute = RouteProp<RootStackParamList, 'CreateAlarm'>;

const toDateTimeState = (alarm: AlarmRecord) => {
  const sourceDate = new Date(alarm.startAt || alarm.nextOccurrenceAt || alarm.nextTriggerAt);
  const time = new Date(sourceDate);
  const hour24 =
    alarm.meridiem === 'AM'
      ? alarm.hour === 12
        ? 0
        : alarm.hour
      : alarm.hour === 12
        ? 12
        : alarm.hour + 12;

  time.setHours(hour24, alarm.minute, 0, 0);

  return {
    date: sourceDate,
    time,
  };
};

const toFrequencyType = (repeat: AlarmRepeat): FrequencyType | null => {
  if (repeat === 'none') {
    return null;
  }

  return `${repeat.charAt(0).toUpperCase()}${repeat.slice(1)}` as FrequencyType;
};

const toRegisteredUser = (member: {
  userId: string;
  fullName: string;
  displayName?: string;
  avatar: string | null;
  phoneCountryCode: string;
  phoneNumber: string;
  phoneE164: string;
}): AlarmRegisteredUser => ({
  userId: member.userId,
  fullName: member.fullName,
  displayName: member.displayName || member.fullName,
  avatar: member.avatar,
  phoneCountryCode: member.phoneCountryCode,
  phoneNumber: member.phoneNumber,
  phoneE164: member.phoneE164,
  timezone: 'UTC',
  isRegistered: true,
});

const CreateAlarmScreen = () => {
  const style = reminderStyles();
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<CreateAlarmRoute>();
  const scrollViewRef = useRef<ScrollView>(null);
  const { auth } = useAuth();

  const [mode, setMode] = useState<AlarmMode>(route.params?.mode || 'solo');
  const [tone, setTone] = useState('default');
  const [alarmNotes, setAlarmNotes] = useState<string[]>([]);
  const [vibrate, setVibrate] = useState(true);
  const [bufferMinutes, setBufferMinutes] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<AlarmRegisteredUser[]>([]);
  const [showUserPicker, setShowUserPicker] = useState(false);
  const [activeTimeUnit, setActiveTimeUnit] = useState<'hour' | 'minute'>('hour');
  const [didHydrateExistingAlarm, setDidHydrateExistingAlarm] = useState(false);
  const [showTonePicker, setShowTonePicker] = useState(false);
  const { checkPermission } = useOverlayPermission();
  const [showOverlayModal, setShowOverlayModal] = useState(false);

  const createSoloAlarmMutation = useCreateSoloAlarm();
  const createGroupAlarmMutation = useCreateGroupAlarm();
  const updateSoloAlarmMutation = useUpdateSoloAlarm();
  const updateGroupAlarmMutation = useUpdateGroupAlarm();
  const { groupQuery } = useAlarmFeed();
  const editingAlarmId = route.params?.id;
  const isEditing = Boolean(editingAlarmId);

  const {
    selectedDateAndTime,
    setSelectedDateAndTime,
    pickerVisibleType,
    handleDatePress,
    handleTimePress,
    handlePickerChange,
  } = useDateTimePicker();

  const { scheduleFrequency, setScheduleFrequency, selectedDays, setSelectedDays } =
    useScheduleFrequency();

  const { recording, memos, setMemos, onRecordingPress, stopRecording, animatedRecordWave } =
    useAudioRecorder(colors.alarmFocus);

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => {
      stopRecording();
    });

    return unsubscribe;
  }, [navigation, stopRecording]);

  useEffect(() => {
    if (isEditing || didHydrateExistingAlarm) {
      return;
    }

    setSelectedDateAndTime((current) => {
      const nextMin = new Date();
      nextMin.setMinutes(nextMin.getMinutes() + 1, 0, 0);

      return {
        ...current,
        time: nextMin,
      };
    });
  }, [didHydrateExistingAlarm, isEditing, setSelectedDateAndTime]);

  useEffect(() => {
    if (!editingAlarmId || didHydrateExistingAlarm) {
      return;
    }

    const hydrate = async () => {
      if (mode === 'solo') {
        const alarm = await getLocalAlarmDetails(editingAlarmId);
        if (!alarm) {
          return;
        }

        setMessage(alarm.note);
        setTone(alarm.tone);
        setAlarmNotes(alarm.alarmNotes || []);
        setVibrate(alarm.vibrate);
        setBufferMinutes(alarm.bufferMinutes);
        setSelectedDays(alarm.repeatDays || []);
        setScheduleFrequency(toFrequencyType(alarm.repeat));
        // setMemos(alarm.memoUri ? [{ uri: alarm.memoUri, metering: [] }] : []);
        setSelectedDateAndTime(toDateTimeState(alarm));
        setDidHydrateExistingAlarm(true);
        return;
      }

      const alarm = groupQuery.data?.alarms.find((item) => item.id === editingAlarmId);
      if (!alarm) {
        return;
      }

      setMessage(alarm.note);
      setTone(alarm.tone);
      setAlarmNotes(alarm.alarmNotes || []);
      setVibrate(Boolean(alarm.vibrate));
      setBufferMinutes(alarm.bufferMinutes);
      setSelectedDays(alarm.repeatDays || []);
      setScheduleFrequency(toFrequencyType(alarm.repeat));
      setMemos(alarm.memoUri ? [{ uri: alarm.memoUri, metering: [] }] : []);
      setSelectedUsers(
        (alarm.invitees || alarm.members)
          .filter(
            (member) => member.userId !== alarm.ownerUserId && member.userId !== auth?.user?.id,
          )
          .map(toRegisteredUser),
      );
      setSelectedDateAndTime(toDateTimeState(alarm));
      setDidHydrateExistingAlarm(true);
    };

    hydrate().catch(() => undefined);
  }, [
    auth?.user?.id,
    didHydrateExistingAlarm,
    editingAlarmId,
    groupQuery.data?.alarms,
    mode,
    setMemos,
    setScheduleFrequency,
    setSelectedDateAndTime,
    setSelectedDays,
  ]);

  const mergedTime = useMemo(
    () => selectedDateAndTime.time || new Date(),
    [selectedDateAndTime.time],
  );

  const updateSoloTime = (updater: (current: Date) => Date) => {
    const nextTime = updater(new Date(mergedTime));
    setSelectedDateAndTime((current) => ({
      ...current,
      time: nextTime,
    }));
  };

  const handleToggleDay = (day: string) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const handleRemoveSelectedUser = (user: AlarmRegisteredUser) => {
    setSelectedUsers((current) => current.filter((item) => item.userId !== user.userId));
  };

  const handleSelectHour = (hour: number) => {
    updateSoloTime((current) => {
      const next = new Date(current);
      const currentHour = next.getHours();
      const isPm = currentHour >= 12;
      const nextHour = hour % 12;
      next.setHours((isPm ? 12 : 0) + nextHour);
      return next;
    });
    setActiveTimeUnit('minute');
  };

  const handleSelectMinute = (minute: number) => {
    updateSoloTime((current) => {
      const next = new Date(current);
      next.setMinutes(minute, 0, 0);
      return next;
    });
  };

  const handleToggleMeridiem = (isAm: boolean) => {
    updateSoloTime((current) => {
      const next = new Date(current);
      let hour = next.getHours() % 12;
      if (hour === 0) {
        hour = 12;
      }
      const next24Hour = isAm ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12;
      next.setHours(next24Hour);
      return next;
    });
  };

  const handleSubmit = async () => {
    try {
      const permission = await checkPermission();
      if (permission === false) {
        setShowOverlayModal(true);
        return;
      }

      const timeDate = selectedDateAndTime.time || mergedTime;
      let hour = timeDate.getHours();
      const minute = timeDate.getMinutes();

      const now = new Date();
      const targetDate = mode === 'group' ? selectedDateAndTime.date || now : now;
      const alarmTime = new Date(targetDate);
      alarmTime.setHours(hour, minute, 0, 0);

      const isToday = alarmTime.toDateString() === now.toDateString();
      const diffSecs = (alarmTime.getTime() - now.getTime()) / 1000;

      const repeat = scheduleFrequency ? (scheduleFrequency.toLowerCase() as AlarmRepeat) : 'none';
      const isRecurring = repeat !== 'none' || selectedDays.length > 0;

      if (!isRecurring && isToday && diffSecs < 20) {
        showMessage({
          message: 'One-off alarms must be at least 20 seconds in the future.',
          type: 'warning',
        });
        return;
      }

      const meridiem: AlarmMeridiem = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;

      const title =
        mode === 'group'
          ? selectedUsers
              .map((user) => (user.displayName || user.fullName).split(' ')[0])
              .join(', ') || 'Group Alarm'
          : message || 'Solo Alarm';

      if (mode === 'solo') {
        const payload = {
          title,
          note: message,
          hour,
          minute,
          meridiem,
          tone,
          alarmNotes: [],
          vibrate,
          bufferMinutes,
          repeat,
          repeatDays: selectedDays,
        };

        if (editingAlarmId) {
          await updateSoloAlarmMutation.mutateAsync({
            alarmId: editingAlarmId,
            input: payload,
          });
        } else {
          await createSoloAlarmMutation.mutateAsync(payload);
        }
      } else {
        if (!selectedUsers.length) {
          showMessage({ message: 'Select at least one registered user.', type: 'warning' });
          return;
        }

        const payload = {
          title,
          note: message,
          startDate: (selectedDateAndTime.date || new Date()).toISOString(),
          hour,
          minute,
          meridiem,
          tone,
          alarmNotes,
          vibrate,
          bufferMinutes,
          repeat,
          repeatDays: selectedDays,
          members: selectedUsers,
          memoUri: memos.length > 0 ? memos[0].uri : null,
        };

        if (editingAlarmId) {
          await updateGroupAlarmMutation.mutateAsync({
            alarmId: editingAlarmId,
            input: payload,
          });
        } else {
          await createGroupAlarmMutation.mutateAsync(payload);
        }
      }

      showMessage({
        message: isEditing
          ? 'Alarm updated.'
          : mode === 'group'
            ? 'Group alarm invitation sent.'
            : 'Solo alarm created.',
        type: 'success',
      });
      navigation.goBack();
    } catch (error) {
      showMessage({
        message: error instanceof Error ? error.message : 'Unable to save alarm.',
        type: 'danger',
      });
    }
  };

  const isSubmitting =
    createSoloAlarmMutation.isPending ||
    createGroupAlarmMutation.isPending ||
    updateSoloAlarmMutation.isPending ||
    updateGroupAlarmMutation.isPending;

  return (
    <>
      <SafeAreaView style={style.container}>
        <View style={style.contentContainer}>
          <AlarmHeader
            onBackPress={() => navigation.goBack()}
            title="Alarm"
            themeColor={colors.alarmFocus}
            textColor={colors.text}
            style={style}
          />

          <ScrollView
            ref={scrollViewRef}
            style={[style.itemsContainer, { marginBottom: 50 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
            automaticallyAdjustContentInsets
            automaticallyAdjustsScrollIndicatorInsets
          >
            <AlarmModeToggle mode={mode} onChange={setMode} />

            {mode === 'solo' ? (
              <>
                <SoloAlarmEditor
                  time={mergedTime}
                  selectedDays={selectedDays}
                  onToggleDay={handleToggleDay}
                  onOpenTimePicker={handleTimePress}
                  onSelectHour={handleSelectHour}
                  onSelectMinute={handleSelectMinute}
                  onToggleMeridiem={handleToggleMeridiem}
                  activeUnit={activeTimeUnit}
                  onChangeUnit={setActiveTimeUnit}
                  vibrate={vibrate}
                  onToggleVibrate={() => setVibrate((current) => !current)}
                  tone={tone}
                  bufferMinutes={bufferMinutes}
                  onBufferPress={() => {
                    setBufferMinutes((prev) => {
                      if (prev === 0) return 1;
                      if (prev === 1) return 5;
                      return (prev + 5) % 35;
                    });
                  }}
                  onTonePress={() => setShowTonePicker(true)}
                />
              </>
            ) : (
              <>
                <AlarmInviteField
                  selectedUsers={selectedUsers}
                  onPress={() => setShowUserPicker(true)}
                  onRemoveUser={handleRemoveSelectedUser}
                  themeColor={colors.alarmFocus}
                />

                <AddMessage
                  title="Note"
                  message={message}
                  setMessage={setMessage}
                  themeColor={colors.alarmFocus}
                />

                <Text style={[localStyles.sectionTitle, { color: colors.text }]}>Tone</Text>
                <Pressable
                  onPress={() => setShowTonePicker(true)}
                  style={[
                    localStyles.toneField,
                    { backgroundColor: colors.scheduleReminderCardBackground },
                  ]}
                >
                  <Text style={[localStyles.toneFieldText, { color: colors.text }]}>
                    {sounds.find((s) => s.soundKeyName === tone)?.name || 'Default'}
                  </Text>
                </Pressable>

                <AlarmNoteSelector
                  alarmNotes={alarmNotes}
                  setAlarmNotes={setAlarmNotes}
                  themeColor={colors.alarmFocus}
                />

                <Text style={[localStyles.sectionTitle, { color: colors.text }]}>Voice Note</Text>
                <AudioRecorder
                  memos={memos}
                  setMemos={setMemos}
                  recording={recording}
                  onRecordingPress={onRecordingPress}
                  animatedRecordWave={animatedRecordWave}
                  themeColor={colors.alarmFocus}
                  iconColor={colors.alarmFocus}
                  style={style}
                  // memoContainerStyle={{ height: 50 }}
                />

                <AlarmScheduleRow
                  themeColor={colors.alarmFocus}
                  bufferMinutes={bufferMinutes}
                  onBufferPress={() => {
                    setBufferMinutes((prev) => {
                      if (prev === 0) return 1;
                      if (prev === 1) return 5;
                      return (prev + 5) % 35;
                    });
                  }}
                  onDatePress={handleDatePress}
                  onTimePress={handleTimePress}
                  selectedDateAndTime={selectedDateAndTime}
                />

                <View style={{ marginBottom: 10 }}>
                  <AddScheduleFrequency
                    themeColor={colors.alarmFocus}
                    selectedDays={selectedDays}
                    setSelectedDays={setSelectedDays}
                    scheduleFrequency={scheduleFrequency}
                    setScheduleFrequency={setScheduleFrequency}
                  />
                </View>
              </>
            )}
          </ScrollView>

          <Pressable
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={[style.createButton, { backgroundColor: colors.alarmFocus }]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={style.createButtonText}>{isEditing ? 'Save' : 'Create'}</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>

      {pickerVisibleType && (
        <RNDateTimePicker
          value={
            pickerVisibleType === 'date'
              ? selectedDateAndTime.date || new Date()
              : selectedDateAndTime.time || mergedTime
          }
          mode={pickerVisibleType}
          is24Hour={false}
          minimumDate={pickerVisibleType === 'date' ? new Date() : undefined}
          themeVariant="dark"
          display="default"
          onChange={handlePickerChange}
          negativeButton={{ label: 'Cancel', textColor: colors.text }}
        />
      )}

      <RegisteredUserPicker
        visible={showUserPicker}
        onClose={() => setShowUserPicker(false)}
        selectedUsers={selectedUsers}
        onChange={setSelectedUsers}
      />

      <TonePickerModal
        visible={showTonePicker}
        onClose={() => setShowTonePicker(false)}
        selectedTone={tone}
        onSelect={setTone}
      />

      <OverlayPermissionModal
        isVisible={showOverlayModal}
        onClose={() => setShowOverlayModal(false)}
        autoCheck={false}
      />
    </>
  );
};

export default CreateAlarmScreen;

const localStyles = StyleSheet.create({
  sectionTitle: {
    fontSize: 19,
    fontFamily: FONTS.Medium,
    marginBottom: 10,
  },
  toneField: {
    width: '100%',
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 16,
    justifyContent: 'center',
    marginBottom: 20,
  },
  toneFieldText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    marginBottom: 20,
  },
  snoozeChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  snoozeText: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
  },
});
