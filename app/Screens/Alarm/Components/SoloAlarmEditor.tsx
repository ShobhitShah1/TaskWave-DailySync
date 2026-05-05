import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import { sounds } from '@Constants/Data';
import { useAppContext } from '@Contexts/ThemeProvider';
import useThemeColors from '@Hooks/useThemeMode';
import { WeekDayType } from '@Screens/AddReminder/Components/AddScheduleFrequency';
import React, { memo, useEffect, useMemo, useRef } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface SoloAlarmEditorProps {
  time: Date;
  selectedDays: WeekDayType[];
  onToggleDay: (day: WeekDayType) => void;
  onOpenTimePicker: () => void;
  onSelectHour: (hour: number) => void;
  onSelectMinute: (minute: number) => void;
  onToggleMeridiem: (isAm: boolean) => void;
  activeUnit: 'hour' | 'minute';
  onChangeUnit: (unit: 'hour' | 'minute') => void;
  vibrate: boolean;
  onToggleVibrate: () => void;
  tone: string;
  bufferMinutes: number;
  onBufferPress: () => void;
  onTonePress: () => void;
  themeColor: string;
}

const DAYS: WeekDayType[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_VALUES = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const CLOCK_SIZE = 260;
const CLOCK_RADIUS = CLOCK_SIZE / 2;
const NUMBER_RADIUS = 98;
const TICK_RADIUS = 118;
const TIP_SIZE = 36;
const TIP_HALF = TIP_SIZE / 2;

const mod = (n: number, m: number) => ((n % m) + m) % m;

const shortestPath = (from: number, to: number): number => {
  const normalizedFrom = mod(from, 360);
  let delta = to - normalizedFrom;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return from + delta;
};

const SoloAlarmEditor: React.FC<SoloAlarmEditorProps> = ({
  time,
  selectedDays,
  onToggleDay,
  onOpenTimePicker,
  onSelectHour,
  onSelectMinute,
  onToggleMeridiem,
  activeUnit,
  onChangeUnit,
  vibrate,
  onToggleVibrate,
  tone,
  bufferMinutes,
  onBufferPress,
  onTonePress,
  themeColor,
}) => {
  const colors = useThemeColors();
  const { theme } = useAppContext();
  const isDark = theme === 'dark';

  const displayHour = time.getHours() % 12 || 12;
  const displayMinute = time.getMinutes();
  const displayMinuteText = String(displayMinute).padStart(2, '0');
  const isAm = time.getHours() < 12;

  const handRotation = useMemo(() => {
    if (activeUnit === 'hour') {
      return ((displayHour % 12) * 30 || 360) - 90;
    }
    return displayMinute * 6 - 90;
  }, [activeUnit, displayHour, displayMinute]);

  const rotation = useSharedValue(handRotation);
  const prevUnitRef = useRef(activeUnit);

  useEffect(() => {
    const unitChanged = prevUnitRef.current !== activeUnit;
    prevUnitRef.current = activeUnit;

    if (unitChanged) {
      rotation.value = handRotation;
    } else {
      rotation.value = withTiming(shortestPath(rotation.value, handRotation), {
        duration: 220,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [handRotation, activeUnit]);

  const handStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const counterRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-rotation.value}deg` }],
  }));

  const handleGesture = (event: any) => {
    'worklet';
    const x = event.x - CLOCK_RADIUS;
    const y = event.y - CLOCK_RADIUS;
    let angle = (Math.atan2(y, x) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    if (activeUnit === 'hour') {
      let hour = Math.round(angle / 30) + 3;
      if (hour > 12) hour -= 12;
      if (hour <= 0) hour += 12;
      runOnJS(onSelectHour)(hour);
    } else {
      let minute = Math.round(angle / 6) + 15;
      if (minute >= 60) minute -= 60;
      runOnJS(onSelectMinute)(minute);
    }
  };

  const gesture = Gesture.Pan().onUpdate(handleGesture).onBegin(handleGesture);

  const ticks = useMemo(() => {
    if (activeUnit === 'hour') return [];
    return Array.from({ length: 60 }).map((_, i) => i);
  }, [activeUnit]);

  const currentSelectedValue = activeUnit === 'hour' ? displayHour : displayMinute;

  return (
    <>
      <View style={[styles.bigCard, { backgroundColor: colors.scheduleReminderCardBackground }]}>
        <View style={styles.topRow}>
          <View style={styles.timeBlockRow}>
            <Pressable
              onPress={() => onChangeUnit('hour')}
              style={[
                styles.timeBlock,
                {
                  backgroundColor: activeUnit === 'hour' ? colors.alarmFocus : colors.alarmUnfocus,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeBlockText,
                  { color: activeUnit === 'hour' ? colors.white : colors.grayTitle },
                ]}
              >
                {String(displayHour).padStart(2, '0')}
              </Text>
            </Pressable>

            <View style={styles.colonContainer}>
              <View style={[styles.colonDot, { backgroundColor: colors.text }]} />
              <View style={[styles.colonDot, { backgroundColor: colors.text }]} />
            </View>

            <Pressable
              onPress={() => onChangeUnit('minute')}
              style={[
                styles.timeBlock,
                {
                  backgroundColor:
                    activeUnit === 'minute' ? colors.alarmFocus : colors.alarmUnfocus,
                },
              ]}
            >
              <Text
                style={[
                  styles.timeBlockText,
                  { color: activeUnit === 'minute' ? colors.white : colors.grayTitle },
                ]}
              >
                {displayMinuteText}
              </Text>
            </Pressable>
          </View>

          <View style={styles.meridiemColumn}>
            <Pressable
              onPress={() => onToggleMeridiem(true)}
              style={[
                styles.meridiemPill,
                { backgroundColor: isAm ? colors.alarmDaySelectedBg : colors.alarmDayUnselectedBg },
              ]}
            >
              <Text
                style={[
                  styles.meridiemText,
                  { color: isAm ? (isDark ? '#151616' : colors.white) : colors.grayTitle },
                ]}
              >
                AM
              </Text>
            </Pressable>

            <Pressable
              onPress={() => onToggleMeridiem(false)}
              style={[
                styles.meridiemPill,
                {
                  backgroundColor: !isAm ? colors.alarmDaySelectedBg : colors.alarmDayUnselectedBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.meridiemText,
                  { color: !isAm ? (isDark ? '#151616' : colors.white) : colors.grayTitle },
                ]}
              >
                PM
              </Text>
            </Pressable>
          </View>
        </View>

        <GestureDetector gesture={gesture}>
          <View style={[styles.clockFace, { backgroundColor: colors.alarmWheelBg }]}>
            {/* Minute Ticks */}
            {ticks.map((i) => {
              const angle = ((i * 6 - 90) * Math.PI) / 180;
              const left = CLOCK_RADIUS + Math.cos(angle) * TICK_RADIUS - 1;
              const top = CLOCK_RADIUS + Math.sin(angle) * TICK_RADIUS - 1;
              const isMajor = i % 5 === 0;
              return (
                <View
                  key={i}
                  style={[
                    styles.tick,
                    {
                      left,
                      top,
                      backgroundColor: isMajor ? colors.text : colors.grayTitle,
                      opacity: isMajor ? 0.4 : 0.2,
                      width: isMajor ? 3 : 2,
                      height: isMajor ? 3 : 2,
                    },
                  ]}
                />
              );
            })}

            <Animated.View style={[styles.handWrap, handStyle]}>
              <View style={[styles.hand, { backgroundColor: colors.alarmFocus }]} />
              <View style={[styles.handTip, { backgroundColor: colors.alarmFocus }]}>
                <Animated.View style={[styles.counterRotate, counterRotationStyle]}>
                  <Text style={styles.tipValueText}>{currentSelectedValue}</Text>
                </Animated.View>
              </View>
            </Animated.View>

            {HOUR_VALUES.map((value, index) => {
              const angle = ((index * 30 - 90) * Math.PI) / 180;
              const left = CLOCK_RADIUS + Math.cos(angle) * NUMBER_RADIUS - TIP_HALF;
              const top = CLOCK_RADIUS + Math.sin(angle) * NUMBER_RADIUS - TIP_HALF;

              let labelValue = value;
              if (activeUnit === 'minute') {
                labelValue = index * 5;
                if (labelValue === 0) labelValue = 0;
              }

              const isSelected =
                activeUnit === 'hour' ? displayHour === value : displayMinute === labelValue;

              return (
                <View key={`${activeUnit}-${value}`} style={[styles.numberWrap, { left, top }]}>
                  <Text
                    style={[
                      styles.numberText,
                      {
                        color: colors.grayTitle,
                        opacity: isSelected ? 0 : 1,
                        fontSize: activeUnit === 'minute' ? 12 : 14,
                      },
                    ]}
                  >
                    {String(labelValue).padStart(activeUnit === 'hour' ? 1 : 2, '0')}
                  </Text>
                </View>
              );
            })}

            <View style={[styles.centerDot, { backgroundColor: colors.alarmFocus }]} />
          </View>
        </GestureDetector>
      </View>

      <View style={styles.metaRow}>
        <Pressable onPress={onTonePress} style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: colors.text }]}>Tone:</Text>
          <View
            style={[styles.metaField, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <Text style={[styles.metaValue, { color: colors.placeholderText }]}>
              {sounds.find((s) => s.soundKeyName === tone)?.name || 'Default'}
            </Text>
          </View>
        </Pressable>

        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: colors.text }]}>Vibrate:</Text>
          <Pressable
            onPress={onToggleVibrate}
            style={[styles.metaField, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <Image
              source={AssetsPath.ic_vibration}
              tintColor={vibrate ? colors.text : colors.placeholderText}
              style={[styles.metaIcon, { width: 25, height: 25 }]}
            />
          </Pressable>
        </View>

        <View style={styles.metaCol}>
          <Text style={[styles.metaLabel, { color: colors.text }]}>Buffer Time:</Text>
          <Pressable
            onPress={onBufferPress}
            style={[styles.metaField, { backgroundColor: colors.scheduleReminderCardBackground }]}
          >
            <Image
              source={AssetsPath.ic_timerClock}
              tintColor={colors.placeholderText}
              style={styles.metaIcon}
            />
            <Text style={[styles.metaValue, { color: colors.placeholderText }]}>
              {bufferMinutes} MIN
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.daysRow}>
        {DAYS.map((day) => {
          const selected = selectedDays.includes(day);
          return (
            <Pressable
              key={day}
              onPress={() => onToggleDay(day)}
              style={[
                styles.dayChip,
                {
                  backgroundColor: selected
                    ? colors.alarmDaySelectedBg
                    : colors.alarmDayUnselectedBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: selected ? (isDark ? '#151616' : colors.white) : colors.text },
                ]}
              >
                {day}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  bigCard: {
    width: '100%',
    borderRadius: 36,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 24,
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  timeBlockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 10,
  },
  timeBlock: {
    width: 82,
    height: 82,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeBlockText: {
    fontSize: 44,
    fontFamily: FONTS.Medium,
  },
  colonContainer: {
    height: 40,
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  colonDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  meridiemColumn: {
    rowGap: 8,
  },
  meridiemPill: {
    width: 60,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meridiemText: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
  },
  clockFace: {
    width: CLOCK_SIZE,
    height: CLOCK_SIZE,
    borderRadius: CLOCK_RADIUS,
    alignSelf: 'center',
    marginTop: 18,
    position: 'relative',
  },
  tick: {
    position: 'absolute',
    borderRadius: 2,
  },
  numberWrap: {
    position: 'absolute',
    width: TIP_SIZE,
    height: TIP_SIZE,
    borderRadius: TIP_HALF,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 14,
    fontFamily: FONTS.SemiBold,
  },
  handWrap: {
    position: 'absolute',
    left: CLOCK_RADIUS,
    top: CLOCK_RADIUS,
    width: 0,
    height: 0,
    zIndex: 5,
  },
  hand: {
    width: NUMBER_RADIUS - TIP_HALF,
    height: 2,
    borderRadius: 1,
    marginTop: -1,
  },
  handTip: {
    position: 'absolute',
    left: NUMBER_RADIUS - TIP_HALF,
    top: -TIP_HALF,
    width: TIP_SIZE,
    height: TIP_SIZE,
    borderRadius: TIP_HALF,
    justifyContent: 'center',
    alignItems: 'center',
  },
  counterRotate: {
    width: TIP_SIZE,
    height: TIP_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipValueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FONTS.Bold,
  },
  centerDot: {
    position: 'absolute',
    left: CLOCK_RADIUS - 5,
    top: CLOCK_RADIUS - 5,
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 2,
  },
  metaRow: {
    flexDirection: 'row',
    columnGap: 12,
    marginBottom: 20,
    marginTop: 4,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 15,
    fontFamily: FONTS.Medium,
    paddingBottom: 10,
  },
  metaField: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    columnGap: 8,
    backgroundColor: '#303334',
  },
  metaValue: {
    fontSize: 13,
    fontFamily: FONTS.SemiBold,
  },
  metaIcon: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    columnGap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  dayChip: {
    flex: 1,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 12,
    fontFamily: FONTS.SemiBold,
  },
});

export default memo(SoloAlarmEditor);
