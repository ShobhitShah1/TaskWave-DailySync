import { useEffect, useRef, useState } from "react";

interface CountdownTimerHook {
  timeLeft: string;
  formattedTimeLeft: string;
  timeIsOver: boolean;
}

export function useCountdownTimer(
  initialTime: string,
  onTimeOver?: () => void
): CountdownTimerHook {
  const [timeLeft, setTimeLeft] = useState("00:00:00");
  const [formattedTimeLeft, setFormattedTimeLeft] = useState(
    "00Hrs : 00Min : 00Sec"
  );
  const [timeIsOver, setTimeIsOver] = useState(false);
  const intervalId = useRef<NodeJS.Timeout | null>(null);
  const endTime = useRef<Date>(calculateEndTime(initialTime));

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const diff = endTime.current.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setFormattedTimeLeft("00Hrs : 00Min : 00Sec");
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
          `${String(hoursLeft).padStart(2, "0")}:${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`
        );
        setFormattedTimeLeft(
          `${String(hoursLeft).padStart(2, "0")}Hrs : ${String(minutesLeft).padStart(2, "0")}Min : ${String(secondsLeft).padStart(2, "0")}Sec`
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
  }, [initialTime, onTimeOver]);

  return { timeLeft, formattedTimeLeft, timeIsOver };
}

function calculateEndTime(initialTime: string): Date {
  const [hours, minutes, seconds] = initialTime.split(":").map(Number);
  const now = new Date();

  return new Date(
    now.getTime() + (hours * 3600 + minutes * 60 + seconds) * 1000
  );
}
