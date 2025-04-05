import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { ColorModeContext, useMode } from "../components/theme";
import { useState } from "react";
import Sidebar from "../components/common/Sidebar";
import { CssBaseline, ThemeProvider } from "@mui/material";
import OverviewPage from "../pages/OverviewPage";
import ProductsPage from "../pages/ProductsPage";
import UsersPage from "../pages/UsersPage";
import SalesPage from "../pages/SalesPage";
import OrdersPage from "../pages/OrdersPage";
import AnalyticsPage from "../pages/AnalyticsPage";
import SettingsPage from "../pages/SettingsPage";
import TextConvetPage from "../pages/TextConvetPage";
import InventoryPage from "../pages/InventoryPage";
import SupplierPage from "../pages/SupplierPage";
import Topbar from "../components/common/Topbar";

function Dashboard() {
  const [theme, colorMode] = useMode();
  const [isSidebar, setIsSidebar] = useState(true);
  const location = useLocation(); // Get the current route

  // Define titles based on routes
  const pageTitles = {
    "/overview": "Overview",
    "/products": "Products",
    "/users": "Users",
    "/sales": "Sales",
    "/orders": "Orders",
    "/analytics": "Analytics",
    "/settings": "Settings",
    "/converter": "Text Converter",
    "/inventory": "Inventory",
  };

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="flex h-screen bg-gray-800 text-gray-100 overflow-hidden">
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
                <Route path="products" element={<ProductsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="sales" element={<SalesPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="converter" element={<TextConvetPage />} />
                <Route path="inventory" element={<InventoryPage />} />
                <Route path="supplier" element={<SupplierPage />} />
              </Routes>
            </div>{" "}
          </div>
        </div>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default Dashboard;
