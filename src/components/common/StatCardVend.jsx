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
      py={0.5}
      px={5}
    >
      <Box>
        {/* <Typography
          variant="h3"
          sx={{
            color: "#666",
            fontWeight: "semiBold",
          }}
        >
          {title2}
        </Typography> */}
      </Box>
      <Box display="flex" alignItems="center" gap="5px">
        <Box>{icon}</Box>
        <Typography
          variant="h4"
          sx={{ color: "#118ab2", fontWeight: "bold" }}
        >
          {title}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap="5px">
        <Box>{icon1}</Box>
        <Typography
          variant="h4"
          sx={{color: "#118ab2", fontWeight: "bold" }}
        >
          {subtitle}
        </Typography>
      </Box>
      <Box display="flex" alignItems="center" gap="5px">
        <Box>{icon2}</Box>
        <Typography variant="h4" sx={{ color: "#118ab2", fontWeight: "bold" }}>
          {subtitle2}
        </Typography>
      </Box>
    </Box>
  );
};

export default StatCardVend;
