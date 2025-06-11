import { Box, Typography, useMediaQuery } from "@mui/material";

const StatCardinfo = ({ title, title1, title2, title3, title4, button }) => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  return (
    <div className="flex justify-between px-1 py-1 sm:p-6 border-0 border-gray-300 rounded-lg">
      <Box
        display="grid"
        gap="5px"
        gridTemplateColumns="repeat(2, minmax(0, 1fr))"
        sx={{
          "& > div": {
            gridColumn: isNonMobile ? "span 1" : "span 2", // Full width on mobile
          },
          mb: "5px",
        }}
      >
        {/* box 1 */}
        <Box mr="50px">
          <Box display={"flex"}>{button && <Box>{button}</Box>}</Box>
          <Box display={"flex"}>
            <Typography
              variant="h5"
              sx={{ color: "#577590", fontWeight: [500] }}
            >
              {title}
            </Typography>
          </Box>
          <Box display={"flex"}>
            <Typography
              variant="h5"
              sx={{ color: "#577590", fontWeight: [500] }}
            >
              {title1}
            </Typography>
          </Box>
        </Box>
        {/* box 2 */}
        <Box>
          <Typography variant="h5" sx={{ color: "#577590", fontWeight: [500] }}>
            {title2}
          </Typography>
          <Typography variant="h5" sx={{ color: "#577590", fontWeight: [500] }}>
            {title3}
          </Typography>
        </Box>
        <Box>
          <Typography variant="h5" sx={{ color: "#577590", fontWeight: [500] }}>
            {title4}
          </Typography>
        </Box>
      </Box>
    </div>
  );
};

export default StatCardinfo;
