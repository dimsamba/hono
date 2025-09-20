import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  GlobalStyles,
  Modal,
  Dialog,
  DialogContent,
} from "@mui/material";
import { motion } from "framer-motion";
import { useTimers } from "../components/TimerContext";

const soundLabels = {
  "Alarm1.wav": "Alarm 1",
  "Alarm2.wav": "Alarm 2",
  "Alarm3.wav": "Alarm 3",
  "Alarm4.wav": "Alarm 4",
  "Alarm5.mp3": "Alarm 5",
  "Alarm6.wav": "Alarm 6",
  "Alarm7.mp3": "Alarm 7",
  "Alien1.wav": "Alien 1",
  "Alien2.wav": "Alien 2",
  "Alien3.mp3": "Alien 3",
  "Alien4.wav": "Alien 4",
  "Alien5.mp3": "Alien 5",
  "Bird.mp3": "Bird",
  "Morse-code1.mp3": "Morse Code 1",
  "Morse-code2.mp3": "Morse Code 2",
  "Morse-code3.mp3": "Morse Code 3",
  "Music-box1.mp3": "Music Box 1",
  "Music-box2.mp3": "Music Box 2",
  "Siren1.mp3": "Siren 1",
  "Sound1.wav": "Sound 1",
  "Sound2.wav": "Sound 2",
  "Sound3.wav": "Sound 3",
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
  selectedSound,
  onSoundChange,
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
        my: 1,
        mt: 1.1,
        mr: 2,
        backgroundColor: "#f5f5f5",
        borderRadius: "8px",
        border: "1px solid #3FA89B",
        boxShadow: "0 1px 1px rgba(0, 0, 0, 0.2)",
        border: isActive ? "1px solid #f07167" : " 1px solid #3FA89B",
        animation: isFlashing ? "flashBg 1s infinite" : "none",
        backgroundColor: isRunning ? "#ebf2fa" : "#fff",
      }}
    >
      <Typography
        sx={{
          height: 35,
          width: 35,
          ml: -2,
          mt: -2,
          lineHeight: "35px",
          fontSize: 25,
          fontWeight: 300,
          color: "white",
          textAlign: "center",
          border: `1px solid #427aa1`,
          borderRadius: "25px",
          backgroundColor: "#38a3a5",
        }}
      >
        {index + 1}
      </Typography>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          ml: 2,
          pr: 2,
        }}
      >
        <TextField
          inputRef={inputRef}
          label="Set Time"
          type="text"
          value={inputValue}
          InputProps={{ readOnly: true }}
          onFocus={() => onFocus(index)}
          onClick={() => onFocus(index)} // 👈 allow reopening on click
          sx={{
            ...sharedStyles,
            mb: 2,
            backgroundColor: isRunning ? "#e2ece9" : "#fff",
            borderRadius: "4px",
            transition: "background-color 0.3s ease",
            animation: isFlashing ? "flashBg 1s infinite" : "none",
            "& input": {
              color: "#f07167",
              fontSize: 28,
              fontWeight: 400,
              color: isActive ? "#f07167" : "#38a3a5",
            },
            // Change background and border when focused
            "& .MuiOutlinedInput-root.Mui-focused": {
              backgroundColor: "#fff0f0", // example color
              "& fieldset": {
                borderColor: "red",
                borderWidth: 2,
              },
            },
            "&.Mui-focused": {
              backgroundColor: isRunning ? "#fff0f0" : "#fff", // keep same bg
              "& fieldset": {
                borderColor: "red", // keep same border color
                borderWidth: 2, // increase thickness on focus
              },
            },
          }}
        />

        <Typography
          sx={{
            fontSize: 38,
            fontWeight: 600,
            color: isActive ? "#f07167" : "#38a3a5",
            textAlign: "center",
            mt: 1,
          }}
        >
          {formatTime(secondsLeft)}
        </Typography>
      </Box>

      <GlobalStyles
        styles={{
          "& .MuiMenu-paper": {
            backgroundColor: "white !important",
            color: "#577590 !important",
          },
        }}
      />
      {/* Sound Dropdown Selector */}
      <FormControl
        fullWidth
        size="small"
        sx={{ mb: 2, ...sharedStyles, px: 2 }}
      >
        <InputLabel
          id={`sound-select-label-${index}`}
          sx={{
            color: "#38a3a5",
            fontSize: 14,
            ml: 2.5,
          }}
        >
          Alarm Sound
        </InputLabel>
        <Select
          labelId={`sound-select-label-${index}`}
          value={selectedSound}
          label="Alarm Sound"
          onChange={(e) => onSoundChange(index, e.target.value)}
          sx={{ fontSize: 16, color: "#415a77", fontWeight: 500 }}
        >
          {Object.keys(soundLabels).map((file) => (
            <MenuItem
              key={file}
              value={file}
              sx={{
                "&:hover": {
                  ...sharedStyles,
                  backgroundColor: "#f0f0f0",
                },
              }}
            >
              {soundLabels[file]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          gap: 1,
          mx: 2,
          mb: 1.5,
        }}
      >
        <Button
          variant="outlined"
          onClick={() => onPause(index)}
          disabled={!isRunning}
          sx={{
            flex: 1,
            color: "#0081a7",
            border: "1px solid #0081a7",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "#e2ece9",
            },
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
            border: "1px solid #e36414",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "#e2ece9",
            },
          }}
        >
          {isFlashing ? "Stop" : "Reset"}
        </Button>
      </Box>
    </Box>
  );
};

// Main Page
const TimerPage = () => {
  const { timers, setTimers, updateTimer } = useTimers();
  const [activeTimerIndex, setActiveTimerIndex] = useState(null);
  const [openKeypad, setOpenKeypad] = useState(false);
  const [ignoreNextFocus, setIgnoreNextFocus] = useState(false);

  const handleOpenKeypad = (index) => {
    if (ignoreNextFocus) {
      setIgnoreNextFocus(false);
      return;
    }
    setActiveTimerIndex(index);
    setOpenKeypad(true);
  };

  const handleCloseKeypad = () => {
    setIgnoreNextFocus(true); // prevent immediate re-open
    const activeEl = document.activeElement;
    if (activeEl && activeEl.blur) activeEl.blur();
    setOpenKeypad(false);
    setActiveTimerIndex(null);
  };

  const handleSoundChange = (index, soundFile) => {
    const audio = new Audio(`/sounds/${soundFile}`);
    updateTimer(index, {
      selectedSound: soundFile,
      audio,
    });
  };

  const handleKeypadInput = (key) => {
    if (activeTimerIndex === null) return;
    const timer = timers[activeTimerIndex];
    const newValue = timer.inputValue + key;
    const minutes = parseInt(newValue);
    updateTimer(activeTimerIndex, {
      inputValue: newValue,
      secondsLeft: isNaN(minutes) ? 0 : minutes * 60,
    });
  };

  const handleBackspace = () => {
    if (activeTimerIndex === null) return;
    const timer = timers[activeTimerIndex];
    const newValue = timer.inputValue.slice(0, -1);
    const minutes = parseInt(newValue);
    updateTimer(activeTimerIndex, {
      inputValue: newValue,
      secondsLeft: isNaN(minutes) ? 0 : minutes * 60,
    });
  };

  const handleEnter = () => {
    if (activeTimerIndex !== null) {
      handleStart(activeTimerIndex);
      handleCloseKeypad();
    }
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

  // Keypad Component
  const Keypad = ({ value, onKeyPress, onBackspace, onEnter, onClose }) => {
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

    return (
      <Box
        sx={{
          display: "flex",
          width: 300,
          p: 2,
          backgroundColor: "#f5f5f5",
          borderRadius: 2,
          border: "2px solid #38a3a5",
          backgroundColor: "#f5f5f5",
        }}
      >
        <Grid container spacing={1}>
          {/* Display the current value */}
          <Grid item xs={12}>
            <TextField
              type="text"
              value={value} // 👈 controlled by parent
              InputProps={{ readOnly: true }}
              fullWidth
              sx={{
                ...sharedStyles,
                "& .MuiInputBase-input": {
                  color: "#38a3a5", // 👈 change text color
                  fontSize: 28, // optional
                  fontWeight: 500, // optional
                  textAlign: "center",
                },
              }}
            />
          </Grid>

          {/* Key buttons */}
          {keys.map((key) => (
            <Grid item xs={4} key={key}>
              <Button
                type="button"
                variant="contained"
                fullWidth
                onClick={() => onKeyPress(key)}
                sx={{
                  backgroundColor: "#f5f5f5",
                  color: "#38a3a5",
                  fontSize: 30,
                  height: 61.5,
                }}
              >
                {key}
              </Button>
            </Grid>
          ))}

          {/* Backspace */}
          <Grid item xs={4}>
            <Button
              type="button"
              variant="contained"
              fullWidth
              onClick={onBackspace}
              sx={{
                backgroundColor: "#f07167",
                border: "1px solid #111",
                color: "white",
                fontSize: 30,
                height: 63,
              }}
            >
              {"<<"}
            </Button>
          </Grid>

          {/* Enter */}
          <Grid item xs={4}>
            <Button
              type="button"
              variant="contained"
              fullWidth
              onClick={onEnter}
              sx={{
                backgroundColor: "#76c893",
                border: "1px solid #111",
                color: "white",
                fontSize: 40,
                height: 63,
              }}
            >
              ↵
            </Button>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const handleStart = (index) => {
    const timer = timers[index];
    if (timer.secondsLeft <= 0 || timer.isRunning) return;

    const audio = timer.audio;
    audio.loop = true;

    const interval = setInterval(() => {
      setTimers((prev) => {
        const newTimers = [...prev];
        const t = newTimers[index];

        if (t.secondsLeft <= 1) {
          clearInterval(t.intervalRef);
          t.isRunning = false;
          t.isFlashing = true;
          t.secondsLeft = 0;
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
      isFlashing: false,
    });
  };

  return (
    <div className="flex-1 overflow-auto relative z-10 bg-gray-100">
      <main className="max-w-7xl mx-auto">
        <h3 className="text-base mb-4 ml-1 text-[#3FA89B] font-bold">
          MULTI-TIMER
        </h3>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 3,
            //  backgroundColor: "orange !important",
            ml: 2,
          }}
        >
          {/* Timers stay always visible */}
          <Box className="Timers" sx={{ flex: 1 }}>
            <motion.div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {timers.map((timer, i) => (
                <Timer
                  key={i}
                  index={i}
                  inputValue={timer.inputValue}
                  secondsLeft={timer.secondsLeft}
                  isRunning={timer.isRunning}
                  isFlashing={timer.isFlashing}
                  onFocus={() => handleOpenKeypad(i)} // ✅ pass index
                  onPause={handlePause}
                  onReset={handleReset}
                  selectedSound={timer.selectedSound}
                  onSoundChange={handleSoundChange}
                />
              ))}
            </motion.div>
          </Box>

          {/* Keypad Dialog */}
          <Dialog
            open={openKeypad}
            onClose={handleCloseKeypad}
            BackdropProps={{
              style: { backgroundColor: "transparent", }, // 👈 remove black overlay
            }}
          >
            <DialogContent
              sx={{
                p: 0,
                backgroundColor: "#f5f5f5" 
              }}
            >
              <Keypad
                value={timers[activeTimerIndex]?.inputValue || ""} // 👈 pass value
                onKeyPress={handleKeypadInput}
                onBackspace={handleBackspace}
                onEnter={handleEnter}
                onClose={handleCloseKeypad}
                disableEnforceFocus={false}
              />
            </DialogContent>
          </Dialog>
        </Box>
      </main>
    </div>
  );
};

export default TimerPage;
