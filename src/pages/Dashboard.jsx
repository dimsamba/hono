// Version: 1.2.23 11/08/2025

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
import TimerPage from "./TimerPage";
import TraceabilityPage from "./TraceabilityPage";
import TempControlPage from "../components/traceability/TempControlPage";
import FoodLabelsPage from "../components/traceability/FoodLabelsPage";
import CleaningPage from "../components/traceability/CleaningPage";
import { matchPath } from "react-router-dom";

function Dashboard() {
  const [theme] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const location = useLocation(); // Get the current route

  // Define titles based on routes
  // inside Dashboard component
  const routeTitleMap = [
    { pattern: "/overview", title: "OVERVIEW" },
    { pattern: "/sales", title: "SALES" },
    { pattern: "/converter", title: "CONVERTER" },
    { pattern: "/inventory", title: "INVENTORY" },
    { pattern: "/supplier", title: "SUPPLIERS" },
    { pattern: "/invoice", title: "EXPENSES" },
    { pattern: "/recipe", title: "RECIPE" },
    { pattern: "/calendar", title: "AGENDA" },
    { pattern: "/stockTake", title: "STOCK TAKE" },
    { pattern: "/cost", title: "COST CALCULATOR" },
    { pattern: "/vendor", title: "HONO VENDOR" },
    { pattern: "/items", title: "ITEMS LIST" },
    { pattern: "/prep", title: "PREP LIST" },
    { pattern: "/family-finance", title: "FAMILY FINANCE" },
    { pattern: "/timer", title: "TIMER" },
    { pattern: "/traceability", title: "TRACEABILITY" },
    {
      pattern: "/traceability/temperature-control",
      title: "TEMPERATURE CONTROL",
    },
    { pattern: "/traceability/food-labels", title: "FOOD LABELS" },
    { pattern: "/traceability/cleaning", title: "CLEANING" },
  ];

  const getPageTitle = (pathname) => {
    for (let route of routeTitleMap) {
      if (matchPath(route.pattern, pathname)) {
        return route.title;
      }
    }
    return "Dashboard"; // default
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
            title={getPageTitle(location.pathname)}
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
              <Route path="timer" element={<TimerPage />} />

              {/* Traceability section */}
              <Route path="traceability" element={<TraceabilityPage />} />
              <Route
                path="traceability/temperature-control"
                element={<TempControlPage />}
              />
              <Route
                path="traceability/food-labels"
                element={<FoodLabelsPage />}
              />
              <Route path="traceability/cleaning" element={<CleaningPage />} />
            </Routes>
          </div>{" "}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default Dashboard;
