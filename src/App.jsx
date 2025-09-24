// Version: 1.2.31 24/09/2025
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import IconGridMenu from "./components/common/IconGridMenu";
import MainLayout from "./components/common/MainLayout";

import FamilyFinance from "./pages/FamilyFinancePage";
import OverviewPage from "./pages/OverviewPage";
import POSPage from "./pages/POSPage";
import SalesPage from "./pages/SalesPage";
import ItemsListPage from "./pages/ItemsListPage";
import InventoryPage from "./pages/InventoryPage";
import InvoicePage from "./pages/InvoicePage";
import RecipePage from "./pages/RecipePage";
import SupplierPage from "./pages/SupplierPage";
import StockTakePage from "./pages/StockTakePage";
import CostCalculatorPage from "./pages/CostCalculatorPage";
import CalendarPage from "./pages/CalendarPage";
import TimerPage from "./pages/TimerPage";
import PrepPage from "./pages/PrepPage";
import TextConvetPage from "./pages/TextConvetPage";
import TraceabilityPage from "./pages/TraceabilityPage";
import TempControlPage from "./components/traceability/TempControlPage";
import FoodLabelsPage from "./components/traceability/FoodLabelsPage";
import CleaningPage from "./components/traceability/CleaningPage";
import FilesPage from "./pages/FilesPage";

import { TimerProvider } from "./components/TimerContext";

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <TimerProvider>
        <BrowserRouter>
          <Routes>
            {/* Public route */}
            <Route path="/login" element={<Login />} />

            {/* Redirect root to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Protected / main layout routes */}
            <Route element={<MainLayout />}>
              <Route path="/iconsgrid" element={<IconGridMenu />} />
              <Route path="/overview" element={<OverviewPage />} />
              <Route path="/vendor" element={<POSPage />} />
              <Route path="/sales" element={<SalesPage />} />
              <Route path="/items" element={<ItemsListPage />} />
              <Route path="/family-finance" element={<FamilyFinance />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/recipe" element={<RecipePage />} />
              <Route path="/supplier" element={<SupplierPage />} />
              <Route path="/invoice" element={<InvoicePage />} />
              <Route path="/stockTake" element={<StockTakePage />} />
              <Route path="/cost" element={<CostCalculatorPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/timer" element={<TimerPage />} />
              <Route path="/prep" element={<PrepPage />} />
              <Route path="/converter" element={<TextConvetPage />} />
              <Route path="/traceability" element={<TraceabilityPage />} />
              <Route path="/temperature-control" element={<TempControlPage />} />
              <Route path="/food-labels" element={<FoodLabelsPage />} />
              <Route path="/cleaning" element={<CleaningPage />} />
              <Route path="/documents" element={<FilesPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TimerProvider>
    </LocalizationProvider>
  );
}
