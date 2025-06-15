import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Import your pages
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
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