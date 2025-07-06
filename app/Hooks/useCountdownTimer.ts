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
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!endDate) {
      setTimeIsOver(true);
      return;
    }

    const parsedEndDate = endDate instanceof Date ? endDate : new Date(endDate);

    const updateTimer = () => {
      const now = new Date();
      const diff = parsedEndDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setFormattedTimeLeft('00Hrs : 00Min : 00Sec');
        setTimeIsOver(true);

        if (onTimeOver) {
          onTimeOver();
        }

        if (intervalId.current) {
          clearInterval(intervalId.current);
        }
      } else {
        const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
        const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft(
          `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(
            2,
            '0',
          )}:${String(secondsLeft).padStart(2, '0')}`,
        );
        setFormattedTimeLeft(
          `${String(hoursLeft).padStart(2, '0')}Hrs : ${String(minutesLeft).padStart(
            2,
            '0',
          )}Min : ${String(secondsLeft).padStart(2, '0')}Sec`,
        );
      }
    };

    if (intervalId.current) {
      clearInterval(intervalId.current);
    }

    intervalId.current = setInterval(updateTimer, 1000);
    updateTimer();

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [endDate, onTimeOver]);

  return { timeLeft, formattedTimeLeft, timeIsOver };
}
