import { Box, Typography, useMediaQuery } from "@mui/material";

const StatCardinfo = ({ title, title1, title2, title3, title4, button }) => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  return (
    <div className="flex justify-between px-1 py-1 sm:p-6 border-0 border-gray-300 rounded-lg">
      <Box
        display="grid"
        gap="5px"
        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
        sx={{
          "& > div": {
            gridColumn: isNonMobile ? "span 1" : "span 4", // Full width on mobile
          },
          mb: "5px",
          width: "100%",
          flexGrow: 1,
        }}
      >
        {/* box 1 */}
        <Box
          mr="50px"
          sx={{
            width: "100%",
            borderRight: "1px solid #3FA89B",
            pl: 1,
            flexGrow: 1,
          }}
        >
          {/* <Box display={"flex"}>{button && <Box>{button}</Box>}</Box> */}
          <Box display={"flex"}>
            <Typography
              variant="h5"
              sx={{
                color: "#1f2937",
                fontWeight: [500],
              }}
            >
              {title}
            </Typography>
          </Box>
        </Box>
        <Box
          mr="50px"
          sx={{
            width: "100%",
            borderRight: "1px solid #3FA89B",
            pl: 1,
            flexGrow: 1,
          }}
        >
          <Box display={"flex"}>
            <Typography
              variant="h5"
              sx={{
                color: "#1f2937",
                fontWeight: [500],
              }}
            >
              {title1}
            </Typography>
          </Box>
        </Box>
        <Box
          mr="50px"
          sx={{
            width: "100%",
            borderRight: "1px solid #3FA89B",
            pl: 1,
            flexGrow: 1,
          }}
        >
          <Box display={"flex"}>
            <Typography
              variant="h5"
              sx={{
                color: "#1f2937",
                fontWeight: [500],
              }}
            >
              {title2}
            </Typography>
          </Box>
        </Box>
        <Box mr="50px" sx={{ width: "100%", pl: 1, flexGrow: 1 }}>
          <Box display={"flex"}>
            <Typography
              variant="h5"
              sx={{
                color: "#1f2937",
                fontWeight: [500],
              }}
            >
              {title3}
            </Typography>
          </Box>
        </Box>
        <Box mr="50px">
          <Box display={"flex"}>
            <Typography
              variant="h5"
              sx={{ color: "#577590", fontWeight: [500] }}
            >
              {title4}
            </Typography>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default StatCardinfo;
