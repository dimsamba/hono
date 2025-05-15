import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

// Import your pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Wrapper from "./pages/Wrapper";

const App = () => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="*"
            element={
              <Wrapper>
                <Dashboard />
              </Wrapper>
            }
          />
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  );
};

export default App;