import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { useMode } from "../components/theme";
import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import { CssBaseline, ThemeProvider } from "@mui/material";
import OverviewPage from "../pages/OverviewPage";
import SalesPage from "../pages/SalesPage";
import TextConvetPage from "../pages/TextConvetPage";
import InventoryPage from "../pages/InventoryPage";
import SupplierPage from "../pages/SupplierPage";
import Topbar from "../components/common/Topbar";
import InvoicePage from "../pages/InvoicePage";
import RecipePage from "../pages/RecipePage";
import CalendarPage from "../pages/CalendarPage";
import StockTackPage from "./StockTakePage";
import CostCalculatorPage from "./CostCalculatorPage";
import ItemsListPage from "./ItemsListPage";
import POSPage from "./POSPage";

function Dashboard() {
  const [theme] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const location = useLocation(); // Get the current route

  // Define titles based on routes
  const pageTitles = {
    "/overview": "Overview",
    "/sales": "Sales",
    "/converter": "Text Converter",
    "/inventory": "Inventory",
    "/supplier": "Suppliers",
    "/invoice": "Expenses",
    "/recipe": "Recipe",
    "/calendar": "Agenda",
    "/stockTake": "Stock Take",
    "/cost": "Cost Calculator",
    "/posPage": "Vendor",
    "/items": "Items List",
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
          <div className="flex-1 overflow-y-scroll p-4 scrollbar-hide">
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
            </Routes>
          </div>{" "}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default Dashboard;
