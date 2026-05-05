import AssetsPath from '@Constants/AssetsPath';
import { FONTS, SIZE } from '@Constants/Theme';
import { useCountdownTimer } from '@Hooks/useCountdownTimer';
import { getLocalAlarmDetails, useAlarmFeed } from '@Hooks/useAlarm';
import useThemeColors from '@Hooks/useThemeMode';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@Types/Interface';
import { formatAlarmDate, formatAlarmTime } from '@Utils/alarmDisplay';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showMessage } from 'react-native-flash-message';
import { useDeleteAlarm, useLeaveAlarm } from '@Hooks/useAlarm';
import { useAuth } from '@Hooks/useAuth';

import AlarmActionBar from './Components/AlarmActionBar';
import AnalogClock from './Components/AnalogClock';

type AlarmDetailsRoute = RouteProp<RootStackParamList, 'AlarmDetails'>;

const AlarmDetailsScreen = () => {
  const colors = useThemeColors();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<AlarmDetailsRoute>();
  const { groupQuery } = useAlarmFeed();
  const deleteMutation = useDeleteAlarm();
  const leaveMutation = useLeaveAlarm();
  const { auth } = useAuth();
  const [localAlarm, setLocalAlarm] = useState<any>(null);

  useEffect(() => {
    if (route.params.mode === 'solo') {
      getLocalAlarmDetails(route.params.alarmId).then(setLocalAlarm);
    }
  }, [route.params.alarmId, route.params.mode]);

  // Re-fetch solo alarm data when screen is focused (e.g., after snooze state changes)
  useFocusEffect(
    useCallback(() => {
      if (route.params.mode === 'solo') {
        getLocalAlarmDetails(route.params.alarmId).then(setLocalAlarm);
      }
    }, [route.params.alarmId, route.params.mode]),
  );

  const alarm = useMemo(() => {
    if (route.params.mode === 'solo') {
      return localAlarm;
    }

    return groupQuery.data?.alarms.find((item) => item.id === route.params.alarmId) || null;
  }, [groupQuery.data?.alarms, localAlarm, route.params.alarmId, route.params.mode]);

  const { formattedTimeLeft } = useCountdownTimer(alarm?.nextTriggerAt);

  if (!alarm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.centerState}>
          <Text style={[styles.emptyText, { color: colors.text }]}>Alarm not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const [hours, minutes, seconds] = formattedTimeLeft.split(' : ');
  const timeLabel = formatAlarmTime(alarm.hour, alarm.minute, alarm.meridiem);
  const dateLabel = formatAlarmDate(alarm.nextTriggerAt);
  const note = alarm.note?.trim() || 'No note added.';
  const isSolo = route.params.mode === 'solo';
  const canEdit = isSolo || ('ownerUserId' in alarm && alarm.ownerUserId === auth?.user?.id);
  const isSnoozed = alarm.status === 'snoozed' && alarm.snoozedUntil;
  const snoozeTimeLabel = isSnoozed
    ? (() => {
        const d = new Date(alarm.snoozedUntil!);
        return isNaN(d.getTime())
          ? null
          : formatAlarmTime(d.getHours() % 12 || 12, d.getMinutes(), d.getHours() >= 12 ? 'PM' : 'AM');
      })()
    : null;

  const handleDeleteAlarm = () => {
    const isOwner = isSolo || (alarm.mode === 'group' && alarm.ownerUserId === auth?.user?.id);

    if (isOwner) {
      Alert.alert('Delete Alarm', 'Are you sure you want to delete this alarm?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(
              { alarmId: alarm.id, mode: alarm.mode },
              {
                onSuccess: () => {
                  showMessage({
                    message: 'Alarm deleted successfully',
                    type: 'success',
                  });
                  navigation.goBack();
                },
                onError: (error: any) => {
                  showMessage({
                    message: error?.message || 'Failed to delete alarm',
                    type: 'danger',
                  });
                },
              },
            );
          },
        },
      ]);
    } else if (alarm.mode === 'group') {
      Alert.alert('Leave Alarm', 'Are you sure you want to leave this shared alarm?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            leaveMutation.mutate(alarm.id, {
              onSuccess: () => {
                showMessage({
                  message: 'You have left the alarm',
                  type: 'success',
                });
                navigation.goBack();
              },
              onError: (error: any) => {
                showMessage({
                  message: error?.message || 'Failed to leave alarm',
                  type: 'danger',
                });
              },
            });
          },
        },
      ]);
    }
  };

  const isOwner = isSolo || (alarm.mode === 'group' && alarm.ownerUserId === auth?.user?.id);
  const deleteLabel = isOwner ? 'Delete' : 'Leave';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Image
              source={AssetsPath.ic_leftArrow}
              style={[styles.backIcon, { tintColor: colors.text }]}
            />
          </Pressable>
          <View />
          <View />
        </View>

        <ScrollView
          bounces={false}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Icon */}
          <View style={[styles.iconWrap, { backgroundColor: colors.alarmFocus }]}>
            <Image source={AssetsPath.ic_fillAlarm} style={styles.icon} />
          </View>

          {/* Screen Title */}
          <Text style={[styles.screenTitle, { color: colors.text }]}>Alarm</Text>

          {/* Snooze Banner */}
          {isSnoozed && snoozeTimeLabel && (
            <View style={[styles.snoozeBanner, { backgroundColor: colors.alarmFocus }]}>
              <Text style={styles.snoozeBannerText}>
                ⏸ Snoozed until {snoozeTimeLabel}
              </Text>
            </View>
          )}

          {/* Countdown Timer */}
          <View style={styles.timerRow}>
            <Text style={[styles.timerValue, { color: colors.alarmFocus }]}>
              {hours.replace('Hrs', '')}
              <Text style={[styles.timerUnit, { color: colors.text }]}>Hrs</Text>
            </Text>
            <Text style={[styles.timerSeparator, { color: colors.alarmFocus }]}> : </Text>
            <Text style={[styles.timerValue, { color: colors.alarmFocus }]}>
              {minutes.replace('Min', '')}
              <Text style={[styles.timerUnit, { color: colors.text }]}>Min</Text>
            </Text>
            <Text style={[styles.timerSeparator, { color: colors.alarmFocus }]}> : </Text>
            <Text style={[styles.timerValue, { color: colors.alarmFocus }]}>
              {seconds.replace('Sec', '')}
              <Text style={[styles.timerUnit, { color: colors.text }]}>Sec</Text>
            </Text>
          </View>

          {isSolo ? (
            /* ─── SOLO VIEW ─── */
            <>
              {/* Day pills */}
              <View style={styles.dayRow}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                  (day: string, index: number) => {
                    const active = alarm.repeatDays?.includes(day);
                    return (
                      <View
                        key={index}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: active
                              ? colors.alarmDaySelectedBg
                              : colors.alarmDayUnselectedBg,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            { color: active ? colors.background : colors.text },
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    );
                  },
                )}
              </View>

              {/* Large time display */}
              <Text style={[styles.soloTimeDisplay, { color: colors.alarmFocus }]}>
                {alarm.hour}:{String(alarm.minute).padStart(2, '0')}
                <Text style={styles.soloMeridiem}>{alarm.meridiem.toLowerCase()}</Text>
              </Text>

              {/* Analog Clock Face */}
              <View style={styles.clockContainer}>
                <AnalogClock
                  hour={alarm.hour}
                  minute={alarm.minute}
                  themeColor={colors.alarmFocus}
                />
              </View>

              {/* Tone & Vibrate Row */}
              <View style={styles.soloMetaRow}>
                <View style={styles.soloMetaCol}>
                  <Text style={[styles.soloMetaLabel, { color: colors.text }]}>Tone:</Text>
                  <View
                    style={[
                      styles.soloMetaField,
                      { backgroundColor: colors.scheduleReminderCardBackground },
                    ]}
                  >
                    <Text style={[styles.soloMetaValue, { color: colors.white }]}>
                      {alarm.tone}
                    </Text>
                  </View>
                </View>
                <View style={styles.soloMetaCol}>
                  <Text style={[styles.soloMetaLabel, { color: colors.text }]}>Vibrate:</Text>
                  <View
                    style={[
                      styles.soloMetaField,
                      { backgroundColor: colors.scheduleReminderCardBackground },
                    ]}
                  >
                    <Image
                      source={AssetsPath.ic_vibration}
                      style={styles.soloMetaIcon}
                      tintColor={colors.white}
                    />
                  </View>
                </View>
              </View>
            </>
          ) : (
            /* ─── GROUP VIEW (mirrors ReminderPreview) ─── */
            <>
              {/* Date / Time meta row */}
              <View style={styles.metaRow}>
                <Text style={[styles.metaText, { color: colors.placeholderText }]}>
                  {dateLabel}
                </Text>
                <Text style={[styles.metaText, { color: colors.placeholderText }]}>
                  {timeLabel}
                </Text>
              </View>

              {/* Note card */}
              <View style={[styles.noteCard, { backgroundColor: colors.previewBackground }]}>
                <Text style={[styles.noteCardText, { color: colors.text }]}>{note}</Text>
              </View>

              {/* Tone */}
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Tone</Text>
              <View style={[styles.toneField, { backgroundColor: colors.previewBackground }]}>
                <Text style={[styles.toneFieldText, { color: colors.text }]}>{alarm.tone}</Text>
              </View>

              {/* Members grid */}
              <View style={styles.memberGrid}>
                {alarm.members?.map((member: any) => (
                  <View
                    key={member.userId}
                    style={[styles.memberCard, { backgroundColor: colors.previewBackground }]}
                  >
                    <Text
                      numberOfLines={1}
                      style={[styles.memberName, { color: colors.alarmFocus }]}
                    >
                      {member.fullName}
                    </Text>
                    <Text style={[styles.memberPhone, { color: colors.placeholderText }]}>
                      {member.phoneE164}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Repeat days */}
              {alarm.repeatDays?.length > 0 && (
                <View style={styles.repeatDayRow}>
                  {alarm.repeatDays.map((day: string) => (
                    <View key={day} style={styles.repeatDayChip}>
                      <Text style={styles.repeatDayText}>{day}</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Bottom action bar */}
        <AlarmActionBar
          deleteLabel={deleteLabel}
          onDeletePress={handleDeleteAlarm}
          onEditPress={
            canEdit
              ? () =>
                  navigation.navigate('CreateAlarm', {
                    id: alarm.id,
                    mode: route.params.mode,
                  })
              : undefined
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    width: SIZE.appContainWidth,
    flex: 1,
    alignSelf: 'center',
  },
  headerRow: {
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
  },
  backIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 135,
  },
  centerState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.SemiBold,
  },
  iconWrap: {
    width: 78,
    height: 78,
    borderRadius: 18,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  icon: {
    width: 42,
    height: 42,
    resizeMode: 'contain',
  },
  screenTitle: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: FONTS.Medium,
  },
  snoozeBanner: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  snoozeBannerText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  timerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerValue: {
    fontSize: 32,
    fontFamily: FONTS.Medium,
  },
  timerUnit: {
    fontSize: 18,
    fontFamily: FONTS.Medium,
  },
  timerSeparator: {
    marginHorizontal: 6,
    fontSize: 30,
    fontFamily: FONTS.Medium,
  },

  /* ─── SOLO ─── */
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 24,
  },
  dayChip: {
    width: 50,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontFamily: FONTS.SemiBold,
  },
  soloTimeDisplay: {
    textAlign: 'center',
    fontSize: 72,
    fontFamily: FONTS.SemiBold,
    marginTop: 22,
    letterSpacing: 2,
  },
  soloMeridiem: {
    fontSize: 26,
    fontFamily: FONTS.Medium,
    marginLeft: 8,
  },
  clockContainer: {
    marginTop: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  soloMetaRow: {
    flexDirection: 'row',
    columnGap: 10,
    marginTop: 24,
  },
  soloMetaCol: {
    flex: 1,
  },
  soloMetaLabel: {
    fontSize: 15,
    fontFamily: FONTS.Regular,
    marginBottom: 8,
  },
  soloMetaField: {
    height: 52,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: 8,
  },
  soloMetaValue: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  soloMetaIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },

  /* ─── GROUP ─── */
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metaText: {
    fontSize: 19,
    fontFamily: FONTS.SemiBold,
  },
  noteCard: {
    width: '100%',
    marginTop: 15,
    borderRadius: 10,
    padding: 10,
  },
  noteCardText: {
    fontSize: 17.5,
    lineHeight: 28,
    fontFamily: FONTS.Medium,
  },
  sectionLabel: {
    fontSize: 19,
    fontFamily: FONTS.Medium,
    marginTop: 18,
  },
  toneField: {
    width: '100%',
    minHeight: 46,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: 'center',
    marginTop: 10,
  },
  toneFieldText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
  },
  memberGrid: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  memberCard: {
    width: '47%',
    borderRadius: 15,
    padding: 10,
  },
  memberName: {
    fontSize: 15,
    fontFamily: FONTS.SemiBold,
  },
  memberPhone: {
    marginTop: 3,
    fontSize: 14,
    fontFamily: FONTS.Medium,
  },
  repeatDayRow: {
    marginTop: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  repeatDayChip: {
    minWidth: 48,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#FFF200',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  repeatDayText: {
    color: '#202020',
    fontSize: 12,
    fontFamily: FONTS.SemiBold,
  },
});

export default AlarmDetailsScreen;
