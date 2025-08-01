import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ClearIcon from "@mui/icons-material/HighlightOff";
import { IconButton, TextField } from "@mui/material";
import { useState } from "react";

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
  // TextField and InputLabel customizations
  const sharedStyles = {
    backgroundColor: "#ebf1fa",
    "& .MuiInputLabel-root": {
      color: "#007f5f",
      fontSize: 16,
      backgroundColor: "#ebf1fa",
      px: 1,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #60d394",
      },
      "&:hover fieldset": {
        borderColor: "#60d394",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-4xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <div
          className="bg-gray-100 p-6 pr-10 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-xl border border-gray-300"
          style={{
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            border: "1px solid #3FA89B",
          }}
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
              ...sharedStyles,
              m: 1,
              input: { color: "#003049", fontSize: "20px" },
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
              ...sharedStyles,
              m: 1,
              input: { color: "#003049", fontSize: "20px" },
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default TestPage;
