// Version: 1.2.12 09/07/2025

import { CssBaseline, ThemeProvider } from "@mui/material";
import { useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Sidebar from "../components/common/Sidebar";
import Topbar from "../components/common/Topbar";
import { useMode } from "../components/theme";
import CalendarPage from "../pages/CalendarPage";
import InventoryPage from "../pages/InventoryPage";
import InvoicePage from "../pages/InvoicePage";
import OverviewPage from "../pages/OverviewPage";
import RecipePage from "../pages/RecipePage";
import SalesPage from "../pages/SalesPage";
import SupplierPage from "../pages/SupplierPage";
import TextConvetPage from "../pages/TextConvetPage";
import CostCalculatorPage from "./CostCalculatorPage";
import ItemsListPage from "./ItemsListPage";
import POSPage from "./POSPage";
import StockTackPage from "./StockTakePage";
import PrepPage from "./PrepPage.";
import FamilyFinancePage from "./FamilyFinancePage";

function Dashboard() {
  const [theme] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const location = useLocation(); // Get the current route

  // Define titles based on routes
  const pageTitles = {
    "/overview": "OVERVIEW",
    "/sales": "SALES",
    "/converter": "CONVERTER",
    "/inventory": "INVENTORY",
    "/supplier": "SUPPLIERS",
    "/invoice": "EXPENSES",
    "/recipe": "RECIPE",
    "/calendar": "AGENDA",
    "/stockTake": "STOCK TAKE",
    "/cost": "COST CALCULATOR",
    "/vendor": "HONO VENDOR",
    "/items": "ITEMS LIST",
    "/prep": "PREP LIST",
    "/family-finance": "FAMILY FINANCE",
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="flex h-screen bg-gray-100 text-[#311] overflow-hidden">
        {/* Sidebar */}
        <Sidebar isSidebarOpen={isSidebar} />

        {/* Main content area */}
        <div className="flex flex-col flex-1">
          {/* Topbar */}
          <Topbar
            setIsSidebar={setIsSidebar}
            title={pageTitles[location.pathname] || "Dashboard"}
          />
          {/* Page content */}
          <div className="flex-1 overflow-y-scroll p-0 scrollbar-hide">
            <Routes>
              <Route path="overview" element={<OverviewPage />} />
              <Route path="cost" element={<CostCalculatorPage />} />
              <Route path="sales" element={<SalesPage />} />
              <Route path="converter" element={<TextConvetPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="supplier" element={<SupplierPage />} />
              <Route path="invoice" element={<InvoicePage />} />
              <Route path="recipe" element={<RecipePage />} />
              <Route path="calendar" element={<CalendarPage />} />
              <Route path="stockTake" element={<StockTackPage />} />
              <Route path="vendor" element={<POSPage />} />
              <Route path="items" element={<ItemsListPage />} />
              <Route path="prep" element={<PrepPage />} />
               <Route path="family-finance" element={<FamilyFinancePage />} />
            </Routes>
          </div>{" "}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default Dashboard;
