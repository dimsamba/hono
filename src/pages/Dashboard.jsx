// // Dashboard.jsx
// import { CssBaseline, ThemeProvider } from "@mui/material";
// import { Route, Routes, useLocation } from "react-router-dom";
// import Topbar from "../components/common/Topbar";
// import { useMode } from "../components/theme";
// import CalendarPage from "./CalendarPage";
// import InventoryPage from "./InventoryPage";
// import InvoicePage from "./InvoicePage";
// import OverviewPage from "./OverviewPage";
// import RecipePage from "./RecipePage";
// import SalesPage from "./SalesPage";
// import SupplierPage from "./SupplierPage";
// import TextConvetPage from "./TextConvetPage";
// import CostCalculatorPage from "./CostCalculatorPage";
// import ItemsListPage from "./ItemsListPage";
// import POSPage from "./POSPage";
// import StockTackPage from "./StockTakePage";
// import PrepPage from "./PrepPage";
// import FamilyFinancePage from "./FamilyFinancePage";
// import TimerPage from "./TimerPage";
// import TraceabilityPage from "./TraceabilityPage";
// import TempControlPage from "../components/traceability/TempControlPage";
// import FoodLabelsPage from "../components/traceability/FoodLabelsPage";
// import CleaningPage from "../components/traceability/CleaningPage";
// import IconGridMenu from "../components/common/IconGridMenu";
// import FilesPage from "./FilesPage";
// import Sidebar from "../components/common/Sidebar"; // adjust path

// function Dashboard() {
//   const [theme] = useMode();
//   const location = useLocation();

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <div className="flex h-screen bg-gray-100 text-[#311] overflow-hidden">
//         <Sidebar /> {/* should now always be visible */}
//         <div className="flex-1 flex flex-col">
//           <Topbar title={getPageTitle(location.pathname)} />
//           <div className="flex-1 overflow-y-scroll p-4 scrollbar-hide">
//             <Routes>
//               <Route path="/" element={<IconGridMenu />} />
//               <Route path="overview" element={<OverviewPage />} />
//               <Route path="cost" element={<CostCalculatorPage />} />
//               <Route path="sales" element={<SalesPage />} />
//               <Route path="converter" element={<TextConvetPage />} />
//               <Route path="inventory" element={<InventoryPage />} />
//               <Route path="supplier" element={<SupplierPage />} />
//               <Route path="invoice" element={<InvoicePage />} />
//               <Route path="recipe" element={<RecipePage />} />
//               <Route path="calendar" element={<CalendarPage />} />
//               <Route path="stockTake" element={<StockTackPage />} />
//               <Route path="vendor" element={<POSPage />} />
//               <Route path="items" element={<ItemsListPage />} />
//               <Route path="prep" element={<PrepPage />} />
//               <Route path="family-finance" element={<FamilyFinancePage />} />
//               <Route path="timer" element={<TimerPage />} />
//               <Route path="traceability" element={<TraceabilityPage />} />
//               <Route path="documents" element={<FilesPage />} />
//               <Route
//                 path="traceability/temperature-control"
//                 element={<TempControlPage />}
//               />
//               <Route
//                 path="traceability/food-labels"
//                 element={<FoodLabelsPage />}
//               />
//               <Route path="traceability/cleaning" element={<CleaningPage />} />
//             </Routes>
//           </div>
//         </div>
//       </div>
//     </ThemeProvider>
//   );
// }

// export default Dashboard;
