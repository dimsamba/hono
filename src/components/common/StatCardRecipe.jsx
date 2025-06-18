import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

const StatCardRecipe = ({
  value,
  valueRed,
  value2,
  valueRed2,
  title,
  icon,
}) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <div className="flex justify-between px-1 py-2 sm:p-6 border-2 border-gray-300 rounded-lg">
      <Box
        display="grid"
        gap="5px"
        gridTemplateColumns="repeat(1, minmax(0, 1fr))"
        sx={{
          mb: "5px",
          width: "100%",
          flexGrow: 1,
        }}
      >
        {/* Box 1 Whole Row */}
        <Box
          display="flex"
          alignItems="center"
          gap="8px"
          sx={{
            gridColumn: "span 1",
            width: "100%",
            height: "60px",
            ml: 0.8
          }}
        >
          <Box>{icon}</Box>
          <Typography
            variant="h5"
            sx={{ color: "#3FA89B", fontWeight: "bold", lineHeight: 1.2 }}
          >
            {title}
          </Typography>
        </Box>

        {/* Box 2 second row */}
        <Box
          display="flex"
          alignItems="center"
          sx={{
            gridColumn: { xs: "span 2", sm: "span 1" },
            width: "100%",
            height: "5px",
            ml: 1,
            mt: 1,
          }}
        >
          <Typography variant="h5" sx={{ color: "#004e64", lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: colors.orange[500], lineHeight: 1 }}
          >
            {valueRed}
          </Typography>
        </Box>

        {/* Box 2 second row */}
        <Box
          display="flex"
          alignItems="center"
          sx={{
            gridColumn: { xs: "span 2", sm: "span 1" },
            width: "100%",
            height: "5px",
            ml: 1,
            mt: 1,
          }}
        >
          <Typography variant="h5" sx={{ color: "#004e64", lineHeight: 1 }}>
            {value2}
          </Typography>
          <Typography
            variant="h5"
            sx={{ color: colors.orange[500], lineHeight: 1 }}
          >
            {valueRed2}
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

export default StatCardRecipe;
