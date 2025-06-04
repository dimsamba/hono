import InsertChartOutlinedIcon from '@mui/icons-material/InsertChartOutlined';
import LocalAtmOutlinedIcon from '@mui/icons-material/LocalAtmOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import PostAddOutlinedIcon from '@mui/icons-material/PostAddOutlined';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import ContactPhoneOutlinedIcon from '@mui/icons-material/ContactPhoneOutlined';
import OutdoorGrillOutlinedIcon from '@mui/icons-material/OutdoorGrillOutlined';
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import EuroOutlinedIcon from '@mui/icons-material/EuroOutlined';
import DateRangeOutlinedIcon from '@mui/icons-material/DateRangeOutlined';
import SyncProblemOutlinedIcon from '@mui/icons-material/SyncProblemOutlined';

import {
  LogOutIcon,
  Menu
} from "lucide-react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const SIDEBAR_ITEMS = [
  { name: "Overview", icon: InsertChartOutlinedIcon, color: "#3FA89B", href: "/overview" },
  { name: "Vendor", icon: StorefrontOutlinedIcon, color: "#3FA89B", href: "/vendor" },
  { name: "Item's List", icon: PostAddOutlinedIcon, color: "#3FA89B", href: "/items" },
  { name: "Inventory", icon: Inventory2OutlinedIcon, color: "#3FA89B", href: "/inventory" },
  { name: "Expenses", icon: ReceiptLongOutlinedIcon, color: "#3FA89B", href: "/invoice" },
  { name: "Suppliers", icon: ContactPhoneOutlinedIcon, color: "#3FA89B", href: "/supplier" },
  { name: "Recipe", icon: OutdoorGrillOutlinedIcon, color: "#3FA89B", href: "/recipe" },
  { name: "Stock Take", icon: InventoryOutlinedIcon, color: "#3FA89B", href: "/stockTake" },
  { name: "Sales", icon: LocalAtmOutlinedIcon, color: "#3FA89B", href: "/sales" },
  { name: "Cost Calculator", icon: EuroOutlinedIcon, color: "#3FA89B", href: "/cost" },
  { name: "Agenda", icon: DateRangeOutlinedIcon, color: "#3FA89B", href: "/calendar" },
  { name: "Converter", icon: SyncProblemOutlinedIcon, color: "#3FA89B", href: "/converter" }, 
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
                <item.icon
                  className="text-[16px] sm:text-[20px]"
                  style={{ color: item.color ?? "#333", minWidth: "16px" }}
                />
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
              <span className="ml-4 whitespace-nowrap text-gray-700">Log out</span>
            )}
          </button>
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;
