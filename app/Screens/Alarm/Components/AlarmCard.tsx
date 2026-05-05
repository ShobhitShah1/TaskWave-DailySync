import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { useAppContext } from '@Contexts/ThemeProvider';
import { useCountdownTimer } from '@Hooks/useCountdownTimer';
import useThemeColors from '@Hooks/useThemeMode';
import { useAuth } from '@Hooks/useAuth';
import { GroupAlarmRecord, SoloAlarmRecord } from '@Types/Alarm';
import { formatAlarmDate, formatAlarmRepeatLabel, formatAlarmTime } from '@Utils/alarmDisplay';
import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type AlarmCardRecord = SoloAlarmRecord | GroupAlarmRecord;

interface AlarmCardProps {
  alarm: AlarmCardRecord;
  onPress: () => void;
  onLongPress?: () => void;
  onEditPress?: () => void;
  onDuplicatePress?: () => void;
}

const LOGO_SIZE = 68;

const AlarmCard: React.FC<AlarmCardProps> = ({
  alarm,
  onPress,
  onLongPress,
  onEditPress,
  onDuplicatePress,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const { auth } = useAuth();
  const { timeLeft } = useCountdownTimer(alarm.nextTriggerAt);

  const title = useMemo(() => {
    if (alarm.mode === 'group') {
      const names = alarm.members.map((member) => member.fullName.split(' ')[0]).slice(0, 3);
      return names.length ? names.join(', ') : 'Shared alarm';
    }
    return alarm.title?.trim() || 'Alarm';
  }, [alarm]);

  const subtitle = useMemo(() => {
    if (alarm.status === 'snoozed' && alarm.snoozedUntil) {
      const snoozeDate = new Date(alarm.snoozedUntil);
      if (!isNaN(snoozeDate.getTime()) && snoozeDate.getTime() > Date.now()) {
        return `Snoozed until ${formatAlarmTime(
          snoozeDate.getHours() % 12 || 12,
          snoozeDate.getMinutes(),
          snoozeDate.getHours() >= 12 ? 'PM' : 'AM',
        )}`;
      }
    }
    const note = alarm.note?.trim();
    if (note) return note;
    return formatAlarmRepeatLabel(alarm.repeat, alarm.repeatDays);
  }, [alarm]);

  const timeLabel = formatAlarmTime(alarm.hour, alarm.minute, alarm.meridiem);
  const canEdit = alarm.mode === 'solo' || alarm.ownerUserId === auth?.user?.id;

  const cardBg = useMemo(() => {
    return theme === 'dark' ? colors.reminderCardBackground : '#F0F5FF';
  }, [theme, colors.reminderCardBackground]);

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.cardContainer, { backgroundColor: cardBg }]}
    >
      {/* Top Section: Logo and Title/Description */}
      <View style={styles.topSection}>
        <View style={styles.leftCol}>
          <View style={[styles.logoContainer, { backgroundColor: colors.alarmFocus }]}>
            <Image
              source={AssetsPath.ic_unFillAlarm}
              style={styles.logoIcon}
              tintColor={colors.white}
            />
          </View>
        </View>

        <View style={styles.rightCol}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.titleText, { color: colors.text }]}>
              {title}
            </Text>
            <Text style={[styles.countdownText, { color: colors.alarmFocus }]}>{timeLeft}</Text>
          </View>

          <Text
            numberOfLines={2}
            style={[
              styles.subtitleText,
              { color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(139, 142, 142, 1)' },
            ]}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      {/* Bottom Section: Integrated Footer Row (Single Row Enforcement) */}
      <View style={styles.footerRow}>
        <View style={styles.metaContainer}>
          <Text
            numberOfLines={1}
            style={[styles.timeLabel, { color: theme === 'dark' ? '#B4C2FF' : colors.alarmFocus }]}
          >
            {timeLabel}
          </Text>

          <View style={[styles.vSeparator, { backgroundColor: colors.alarmFocus }]} />
          <Image
            source={AssetsPath.ic_calender}
            style={[styles.metaIcon, { width: 14, height: 14 }]}
            tintColor={colors.alarmFocus}
          />
          <Text numberOfLines={1} style={[styles.dateText, { color: colors.alarmFocus }]}>
            {formatAlarmDate(alarm.nextTriggerAt)}
          </Text>

          <View style={[styles.vSeparator, { backgroundColor: colors.alarmFocus }]} />
          <Image
            source={alarm.note ? AssetsPath.ic_custom_audio : AssetsPath.ic_alertNotification}
            style={[styles.metaIcon, alarm.note && { width: 20, height: 20 }]}
            tintColor={colors.alarmFocus}
          />

          {alarm.mode === 'solo' && (alarm as SoloAlarmRecord).vibrate && (
            <>
              <View style={[styles.vSeparator, { backgroundColor: colors.alarmFocus }]} />
              <Image
                source={AssetsPath.ic_vibration}
                style={[styles.metaIcon, { width: 20, height: 20 }]}
                tintColor={colors.alarmFocus}
              />
            </>
          )}
          <View style={[styles.vSeparator, { backgroundColor: colors.alarmFocus }]} />
        </View>

        <View style={styles.actionsContainer}>
          <Pressable hitSlop={10} onPress={onPress}>
            <Image
              source={AssetsPath.ic_view}
              style={styles.actionIcon}
              tintColor={colors.alarmFocus}
            />
          </Pressable>
          {canEdit && onEditPress ? (
            <Pressable hitSlop={10} onPress={onEditPress}>
              <Image
                source={AssetsPath.ic_edit}
                style={styles.actionIcon}
                tintColor={colors.alarmFocus}
              />
            </Pressable>
          ) : null}
          {canEdit && onDuplicatePress ? (
            <Pressable hitSlop={10} onPress={onDuplicatePress}>
              <Image
                source={AssetsPath.ic_duplicate}
                style={styles.actionIcon}
                tintColor={colors.alarmFocus}
              />
            </Pressable>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 15,
    marginVertical: 5,
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  topSection: {
    flexDirection: 'row',
  },
  leftCol: {
    width: '20%',
    alignItems: 'center',
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    width: LOGO_SIZE / 1.8,
    height: LOGO_SIZE / 1.8,
    resizeMode: 'contain',
  },
  rightCol: {
    width: '80%',
    paddingLeft: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 17.5,
    fontFamily: FONTS.SemiBold,
    flex: 1,
  },
  countdownText: {
    fontSize: 14,
    fontFamily: FONTS.Medium,
    marginLeft: 8,
  },
  subtitleText: {
    fontSize: 16,
    fontFamily: FONTS.Medium,
    marginTop: 2,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  timeLabel: {
    // width: '24%',
    textAlign: 'center',
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
  },
  vSeparator: {
    height: 14,
    borderRightWidth: 1.5,
    opacity: 0.3,
  },
  metaIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  dateText: {
    fontSize: 13,
    fontFamily: FONTS.Medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'flex-end',
  },
  actionIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
  },
});

export default AlarmCard;
