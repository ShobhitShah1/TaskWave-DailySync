import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import notifee, { EventType } from '@notifee/react-native';
import { handleAlarmEvent } from '@Services/AlarmProcessor';
import AssetsPath from '@Constants/AssetsPath';
import { FONTS } from '@Constants/Theme';
import useThemeColors from '@Hooks/useThemeMode';

interface LiveAlarmOverlayProps {
  alarm: any;
  onClose: () => void;
}

const LiveAlarmOverlay: React.FC<LiveAlarmOverlayProps> = ({ alarm, onClose }) => {
  const colors = useThemeColors();
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    setIsClosing(false);
  }, [alarm]);

  const handleDismiss = async () => {
    if (isClosing) return;
    setIsClosing(true);
    if (alarm.localNotificationId) {
      await notifee.cancelNotification(alarm.localNotificationId);
    }
    await handleAlarmEvent(EventType.ACTION_PRESS, {
      notification: {
        id: alarm.localNotificationId || alarm.alarmId || alarm.id,
        title: alarm.title || 'Alarm',
        body: alarm.body || alarm.note || 'Wake up!',
        data: {
          kind: 'alarm',
          alarmId: alarm.alarmId || alarm.id,
          mode: alarm.mode || 'solo',
          title: alarm.title || 'Alarm',
          body: alarm.body || alarm.note || 'Wake up!',
          tone: alarm.tone || 'default',
          bufferMinutes: (alarm.bufferMinutes || 5).toString(),
        },
      } as any,
      pressAction: { id: 'dismiss-alarm' },
    });
    onClose();
  };

  const handleSnooze = async () => {
    if (isClosing) return;
    setIsClosing(true);
    if (alarm.localNotificationId) {
      await notifee.cancelNotification(alarm.localNotificationId);
    }
    await handleAlarmEvent(EventType.ACTION_PRESS, {
      notification: {
        id: alarm.localNotificationId || alarm.alarmId || alarm.id,
        title: alarm.title || 'Alarm',
        body: alarm.body || alarm.note || 'Wake up!',
        data: {
          kind: 'alarm',
          alarmId: alarm.alarmId || alarm.id,
          mode: alarm.mode || 'solo',
          title: alarm.title || 'Alarm',
          body: alarm.body || alarm.note || 'Wake up!',
          tone: alarm.tone || 'default',
          bufferMinutes: (alarm.bufferMinutes || 5).toString(),
        },
      } as any,
      pressAction: { id: 'snooze-alarm' },
    });
    onClose();
  };

  if (!alarm) return null;

  const hour = alarm.hour || '12';
  const minute = String(alarm.minute || '00').padStart(2, '0');
  const meridiem = alarm.meridiem || 'AM';
  const title = alarm.title || 'Alarm';
  const note = alarm.note || alarm.body || 'Wake up!';

  return (
    <Modal visible={!!alarm} animationType="slide" transparent={false} statusBarTranslucent>
      <SafeAreaView style={[styles.activeContainer, { backgroundColor: colors.alarmFocus }]}>
        <View style={styles.activeInner}>
          <View style={styles.activeHeader}>
            <Image
              source={AssetsPath.ic_fillAlarm}
              style={styles.activeLargeIcon}
              tintColor={colors.white}
            />
            <Text style={styles.activeTitle}>{title}</Text>
            <Text style={styles.activeTime}>
              {hour}:{minute}
              <Text style={styles.activeMeridiem}>{meridiem}</Text>
            </Text>
          </View>

          <View style={styles.activeNoteBox}>
            <Text style={styles.activeNoteText}>{note}</Text>
          </View>

          <View style={styles.activeActions}>
            <Pressable onPress={handleSnooze} style={[styles.activeBtn, styles.snoozeBtn]}>
              <Text style={styles.activeBtnText}>SNOOZE</Text>
              <Text style={styles.snoozeSubtext}>{alarm.bufferMinutes || 5} minutes</Text>
            </Pressable>

            <Pressable onPress={handleDismiss} style={[styles.activeBtn, styles.dismissBtn]}>
              <Text style={[styles.activeBtnText, { color: colors.alarmFocus }]}>DISMISS</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  activeContainer: {
    flex: 1,
  },
  activeInner: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  activeHeader: {
    alignItems: 'center',
  },
  activeLargeIcon: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  activeTitle: {
    fontSize: 28,
    fontFamily: FONTS.Bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activeTime: {
    fontSize: 84,
    fontFamily: FONTS.Bold,
    color: '#FFFFFF',
    marginTop: 10,
  },
  activeMeridiem: {
    fontSize: 32,
    fontFamily: FONTS.Medium,
  },
  activeNoteBox: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    width: '100%',
  },
  activeNoteText: {
    color: '#FFFFFF',
    fontSize: 20,
    textAlign: 'center',
    fontFamily: FONTS.Medium,
    lineHeight: 28,
  },
  activeActions: {
    width: '100%',
    gap: 20,
  },
  activeBtn: {
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  snoozeBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dismissBtn: {
    backgroundColor: '#FFFFFF',
  },
  activeBtnText: {
    fontSize: 24,
    fontFamily: FONTS.Bold,
  },
  snoozeSubtext: {
    fontSize: 12,
    fontFamily: FONTS.Medium,
    color: '#FFFFFF',
    opacity: 0.8,
  },
});

export default LiveAlarmOverlay;
