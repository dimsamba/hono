// src/components/common/Sidebar.jsx
import { useState } from "react";
import { motion } from "framer-motion";
import { LogOutIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// MUI Icons
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined"; // Overview
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined"; // Vendor
import CurrencyExchangeOutlinedIcon from "@mui/icons-material/CurrencyExchangeOutlined"; // Sales
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined"; // Items
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined"; // Family Finance
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined"; // Inventory
import RamenDiningOutlinedIcon from "@mui/icons-material/RamenDiningOutlined"; // Recipe
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined"; // Supplier
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined"; // Invoice
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined"; // StockTake
import EuroOutlinedIcon from "@mui/icons-material/EuroOutlined"; // Cost Calculator
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined"; // Calendar
import AlarmOnOutlinedIcon from "@mui/icons-material/AlarmOnOutlined"; // Timer
import FormatListNumberedTwoToneIcon from "@mui/icons-material/FormatListNumberedTwoTone"; // Prep
import SyncProblemOutlinedIcon from "@mui/icons-material/SyncProblemOutlined"; // Converter
import QueryStatsIcon from "@mui/icons-material/QueryStats"; // Traceability
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined"; // Lab
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined"; // Finances
import BuildCircleOutlinedIcon from "@mui/icons-material/BuildCircleOutlined"; // Tools
import ExpandMoreOutlinedIcon from "@mui/icons-material/ExpandMoreOutlined";
import DocumentScannerOutlinedIcon from '@mui/icons-material/DocumentScannerOutlined';

const MENU_ITEMS = [
  { name: "Overview", icon: InsertChartOutlinedIcon, href: "/overview" },
  { name: "Vendor", icon: StorefrontOutlinedIcon, href: "/vendor" },
  { name: "Sales Table", icon: CurrencyExchangeOutlinedIcon, href: "/sales" },
  { name: "Items List", icon: PlaylistAddOutlinedIcon, href: "/items" },
  {
    name: "Family Finance",
    icon: SavingsOutlinedIcon,
    href: "/family-finance",
  },

  {
    name: "Lab",
    icon: ScienceOutlinedIcon,
    children: [
      { name: "Inventory", icon: Inventory2OutlinedIcon, href: "/inventory" },
      { name: "Recipe", icon: RamenDiningOutlinedIcon, href: "/recipe" },
      { name: "Suppliers", icon: ContactPhoneOutlinedIcon, href: "/supplier" },
      { name: "Traceability", icon: QueryStatsIcon, href: "/traceability" },
    ],
  },

  {
    name: "Finances",
    icon: AccountBalanceWalletOutlinedIcon,
    children: [
      { name: "Expenses", icon: ReceiptLongOutlinedIcon, href: "/invoice" },
      { name: "Stock Take", icon: InventoryOutlinedIcon, href: "/stockTake" },
      { name: "Cost Calculator", icon: EuroOutlinedIcon, href: "/cost" },
    ],
  },

  {
    name: "Tools",
    icon: BuildCircleOutlinedIcon,
    children: [
      { name: "Agenda", icon: DateRangeOutlinedIcon, href: "/calendar" },
      { name: "Task List", icon: FormatListNumberedTwoToneIcon, href: "/prep" },
      { name: "Converter", icon: SyncProblemOutlinedIcon, href: "/converter" },
      { name: "Timer", icon: AlarmOnOutlinedIcon, href: "/timer" },
    ],
  },
   { name: "documents", icon: DocumentScannerOutlinedIcon, href: "/documents" },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const [openSubmenus, setOpenSubmenus] = useState([]);

  const toggleSubmenu = (name) => {
    if (openSubmenus.includes(name)) {
      setOpenSubmenus(openSubmenus.filter((n) => n !== name)); // close
    } else {
      setOpenSubmenus([...openSubmenus, name]); // open
    }
  };

  const signOut = async () => {
    navigate("/login"); // simplified
  };

  return (
    <div className="relative h-screen">
      {/* Small clickable tab */}
      <div
        className="absolute top-1/3 -left-6 bg-[#3FA89B] w-10 h-24 rounded-r-md flex flex-col items-center justify-center cursor-pointer z-50"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)} // hover only opens
      >
        {["M", "E", "N", "U"].map((letter, idx) => (
          <span key={idx} className="text-white font-medium text-sm ml-5">
            {letter}
          </span>
        ))}
      </div>

      {/* Sidebar drawer */}
      <motion.div
        initial={{ x: -250 }}
        animate={{ x: isOpen ? 0 : -250 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-52 max-h-screen overflow-y-auto bg-gray-50 shadow-2xl flex flex-col pl-3 pb-8 mt-16 absolute top-1/5 -translate-y-1/2 z-30 rounded-tr-[15px] rounded-br-[15px]"
        onMouseLeave={() => setIsOpen(false)}
      >
        {/* Menu items */}
        <nav className="flex-1 space-y-2 mt-8">
          {MENU_ITEMS.map((item) => (
            <div key={item.name}>
              {item.children ? (
                <div>
                  {/* Parent item with arrow */}
                  <div
                    onClick={() => toggleSubmenu(item.name)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 cursor-pointer mr-2"
                  >
                    <item.icon style={{ fontSize: 25, color: "#3FA89B" }} />
                    <span className="text-gray-700 font-medium flex items-center justify-between w-full">
                      {item.name}
                      <ExpandMoreOutlinedIcon
                        className={`ml-2 transition-transform duration-200 ${
                          openSubmenus.includes(item.name)
                            ? "rotate-180"
                            : "rotate-0"
                        }`}
                        style={{ fontSize: 18 }}
                      />
                    </span>
                  </div>

                  {/* Submenu items */}
                  {openSubmenus.includes(item.name) && (
                    <div className="ml-6 mt-1 flex flex-col space-y-1">
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 mr-2"
                        >
                          <child.icon
                            style={{ fontSize: 20, color: "#3FA89B" }}
                          />
                          <span className="text-gray-700 text-medium">
                            {child.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-200 mr-2"
                >
                  <item.icon style={{ fontSize: 25, color: "#3FA89B" }} />
                  <span className="text-gray-700 font-medium">{item.name}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div
          onClick={signOut}
          className="flex items-center gap-0 px-3 py-2 cursor-pointer rounded-lg hover:bg-gray-200 mr-2"
        >
          <LogOutIcon size={28} color="#fb6107" />
        </div>
      </motion.div>
    </div>
  );
}
