import { Box, useTheme } from "@mui/material";
import { tokens } from "../theme";

const ProgressCircle = ({ progress = "0.75", size = "45" }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const angle = progress * 360;
  return (
      <Box
        sx={{
          background: `radial-gradient(#f3f4f6 40%, transparent 50%),
              conic-gradient(transparent 0deg ${angle}deg, ${colors.greenAccent[400]} ${angle}deg 360deg),
              ${colors.color="#F66F6F"}`, 
          borderRadius: "50%",
          width: `${size}px`,
          height: `${size}px`,
          mr: 1.5
        }}
      />
  );
};

export default ProgressCircle;