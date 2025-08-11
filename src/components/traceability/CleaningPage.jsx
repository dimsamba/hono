import {
  Box,
  Button,
} from "@mui/material";
import KeyboardReturnOutlinedIcon from "@mui/icons-material/KeyboardReturnOutlined";
import { useNavigate } from "react-router-dom";

const CleaningPage = () => {
  const navigate = useNavigate();

  return (
    <Box p={5} sx={{ borderRadius: 2 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate(-1)}
        sx={{
          m: 2,
          backgroundColor: "#778da9",
          color: "#fff",
          "&:hover": {
            backgroundColor: "#415a77",
          },
          height: 40,
          borderRadius: 2,
        }}
      >
        <KeyboardReturnOutlinedIcon />
      </Button>
      <Box
        display="flex"
        mb={2}
        sx={{ borderBottom: "1px solid #3FA89B", pb: 2 }}
      >
        <span>Cleaning Page NOT yet implemented</span>
      </Box>
    </Box>
  );
};

export default CleaningPage;
