// src/components/common/MainLayout.jsx
import { CssBaseline, ThemeProvider } from "@mui/material";
import { Outlet, useLocation, matchPath } from "react-router-dom";
import { useMode } from "../theme";
import Topbar from "./Topbar";

export default function MainLayout() {
  const [theme] = useMode();
  const location = useLocation();

  const routeTitleMap = [
    { pattern: "/iconsgrid", title: "MAIN MENU" },
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
    { pattern: "/temperature-control", title: "TEMPERATURE CONTROL SYSTEM" },
    { pattern: "/food-labels", title: "FOOD LABEL SYSTEM" },
    { pattern: "/cleaning", title: "CLEANING CONTROL" },
  ];

  const getPageTitle = (pathname) => {
    for (let route of routeTitleMap) {
      if (matchPath(route.pattern, pathname)) {
        return route.title;
      }
    }
    return "Dashboard";
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="flex flex-col h-screen bg-gray-100 text-[#311] overflow-hidden">
        <Topbar title={getPageTitle(location.pathname)} />
        <div className="flex-1 overflow-y-scroll px-4 scrollbar-hide">
          <Outlet />
        </div>
      </div>
    </ThemeProvider>
  );
}
