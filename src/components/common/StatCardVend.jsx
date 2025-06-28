import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

const StatCardVend = ({
  title,
  icon,
  icon1,
  icon2,
  subtitle,
  subtitle2,
  title2,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <Box
      width="100%"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={3}
    >
      {/* Left Side: Icon, Title, Value, Subtitle */}
      <Box
        display="flex"
        flexDirection="column"
        gap="3px"
        width="100%"
        sx={{
          pl: {
            xs: "10px", // applies on extra-small screens and up
            sm: 0, // removes padding on small screens and up
            //   backgroundColor: "white"
          },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h4"
            sx={{
              color: "#3FA89B",
              fontWeight: "semiBold",
              textAlign: "center",
            }}
          >
            {title2}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap="8px">
          <Box sx={{ ml: 2 }}>{icon}</Box>
          <Typography
            variant="h4"
            sx={{ color: colors.greenAccent[600], fontWeight: "bold" }}
          >
            {title}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap="8px">
          <Box sx={{ ml: 2 }}>{icon1}</Box>
          <Typography
            variant="h5"
            sx={{ color: colors.orange[500], fontWeight: "bold" }}
          >
            {subtitle}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap="8px">
          <Box sx={{ ml: 2 }}>{icon2}</Box>
          <Typography
            variant="h5"
            sx={{ color: colors.primary[200], fontWeight: "bold" }}
          >
            {subtitle2}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default StatCardVend;
