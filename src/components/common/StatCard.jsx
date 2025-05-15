import ProgressCircle from "./ProgressCircle";
import { motion } from "framer-motion";
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

const StatCard = ({
  value,
  title,
  icon,
  progress,
  increase,
  subtitle,
  subtitle2,
  subtitleRed
}) => {

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md overflow-hidden shadow-lg rounded-xl border border-gray-700"
      whileHover={{ y: 1, boxShadow: "0 10px 25px -15px rgba(0, 2, 0, 1.5)" }}
    > 
    <div className="flex justify-between px-1 py-2 sm:p-6">
  <Box width="100%" display="flex" justifyContent="space-between" alignItems="center">
    {/* Left Side: Icon, Title, Value, Subtitle */}
    <Box display="flex" flexDirection="column" gap="6px">
      <Box display="flex" alignItems="center" gap="8px">
        <Box>{icon}</Box>
        <Typography variant="h5" sx={{ color: colors.greenAccent[400] }}>
          {title}
        </Typography>
      </Box>
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ color: colors.grey[100] }}
      >
        {value}
      </Typography>
      <Typography variant="h5" sx={{ color: colors.grey[100] }}>
        {subtitle}
      </Typography>
      <Typography variant="h5" sx={{ color: colors.grey[100] }}>
        {subtitle2}
      </Typography>
      <Typography variant="h5" sx={{ color: colors.orange[600] }}>
        {subtitleRed}
      </Typography>
    </Box>

    {/* Right Side: Progress + Increase */}
    <Box display="flex" flexDirection="column" marginTop="10px" alignItems="center" gap="8px">
      <ProgressCircle progress={progress} />
      <Typography
        variant="h6"
        fontStyle="italic"
        sx={{ 
          color: colors.greenAccent[400],
          mr: 1.5
         }}
      >
        {increase}
      </Typography>
    </Box>
  </Box>
</div>






    {/* <div className="flex justify-between px-1 py-2 sm:p-6">
       <Box width="100%" m="0 30px">
      <Box display="flex-2 " justifyContent="space-between">
        <Box>
         <p className="mb-2">{icon}</p> 
         <Typography variant="h5" sx={{ color: colors.blueAccent[200] }}>
            {title}
          </Typography>
        </Box>
        <Box>
          <Typography
            variant="h4"
            fontWeight="bold"
            sx={{ color: colors.grey[100], mb:0.5 }}
          >
            {value}
          </Typography>
        </Box>
        <Box>
          <ProgressCircle progress={progress} />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between" mt="2px">
        <Typography variant="h5" sx={{ color: colors.blueAccent[200] }}>
          {subtitle}
        </Typography>
        <Typography
          variant="h4"
          fontStyle="italic"
          sx={{ color: colors.greenAccent[400] }}
        >
          {increase}
        </Typography>
      </Box>
    </Box>
    </div> */}
    </motion.div>
  );
};

export default StatCard;




// <motion.div
// className="bg-gray-800 bg-opacity-50 backdrop-blur-md overflow-hidden shadow-lg rounded-xl border border-gray-700"
// whileHover={{ y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
// >
// <div className="flex justify-between px-4 py-5 sm:p-6">
//   {/* Span hold Label and value */}
//   <span className="Flex items-center justify-between text-sm font-medium text-gray-300">
//     {/* <Icon size={20} className="mr-2" style={{ color }} /> */}
//     <p className="text-1xl mt-1 text-sm font-medium text-gray-300">
//       {name}
//     </p>
//     <p className="mt-1 text-2xl font-semibold text-gray-100">{value}</p>
//   </span>

//   {/* Span hold Sublabel and Second value */}
//   <span>
//     <p className="text-1xl mt-1 text-sm font-medium text-gray-300">
//       {subLabel}
//     </p>
//     <p className="mt-1 text-2xl font-semibold text-gray-100">
//       {secondaryValue}
//     </p>
//   </span>

//   {/* Progressive Circle */}
//   <span>
//     <p className="mt-4 text-2xl font-semibold text-gray-300">
//       {increase}
//     </p>
//   </span>

//   {/* Progressive Circle */}
//   <span>
//     <p className="mt-2.5">
//       <ProgressCircle progress={progress} />
//     </p>
//   </span>
// </div>
// </motion.div>