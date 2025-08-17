// TimerContext.js
import { createContext, useContext, useState } from "react";

const TimerContext = createContext();

export const useTimers = () => useContext(TimerContext);

export const TimerProvider = ({ children }) => {
  const timersCount = 6;
  const [timers, setTimers] = useState(
    Array.from({ length: timersCount }, () => ({
      inputValue: "",
      secondsLeft: 0,
      isRunning: false,
      isFlashing: false,
      intervalRef: null,
      selectedSound: "Sound1.wav",
      audio: new Audio("/sounds/Sound1.wav"),
    }))
  );

  const updateTimer = (index, updates) => {
    setTimers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  };

  // 👇 derived info
  const activeTimers = timers.filter((t) => t.isRunning || t.isFlashing).length;

  // new derived value: running + ringing timers for badge
  const badgeCount = timers.filter((t) => t.isRunning || t.isFlashing).length;

  const stopRingingTimers = () => {
    setTimers((prev) =>
      prev.map((timer) => {
        if (timer.isFlashing) {
          // or isRinging
          timer.audio.pause();
          timer.audio.currentTime = 0;
          return { ...timer, isFlashing: false, isRunning: false };
        }
        return timer;
      })
    );
  };

  return (
    <TimerContext.Provider
      value={{
        timers,
        setTimers,
        updateTimer,
        activeTimers,
        stopRingingTimers, // 👈 add this
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};
