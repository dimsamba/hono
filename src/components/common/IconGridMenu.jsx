// src/pages/IconGridMenu.jsx
import { motion } from "framer-motion";
import { LogOutIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

// Import your icons
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import RamenDiningOutlinedIcon from "@mui/icons-material/RamenDiningOutlined";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SyncProblemOutlinedIcon from "@mui/icons-material/SyncProblemOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import FormatListNumberedTwoToneIcon from "@mui/icons-material/FormatListNumberedTwoTone";
import AlarmOnOutlinedIcon from "@mui/icons-material/AlarmOnOutlined";
import EuroOutlinedIcon from "@mui/icons-material/EuroOutlined";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import ShoppingBasketOutlinedIcon from '@mui/icons-material/ShoppingBasketOutlined';
import DocumentScannerOutlinedIcon from '@mui/icons-material/DocumentScannerOutlined';

// Your items
export const MENU_ITEMS = [
  { name: "Overview", icon: InsertChartOutlinedIcon, href: "/overview" },
  { name: "Vendor", icon: StorefrontOutlinedIcon, href: "/vendor" },
  { name: "Sales", icon: ShoppingBasketOutlinedIcon, href: "/sales" },
  { name: "Item's List", icon: PlaylistAddOutlinedIcon, href: "/items" },
  { name: "Inventory", icon: Inventory2OutlinedIcon, href: "/inventory" },
  { name: "Recipe", icon: RamenDiningOutlinedIcon, href: "/recipe" },
  { name: "Suppliers", icon: ContactPhoneOutlinedIcon, href: "/supplier" },
  { name: "Expenses", icon: ReceiptLongOutlinedIcon, href: "/invoice" },
  { name: "Stock Take", icon: InventoryOutlinedIcon, href: "/stockTake" },
  { name: "Cost Calculator", icon: EuroOutlinedIcon, href: "/cost" },
  { name: "Agenda", icon: DateRangeOutlinedIcon, href: "/calendar" },
  { name: "Timer", icon: AlarmOnOutlinedIcon, href: "/timer" },
  { name: "Task List", icon: FormatListNumberedTwoToneIcon, href: "/prep" },
  { name: "Converter", icon: SyncProblemOutlinedIcon, href: "/converter" },
  { name: "Traceability", icon: QueryStatsIcon, href: "/traceability" },
  { name: "Documents", icon: DocumentScannerOutlinedIcon, href: "/documents" },
  {
    name: "Family Finances",
    icon: SavingsOutlinedIcon,
    href: "/family-finance",
  },
];

export default function IconGridMenu() {
  const navigate = useNavigate();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.15 },
  };

  return (
    <div className="p-6 mt-5 min-h-screen bg-gray-100">
      {/* Icon grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {MENU_ITEMS.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className="flex flex-col items-center"
          >
            <motion.div
              variants={iconVariants}
              initial="initial"
              whileHover="hover"
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
              className="p-4 rounded-xl shadow-md bg-slate-100 hover:bg-slate-100"
            >
              <item.icon
                style={{
                  fontSize: 50,
                  color:
                   item.name === "Overview"
                          ? "#3a86ff"
                          : item.name === "Vendor"
                          ? "#f85e00"
                          : item.name === "Sales"
                          ? "#f85e00"
                          : item.name === "Item's List"
                          ? "#f85e00"
                          : item.name === "Family Finances"
                          ? "#9d4edd"
                           : item.name === "Documents"
                          ? "#9d4edd"
                          : "#3FA89B",
                }}
              />
            </motion.div>
            <span className="mt-1 text-sm font-medium text-gray-700">
              {item.name}
            </span>
          </Link>
        ))}

        {/* Logout button */}
        <div
          onClick={signOut}
          className="flex flex-col items-center cursor-pointer"
        >
          <motion.div
            variants={iconVariants}
            initial="initial"
            whileHover="hover"
            transition={{ type: "spring", stiffness: 300, damping: 15 }}
            className="p-4 rounded-xl shadow-md bg-slate-100 hover:bg-slate-100"
          >
            <LogOutIcon size={55} color="#fb6107" />
          </motion.div>
          <span className="mt-2 text-sm font-medium text-gray-700">
            Log out
          </span>
        </div>
      </div>
    </div>
  );
}
