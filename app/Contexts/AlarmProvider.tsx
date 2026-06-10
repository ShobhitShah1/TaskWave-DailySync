import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { NativeModules, AppState } from 'react-native';
import notifee, { EventType } from '@notifee/react-native';
import { handleAlarmEvent } from '@Services/AlarmProcessor';
import { navigationRef } from '@Routes/RootNavigation';

interface AlarmContextType {
  activeAlarm: any | null;
  setActiveAlarm: (alarm: any | null) => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlarm, setActiveAlarm] = useState<any | null>(null);
  const checkingNativeActionRef = useRef(false);

  useEffect(() => {
    const openGroupResponse = (alarmId: string, attempt = 0) => {
      if (navigationRef.isReady()) {
        navigationRef.navigate('AlarmVoiceResponse', { alarmId });
        return;
      }

      if (attempt < 20) {
        setTimeout(() => openGroupResponse(alarmId, attempt + 1), 250);
      }
    };

    // Listen for foreground alarm events and delegate to AlarmProcessor
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (
        detail.notification?.data?.kind === 'alarm' ||
        detail.notification?.data?.kind === 'alarm-invitation'
      ) {
        // AlarmProcessor handles DELIVERED (launches native), DISMISSED (cleanup), ACTION_PRESS
        await handleAlarmEvent(type, detail);
        // Do NOT show LiveAlarmOverlay — native AlarmActivity handles the UI
      }
    });

    // Check for native alarm actions (from AlarmActivity dismiss/snooze)
    const checkNativeAction = async () => {
      if (checkingNativeActionRef.current) {
        return;
      }
      checkingNativeActionRef.current = true;

      try {
        if (NativeModules.AlarmLauncher?.getInitialAction) {
          const result = await NativeModules.AlarmLauncher.getInitialAction();
          if (result && result.action) {
            console.log(
              `[AlarmProvider] Native action received: ${result.action} for ${result.alarmId}, notes: ${result.alarmNotes}`,
            );
            console.log(`[AlarmProvider] Full result: ${JSON.stringify(result, null, 2)}`);

            // Skip show-alarm — native AlarmActivity is already handling the UI
            if (result.action === 'show-alarm') {
              return;
            }

            // Construct a fake Notifee detail object to reuse handleAlarmEvent
            const detail = {
              notification: {
                id: result.alarmId,
                title: result.title,
                body: result.body,
                data: {
                  kind: 'alarm',
                  alarmId: result.alarmId,
                  mode: result.mode || 'solo',
                  title: result.title || 'Alarm',
                  body: result.body || 'Wake up!',
                  tone: result.tone || 'default',
                  bufferMinutes: result.bufferMinutes || '5',
                  alarmNotes: result.alarmNotes || '[]',
                  snoozeNoteIndex: result.snoozeNoteIndex || '0',
                },
              } as any,
              pressAction: { id: result.action },
            };

            await handleAlarmEvent(EventType.ACTION_PRESS, detail);

            if (result.action === 'dismiss-alarm' && result.mode === 'group' && result.alarmId) {
              openGroupResponse(result.alarmId);
            }
          }
        }
      } finally {
        checkingNativeActionRef.current = false;
      }
    };

    checkNativeAction();

    const appStateListener = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkNativeAction();
      }
    });

    return () => {
      unsubscribe();
      appStateListener.remove();
    };
  }, []);

  return (
    <AlarmContext.Provider value={{ activeAlarm, setActiveAlarm }}>
      {children}
    </AlarmContext.Provider>
  );
};

export const useAlarmContext = () => {
  const context = useContext(AlarmContext);
  if (!context) {
    throw new Error('useAlarmContext must be used within an AlarmProvider');
  }
  return context;
};
