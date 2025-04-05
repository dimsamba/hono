import { IconButton, TextField } from "@mui/material";
import React, { useState } from "react";
import ClearIcon from "@mui/icons-material/HighlightOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { motion } from "framer-motion";

const translationMap = {
  a: "g",
  e: "d",
  i: "r",
  o: "p",
  u: "l",
  y: "t",
  g: "a",
  d: "e",
  r: "i",
  p: "o",
  l: "u",
  t: "y",
};

const convertText = (text) => {
  let convertedText = "";
  let i = 0;
  while (i < text.length) {
    let ch = text[i];
    let translatedChar = translationMap[ch.toLowerCase()] || ch;
    if (ch === ch.toUpperCase()) {
      translatedChar = translatedChar.toUpperCase();
    }
    // Special case for "**" ↔ "20"
    if (text.substring(i, i + 2) === "**") {
      convertedText += "20";
      i += 1;
    } else if (text.substring(i, i + 2) === "20") {
      convertedText += "**";
      i += 1;
    } else {
      convertedText += translatedChar;
    }
    i++;
  }
  return convertedText;
};

const TestPage = () => {
  const [value, setValue] = useState("Insert text");
  const [converted, setConverted] = useState("");

  const handleInputChange = (event) => {
    const inputValue = event.target.value;
    setValue(inputValue);
    setConverted(convertText(inputValue));
  };

  const handleClearClick = () => {
    setValue("");
    setConverted("");
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(converted);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="flex flex-col sm:flex-row items-center gap-0 mb-8 ml-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <TextField
            fullWidth
            value={value}
            onChange={handleInputChange}
            variant="outlined"
            onClick={handleClearClick}
            name="encryptedText"
            error={false} // Prevent red underline
            helperText="" // Remove any error messages
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={handleClearClick}
                    sx={{
                      color: "#ADD8E6",
                      visibility: value ? "visible" : "hidden",
                    }}
                  >
                    <ClearIcon />
                  </IconButton>
                ),
              },
            }}
            sx={{
              m: 2,
              input: { color: "#ADD8E6" },
              backgroundColor: "#384152",
              borderRadius: "20px",
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderRadius: "20px",
                },
                "&:hover fieldset": {
                  borderColor: "#8B5CF6", // Darker border on hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#A9A9A9 ", // Focus color
                },
              },
              "& .MuiFormLabel-root": {
                color: "#8B5CF6", // Custom label color
              },
            }}
          />
          <TextField
            fullWidth
            value={converted}
            variant="outlined"
            name="convertedText"
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={() => {
                      handleCopyClick();
                      alert("Text copied successfully!");
                    }}
                    sx={{
                      color: "#ADD8E6",
                      visibility: converted ? "visible" : "hidden",
                    }}
                  >
                    <ContentCopyIcon />
                  </IconButton>
                ),
              },
            }}
            sx={{
              m: 2,
              input: { color: "#ADD8E6" },
              backgroundColor: "#384152",
              borderRadius: "20px",
              "& .MuiInputBase-root": {
                //  backgroundColor: "#f0f0f0", // Light gray background
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  //  borderColor: "lightGray", // Custom border color
                  borderRadius: "20px",
                },
                "&:hover fieldset": {
                  borderColor: "#8B5CF6", // Darker border on hover
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#A9A9A9 ", // Focus color
                },
              },
              "& .MuiFormLabel-root": {
                color: "#8B5CF6", // Custom label color
              },
            }}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default TestPage;
