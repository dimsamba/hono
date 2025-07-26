import { useState, useRef } from "react";
import { Box, Button, Typography, TextField, Grid } from "@mui/material";
import { motion } from "framer-motion";

// Keypad Component
const Keypad = ({ onKeyPress, onBackspace, onEnter }) => {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        padding: 2,
        border: "1px solid #38a3a5",
        borderRadius: "8px",
        boxShadow: 1,
        width: 200,
        mt: 1,
        position: "sticky",
        top: 20,
      }}
    >
      <Grid container spacing={1}>
        {keys.map((key) => (
          <Grid item xs={6} key={key}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => onKeyPress(key)}
              sx={{
                backgroundColor: "#e2ece9",
                border: "1px solid green",
                color: "#555",
                fontWeight: 500,
                fontSize: "30px",
                height: "66px",
              }}
            >
              {key}
            </Button>
          </Grid>
        ))}

        <Grid item xs={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={onBackspace}
            sx={{
              backgroundColor: "#f07167",
              border: "1px solid #032b43",
              color: "white",
              fontWeight: 700,
              fontSize: "30px",
              height: "66px",
            }}
          >
            {"<<"}
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Button
            variant="contained"
            fullWidth
            onClick={onEnter}
            sx={{
              backgroundColor: "#76c893",
              border: "1px solid #032b43",
              color: "white",
              fontWeight: 1000,
              fontSize: "40px",
              height: "66px",
            }}
          >
            ↵
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

// Timer Component
const Timer = ({
  index,
  inputValue,
  secondsLeft,
  isRunning,
  isFlashing,
  onFocus,
  onPause,
  onReset,
}) => {
  const inputRef = useRef(null);
  const isPaused = !isRunning && secondsLeft > 0;
  const isActive = secondsLeft > 0 && !isPaused;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const sharedStyles = {
    "& .MuiInputLabel-root": {
      color: "#38a3a5",
      fontSize: 14,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #38a3a5",
      },
      "&:hover fieldset": {
        borderColor: "darkGreen",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  return (
    <Box
      sx={{
        p: 2,
        my: 1,
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        border: "1px solid #3FA89B",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        <Typography
          sx={{
            fontSize: 38,
            fontWeight: 600,
            color: "#3FA89B",
            mb: 1,
          }}
        >
          {index + 1}
        </Typography>

        <TextField
          inputRef={inputRef}
          label="Set minutes"
          type="text"
          value={inputValue}
          InputProps={{
            readOnly: true,
          }}
          onFocus={() => onFocus(index)}
          sx={{
            ...sharedStyles,
            mb: 2,
            backgroundColor: isRunning ? "#e2ece9" : "#fff",
            borderRadius: "4px",
            transition: "background-color 0.3s ease",
            animation: isFlashing ? "flashBg 1s infinite" : "none",
            "& input": { color: "#777", fontSize: 16 },
          }}
        />

        <Typography
          sx={{
            fontSize: 38,
            fontWeight: 600,
            color: isActive ? "#f07167" : "#38a3a5", // ← switch color when active
            textAlign: "center",
            mb: 2,
          }}
        >
          {formatTime(secondsLeft)}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
        {/* <Button
          variant="contained"
          onClick={() => onStart(index)} 
          disabled={isRunning || secondsLeft <= 0}
          sx={{ backgroundColor: "#3FA89B", flex: 1 }}
        >
          Start
        </Button> */}
        <Button
          variant="outlined"
          onClick={() => onPause(index)}
          disabled={!isRunning}
          sx={{
            flex: 1,
            color: "#0081a7",
            border: "2px solid #0081a7",
            fontWeight: 700,
          }}
        >
          Pause
        </Button>
        <Button
          variant="outlined"
          onClick={() => onReset(index)}
          sx={{
            flex: 1,
            color: "#e36414",
            border: "2px solid #e36414",
            fontWeight: 700,
          }}
        >
          {isFlashing ? "Stop" : "Reset"} {/* ✅ Use the prop instead */}
        </Button>
      </Box>
    </Box>
  );
};

// Main Page
const TimerPage = () => {
  const timersCount = 6;
  const [timers, setTimers] = useState(
    Array.from({ length: timersCount }, () => ({
      inputValue: "",
      secondsLeft: 0,
      isRunning: false,
      isFlashing: false,
      intervalRef: null,
      audio: new Audio("/sounds/sound1.wav"),
    }))
  );

  const [focusedIndex, setFocusedIndex] = useState(null);

  const updateTimer = (index, updates) => {
    setTimers((prev) =>
      prev.map((t, i) => (i === index ? { ...t, ...updates } : t))
    );
  };

  const handleKeypadInput = (key) => {
    if (focusedIndex === null) return;
    const timer = timers[focusedIndex];
    const newValue = timer.inputValue + key;
    const minutes = parseInt(newValue);
    updateTimer(focusedIndex, {
      inputValue: newValue,
      secondsLeft: isNaN(minutes) ? 0 : minutes * 60,
    });
  };

  const handleBackspace = () => {
    if (focusedIndex === null) return;
    const timer = timers[focusedIndex];
    const newValue = timer.inputValue.slice(0, -1);
    const minutes = parseInt(newValue);
    updateTimer(focusedIndex, {
      inputValue: newValue,
      secondsLeft: isNaN(minutes) ? 0 : minutes * 60,
    });
  };

  const handleEnter = () => {
    if (focusedIndex !== null) handleStart(focusedIndex);
  };

  const handleStart = (index) => {
    const timer = timers[index];
    if (timer.secondsLeft <= 0 || timer.isRunning) return;

    const audio = timer.audio;
    audio.loop = true; // Set loop before play

    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = [...prev];
        const t = newTimers[index];

        if (t.secondsLeft <= 1) {
          clearInterval(t.intervalRef);
          t.isRunning = false;
          t.isFlashing = true; // Timer finished, audio is playing
          t.secondsLeft = 0;

          // Play looping sound
          t.audio.loop = true;
          t.audio.currentTime = 0;
          t.audio.play().catch(console.error);
        } else {
          t.secondsLeft -= 1;
        }

        return newTimers;
      });
    }, 1000);

    updateTimer(index, {
      isRunning: true,
      intervalRef: interval,
    });
  };

  const handlePause = (index) => {
    clearInterval(timers[index].intervalRef);
    updateTimer(index, { isRunning: false });
  };

  const handleReset = (index) => {
    clearInterval(timers[index].intervalRef);

    const audio = timers[index].audio;
    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;

    updateTimer(index, {
      inputValue: "",
      secondsLeft: 0,
      isRunning: false,
      isFlashing: false, // Reset state to no flashing
    });
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-100">
      <main className="max-w-7xl">
        <Box sx={{ px: 1, pt: 3 }}>
          <Typography
            variant="h6"
            sx={{
              color: "#3FA89B",
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            MULTI-TIMER
          </Typography>

          <Box sx={{ display: "flex", gap: 3 }}>
            <Box className="KeyPad">
              <Keypad
                onKeyPress={handleKeypadInput}
                onBackspace={handleBackspace}
                onEnter={handleEnter}
              />
            </Box>

            <Box className="Timers" sx={{ flex: 1 }}>
              <motion.div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-2">
                {timers.map((timer, i) => (
                  <Timer
                    key={i}
                    index={i}
                    inputValue={timer.inputValue}
                    secondsLeft={timer.secondsLeft}
                    isRunning={timer.isRunning}
                    isFlashing={timer.isFlashing}
                    onFocus={setFocusedIndex}
                    onPause={handlePause}
                    onReset={handleReset}
                    onStart={handleStart}
                  />
                ))}
              </motion.div>
            </Box>
          </Box>
        </Box>
      </main>
    </div>
  );
};

export default TimerPage;
