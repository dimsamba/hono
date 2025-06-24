import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import PriceCheckOutlinedIcon from '@mui/icons-material/PriceCheckOutlined';
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import RamenDiningOutlinedIcon from '@mui/icons-material/RamenDiningOutlined';
import PlaylistAddOutlinedIcon from '@mui/icons-material/PlaylistAddOutlined';
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SyncProblemOutlinedIcon from "@mui/icons-material/SyncProblemOutlined";
import { Tooltip } from "@mui/material";

import { AnimatePresence, motion } from "framer-motion";
import { LogOutIcon, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const SIDEBAR_ITEMS = [
  {
    name: "Overview",
    icon: InsertChartOutlinedIcon,
    color: "#3FA89B",
    href: "/overview",
  },
  {
    name: "Vendor",
    icon: StorefrontOutlinedIcon,
    color: "#3FA89B",
    href: "/vendor",
  },
  {
    name: "Sales",
    icon: LocalAtmOutlinedIcon,
    color: "#3FA89B",
    href: "/sales",
  },
  {
    name: "Item's List",
    icon: PlaylistAddOutlinedIcon,
    color: "#3FA89B",
    href: "/items",
  },
  {
    name: "Inventory",
    icon: Inventory2OutlinedIcon,
    color: "#3FA89B",
    href: "/inventory",
  },
  {
    name: "Suppliers",
    icon: ContactPhoneOutlinedIcon,
    color: "#3FA89B",
    href: "/supplier",
  },
  {
    name: "Recipe",
    icon: RamenDiningOutlinedIcon,
    color: "#3FA89B",
    href: "/recipe",
  },
  {
    name: "Expenses",
    icon: ReceiptLongOutlinedIcon,
    color: "#3FA89B",
    href: "/invoice",
  },
  {
    name: "Stock Take",
    icon: InventoryOutlinedIcon,
    color: "#3FA89B",
    href: "/stockTake",
  },
  {
    name: "Cost Calculator",
    icon: PriceCheckOutlinedIcon,
    color: "#3FA89B",
    href: "/cost",
  },
  {
    name: "Agenda",
    icon: DateRangeOutlinedIcon,
    color: "#3FA89B",
    href: "/calendar",
  },
  {
    name: "Converter",
    icon: SyncProblemOutlinedIcon,
    color: "#3FA89B",
    href: "/converter",
  },
];

const Sidebar = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.div
      className={`relative z-10 transition-all duration-0 ease-in-out flex-shrink-0 ${
        isSidebarOpen ? "w-64" : "w-20"
      }`}
      animate={{ width: isSidebarOpen ? 175 : 65 }}
    >
      <div className="h-full bg-gray-100 bg-opacity-100 p-3 flex flex-col border-r border-gray-200 overflow-y-auto scrollbar-hide">
        {/* Sidebar Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors max-w-fit"
        >
          <Menu className="text-[16px] sm:text-[24px] text-gray-800" />
        </motion.button>

        {/* Navigation */}
        <nav className="mt-8 flex-grow">
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.href} to={item.href}>
              <motion.div className="flex items-center p-2 pl-2 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors mb-2">
                <Tooltip
                  title={!isSidebarOpen ? item.name : ""}
                  placement="right"
                  arrow
                  slotProps={{
                    tooltip: {
                      sx: {
                        fontSize: 14, // Tooltip text size
                        fontWeight: 400, // Bold text
                        backgroundColor: "#3FA89B", // Dark background
                        color: "white", // White text
                        borderRadius: 1,
                        Opacity: "0.6 !important",
                      },
                    },
                    arrow: {
                      sx: {
                        color: "#3FA89B", // Match tooltip background
                      },
                    },
                  }}
                >
                  <div>
                    <item.icon
                      className="text-[16px] sm:text-[20px]"
                      style={{ color: item.color ?? "#333", minWidth: "16px" }}
                    />
                  </div>
                </Tooltip>

                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      className="ml-4 whitespace-nowrap text-gray-700"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2, delay: 0.3 }}
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          ))}

          {/* Logout Button */}
          <button
            onClick={signOut}
            className="flex items-center p-3 pl-2 text-sm font-medium rounded-lg hover:bg-orange-400 transition-colors mb-2 w-full"
          >
            <LogOutIcon
              className="text-[16px] sm:text-[20px]"
              style={{ color: "#CC4444", minWidth: "16px" }}
            />
            {isSidebarOpen && (
              <span className="ml-4 whitespace-nowrap text-gray-700">
                Log out
              </span>
            )}
          </button>
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;
