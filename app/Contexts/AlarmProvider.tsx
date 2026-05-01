import React, { createContext, useContext, useState, useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';
import { handleAlarmEvent } from '@Services/AlarmProcessor';

interface AlarmContextType {
  activeAlarm: any | null;
  setActiveAlarm: (alarm: any | null) => void;
}

const AlarmContext = createContext<AlarmContextType | undefined>(undefined);

export const AlarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeAlarm, setActiveAlarm] = useState<any | null>(null);

  useEffect(() => {
    // Background events are handled in App.tsx but we can also listen here
    const unsubscribe = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (detail.notification?.data?.kind === 'alarm') {
        await handleAlarmEvent(type, detail);
        
        if (type === EventType.PRESS || type === EventType.DELIVERED) {
          setActiveAlarm({
            ...detail.notification.data,
            localNotificationId: detail.notification.id,
            title: detail.notification.title,
            body: detail.notification.body,
          });
        }
      }
    });

    // Check initial notification (cold start)
    notifee.getInitialNotification().then((initial) => {
      if (initial?.notification?.data?.kind === 'alarm') {
        setActiveAlarm({
          ...initial.notification.data,
          localNotificationId: initial.notification.id,
          title: initial.notification.title,
          body: initial.notification.body,
        });
      }
    });

    return unsubscribe;
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
