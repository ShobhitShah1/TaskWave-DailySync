import { useEffect, useRef, useState } from 'react';

interface CountdownTimerHook {
  timeLeft: string;
  formattedTimeLeft: string;
  timeIsOver: boolean;
}

export function useCountdownTimer(
  endDate: Date | string | undefined | null,
  onTimeOver?: () => void,
): CountdownTimerHook {
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [formattedTimeLeft, setFormattedTimeLeft] = useState('00Hrs : 00Min : 00Sec');
  const [timeIsOver, setTimeIsOver] = useState(false);
  const intervalId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!endDate) {
      setTimeIsOver(true);
      return;
    }

    const parsedEndDate = endDate instanceof Date ? endDate : new Date(endDate);

    const updateTimer = () => {
      const diff = parsedEndDate.getTime() - Date.now();

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setFormattedTimeLeft('00Hrs : 00Min : 00Sec');
        setTimeIsOver(true);
        onTimeOver?.();

        if (intervalId.current) {
          clearInterval(intervalId.current);
        }
        return;
      }

      const totalSeconds = Math.ceil(diff / 1000);
      const hoursLeft = Math.floor(totalSeconds / 3600);
      const minutesLeft = Math.floor((totalSeconds % 3600) / 60);
      const secondsLeft = totalSeconds % 60;

      setTimeLeft(
        `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(
          secondsLeft,
        ).padStart(2, '0')}`,
      );
      setFormattedTimeLeft(
        `${String(hoursLeft).padStart(2, '0')}Hrs : ${String(minutesLeft).padStart(
          2,
          '0',
        )}Min : ${String(secondsLeft).padStart(2, '0')}Sec`,
      );
      setTimeIsOver(false);
    };

    if (intervalId.current) {
      clearInterval(intervalId.current);
    }

    updateTimer();
    intervalId.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [endDate, onTimeOver]);

  return { timeLeft, formattedTimeLeft, timeIsOver };
}
