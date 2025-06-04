import { motion } from "framer-motion";
import { IconButton, TextField } from "@mui/material";
import { useState } from "react";
import ClearIcon from "@mui/icons-material/HighlightOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

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

  const handleResetText = () => {
    setValue("Insert Text");
    setConverted("");
  };

  const handleCopyClick = () => {
    navigator.clipboard.writeText(converted);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-4xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* STATS */}
          <div className="bg-gray-100 p-6 pr-10 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-xl border border-gray-300">
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
                      onClick={() => {
                        handleClearClick();
                        handleResetText();
                      }}
                      sx={{
                        color: "#457b9d",
                        visibility: value ? "visible" : "hidden",
                      }}
                    >
                      <ClearIcon />
                    </IconButton>
                  ),
                },
              }}
              sx={{
                m: 1,
                input: { color: "#003049", fontSize: "20px" },
                backgroundColor: "#edf2f4",
                borderRadius: "10px",
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderRadius: "10px",
                  },
                  "&:hover fieldset": {
                    borderColor: "#457b9d", // Darker border on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#457b9d ", // Focus color
                  },
                },
                "& .MuiFormLabel-root": {
                  color: "#003049", // Custom label color
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
                        handleResetText();
                      }}
                      sx={{
                        color: "#457b9d",
                        visibility: converted ? "visible" : "hidden",
                      }}
                    >
                      <ContentCopyIcon />
                    </IconButton>
                  ),
                },
              }}
              sx={{
                m: 1,
                input: { color: "#003049", fontSize: "20px" },
                backgroundColor: "#edf2f4",
                borderRadius: "10px",

                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderRadius: "10px",
                  },
                  "&:hover fieldset": {
                    borderColor: "#d8e2dc", // Darker border on hover
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "#d8e2dc ", // Focus color
                  },
                },
                "& .MuiFormLabel-root": {
                  color: "#003049", // Custom label color
                },
              }}
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TestPage;
