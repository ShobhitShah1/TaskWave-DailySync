import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface AnalogClockProps {
  hour: number;
  minute: number;
  themeColor: string;
  size?: number;
}

const HOUR_VALUES = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const AnalogClock: React.FC<AnalogClockProps> = ({ hour, minute, themeColor, size = 280 }) => {
  const colors = useThemeColors();
  const radius = size / 2;
  const hourRadius = 110;
  const minuteRadius = 78;
  const tipSize = 36;
  const tipHalf = tipSize / 2;

  const displayHour = hour % 12 || 12;
  const hourAngle = ((displayHour % 12) * 30 || 360) - 90;
  const minuteAngle = minute * 6 - 90;

  // Logic: if hour and minute point to same position, hide minute hand
  // They point to same position if (hour%12) * 5 === minute
  const isCoinciding = (displayHour % 12) * 5 === minute;

  return (
    <View
      style={[
        styles.clockFace,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: colors.alarmWheelBg,
        },
      ]}
    >
      {/* 60 Minute Ticks */}
      {Array.from({ length: 60 }).map((_, i) => {
        const angle = (i * 6 - 90) * (Math.PI / 180);
        const tickRadius = radius - 8;
        const isFiveMin = i % 5 === 0;

        return (
          <View
            key={`tick-${i}`}
            style={{
              position: 'absolute',
              left: radius + Math.cos(angle) * tickRadius - (isFiveMin ? 1 : 0.5),
              top: radius + Math.sin(angle) * tickRadius - (isFiveMin ? 1 : 0.5),
              width: isFiveMin ? 2 : 1,
              height: isFiveMin ? 2 : 1,
              borderRadius: 1,
              backgroundColor: colors.grayTitle,
              opacity: isFiveMin ? 0.4 : 0.2,
            }}
          />
        );
      })}

      {/* Hand - Minute */}
      {!isCoinciding && (
        <View
          style={[
            styles.handWrapper,
            {
              left: radius,
              top: radius,
              transform: [{ rotate: `${minuteAngle}deg` }],
              zIndex: 1,
            },
          ]}
        >
          <View
            style={[
              styles.minuteHandLine,
              { backgroundColor: colors.alarmFocus, width: minuteRadius - 12 },
            ]}
          />
          <View
            style={[
              styles.handTipSmall,
              { backgroundColor: colors.alarmFocus, left: minuteRadius - 12 },
            ]}
          />
        </View>
      )}

      {/* Hand - Hour */}
      <View
        style={[
          styles.handWrapper,
          {
            left: radius,
            top: radius,
            transform: [{ rotate: `${hourAngle}deg` }],
            zIndex: 2,
          },
        ]}
      >
        <View
          style={[
            styles.handLine,
            { backgroundColor: colors.alarmFocus, width: hourRadius - tipHalf },
          ]}
        />
        <View
          style={[
            styles.handTip,
            { backgroundColor: colors.alarmFocus, left: hourRadius - tipHalf },
          ]}
        />
      </View>

      {/* Hour Numbers (Outer Ring) */}
      {HOUR_VALUES.map((val, index) => {
        const angle = ((index * 30 - 90) * Math.PI) / 180;
        const left = radius + Math.cos(angle) * hourRadius - tipHalf;
        const top = radius + Math.sin(angle) * hourRadius - tipHalf;
        const isSelected = displayHour === val;

        return (
          <View key={`hour-${val}`} style={[styles.numberWrap, { left, top, zIndex: 10 }]}>
            <Text
              style={[
                styles.numberText,
                {
                  color: isSelected ? colors.white : colors.grayTitle,
                  fontFamily: isSelected ? FONTS.Bold : FONTS.Medium,
                },
              ]}
            >
              {val}
            </Text>
          </View>
        );
      })}

      {/* Minute Numbers (Inner Ring) */}
      {(() => {
        const baseValues = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
        const allToShow = [...baseValues];
        if (!baseValues.includes(minute)) {
          allToShow.push(minute);
        }

        return allToShow.map((val) => {
          const angle = ((val * 6 - 90) * Math.PI) / 180;
          const left = radius + Math.cos(angle) * minuteRadius - 12;
          const top = radius + Math.sin(angle) * minuteRadius - 12;
          const isSelected = minute === val;

          return (
            <View key={`min-${val}`} style={[styles.minNumberWrap, { left, top, zIndex: 9 }]}>
              <Text
                style={[
                  styles.minNumberText,
                  {
                    color: isSelected ? colors.white : colors.grayTitle,
                    opacity: isSelected ? 1 : 0.5,
                    fontFamily: isSelected ? FONTS.Bold : FONTS.Medium,
                  },
                ]}
              >
                {val === 0 ? '00' : String(val).padStart(2, '0')}
              </Text>
            </View>
          );
        });
      })()}

      {/* Center Dot */}
      <View
        style={[
          styles.centerDot,
          { backgroundColor: colors.alarmFocus, left: radius - 5, top: radius - 5 },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  clockFace: {
    alignSelf: 'center',
    position: 'relative',
  },
  numberWrap: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 13,
  },
  handWrapper: {
    position: 'absolute',
    width: 0,
    height: 0,
    justifyContent: 'center',
  },
  handLine: {
    height: 2,
    borderRadius: 1,
    marginTop: -1,
  },
  minuteHandLine: {
    height: 2,
    borderRadius: 1,
    marginTop: -1,
    opacity: 0.8,
  },
  minNumberWrap: {
    position: 'absolute',
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  minNumberText: {
    fontSize: 10,
    fontFamily: FONTS.Medium,
  },
  handTip: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    top: -18,
  },
  handTipSmall: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    top: -12,
  },
  centerDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 10,
  },
});

export default AnalogClock;
