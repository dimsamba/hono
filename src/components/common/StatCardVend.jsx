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
      px={2}
      sx={{
        maxWidth:"500px",
     //   backgroundColor: "red"
      }}
    >
      {/* <Box>
        <Typography
          variant="h3"
          sx={{
            color: "#666",
            fontWeight: "semiBold",
          }}
        >
          {title2}
        </Typography>
      </Box> */}
      <Box display="flex" alignItems="center" gap="5px">
        {/* <Box>{icon}</Box> */}
        <Typography
          variant="h2"
          sx={{ color: "#e0fbfc", fontWeight: "bold", fontWeight: 400 }}
        >
          {title}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap="5px">
        {/* <Box>{icon1}</Box> */}
        <Typography
          variant="h4"
          sx={{color: "#f1faee", fontWeight: "bold", fontWeight: 300 }}
        >
          {subtitle}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap="5px">
        {/* <Box>{icon2}</Box> */}
        <Typography variant="h4" sx={{ color: "#f1faee", fontWeight: "bold", fontWeight: 300 }}>
          {subtitle2}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatCardVend;
