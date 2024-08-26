import { useState, useCallback, useRef, useEffect } from "react";

export function useCountdownTimer(initialTime: string) {
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const intervalId = useRef<NodeJS.Timeout | null>(null);

  const startCountdown = useCallback((endTime: string) => {
    const updateTimer = () => {
      const timeDifference = getTimeDifference(endTime);
      setTimeLeft(timeDifference);

      if (timeDifference === "00:00:00" && intervalId.current) {
        clearInterval(intervalId.current);
      }
    };

    if (intervalId.current) {
      clearInterval(intervalId.current);
    }

    intervalId.current = setInterval(updateTimer, 1000);
    updateTimer();
  }, []);

  useEffect(() => {
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, []);

  return { timeLeft, startCountdown };
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
