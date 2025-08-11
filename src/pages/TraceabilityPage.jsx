import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { tokens } from "../components/theme";
import AcUnitOutlinedIcon from "@mui/icons-material/AcUnitOutlined";
import MoreOutlinedIcon from "@mui/icons-material/MoreOutlined";
import CleaningServicesOutlinedIcon from "@mui/icons-material/CleaningServicesOutlined";

const TraceabilityPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Dynamic menu items
  const [menuItems] = useState([
    {
      name: "Temperature Control",
      icon: <AcUnitOutlinedIcon sx={{ fontSize: 80, color: "#3FA89B" }} />,
      path: "temperature-control", // no slash → relative navigation
    },
    {
      name: "Food Labels",
      icon: <MoreOutlinedIcon sx={{ fontSize: 80, color: "#3FA89B" }} />,
      path: "food-labels",
    },
    {
      name: "Cleaning",
      icon: (
        <CleaningServicesOutlinedIcon sx={{ fontSize: 80, color: "#3FA89B" }} />
      ),
      path: "cleaning",
    },
  ]);

  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-100 border-t-2">
      <main className="max-w-8xl mx-auto scrollbar-hide h-[640px] p-4">
        <Grid
          container
          spacing={3}
          justifyContent="center"
          alignItems="center"
          mt="50px"
        >
          {menuItems.map((item, index) => (
            <Grid item key={index}>
              <Paper
                elevation={2}
                sx={{
                  width: 200,
                  height: 200,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backgroundColor: "#F5F5F5",
                  "&:hover": { backgroundColor: "#E0E0E9" },
                  transition: "background-color 0.3s ease",
                  border: "1px solid #3FA89B",
                  borderRadius: "8px",
                }}
                onClick={() => navigate(item.path)}
              >
                {item.icon}
                <Typography
                  variant="h5"
                  align="center"
                  sx={{ mt: 2, color: "#3FA89B" }}
                >
                  {item.name}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </main>
    </div>
  );
};

export default TraceabilityPage;
