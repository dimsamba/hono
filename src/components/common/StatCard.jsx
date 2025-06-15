import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import ProgressCircle from "./ProgressCircle";

const StatCard = ({
  value,
  title,
  icon,
  progress,
  increase,
  subtitle,
  subtitle2,
  subtitleRed,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <div className="flex justify-between px-1 py-2 sm:p-6 border-2 border-gray-300 rounded-lg">
      <Box
        width="100%"
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        {/* Left Side: Icon, Title, Value, Subtitle */}
        <Box
          display="flex"
          flexDirection="column"
          gap="6px"
          sx={{
            pl: {
              xs: "10px", // applies on extra-small screens and up
              sm: 0, // removes padding on small screens and up
            },
          }}
        >
          <Box display="flex" alignItems="center" gap="8px">
            <Box>{icon}</Box>
            <Typography
              variant="h5"
              sx={{ color: "#3FA89B", fontWeight: "bold" }}
            >
              {title}
            </Typography>
          </Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: colors.orange[500] }}
          >
            {value}
          </Typography>
          <Typography variant="h5" sx={{ color: colors.grey[600] }}>
            {subtitle}
          </Typography>
          <Typography variant="h5" sx={{ color: colors.grey[600] }}>
            {subtitle2}
          </Typography>
          <Typography variant="h5" sx={{ color: colors.orange[500] }}>
            {subtitleRed}
          </Typography>
        </Box>

        {/* Right Side: Progress + Increase */}
        <Box
          display="flex"
          flexDirection="column"
          marginTop="10px"
          alignItems="center"
          gap="8px"
        >
          <ProgressCircle progress={progress} />
          <Typography
            variant="h6"
            fontStyle="italic"
            sx={{
              color: "#3FA89B",
              mr: 1.5,
            }}
          >
            {increase}
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

export default StatCard;
