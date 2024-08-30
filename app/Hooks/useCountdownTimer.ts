import { useState, useEffect, useRef } from "react";

interface CountdownTimerHook {
  timeLeft: string;
  formattedTimeLeft: string;
  timeIsOver: boolean;
}

export function useCountdownTimer(
  initialTime: string,
  onTimeOver?: () => void
): CountdownTimerHook {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [formattedTimeLeft, setFormattedTimeLeft] = useState(
    "00Hrs : 00Min : 00Sec"
  );
  const [timeIsOver, setTimeIsOver] = useState(false);
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const timeDifference = getTimeDifference(initialTime);
      setTimeLeft(timeDifference);
      setFormattedTimeLeft(formatTime(timeDifference));

      if (timeDifference === "00:00:00" && intervalId.current) {
        clearInterval(intervalId.current);
        setTimeIsOver(true);

        if (onTimeOver) {
          onTimeOver();
        }
      }
    };

    if (intervalId.current) {
      clearInterval(intervalId.current);
    }

    setTimeIsOver(false);
    intervalId.current = setInterval(updateTimer, 1000);
    updateTimer();

    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [initialTime, onTimeOver]);

  return { timeLeft, formattedTimeLeft, timeIsOver };
}

function getTimeDifference(endTime: string) {
  const [hours, minutes, seconds] = endTime.split(":").map(Number);
  const now = new Date();
  const targetTime = new Date(now);
  targetTime.setHours(hours, minutes, seconds, 0);

  const diff = targetTime.getTime() - now.getTime();

  if (diff <= 0) return "00:00:00";

  const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
  const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((diff % (1000 * 60)) / 1000);

  return `${String(hoursLeft).padStart(2, "0")}:${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;
}

function formatTime(time: string) {
  const [hours, minutes, seconds] = time.split(":");
  return `${hours}Hrs : ${minutes}Min : ${seconds}Sec`;
}
