import {
  BarChart2,
  DollarSign,
  LogOutIcon,
  Menu,
  TrendingUp,
  KeySquare,
  Warehouse,
  Contact,
  ReceiptEuro,
  CookingPot,
  CalendarSearch,
} from "lucide-react";
import InventoryOutlinedIcon from '@mui/icons-material/InventoryOutlined';
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const SIDEBAR_ITEMS = [
  { name: "Overview", icon: BarChart2, color: "#65CABD", href: "/overview" },
  { name: "Inventory", icon: Warehouse, color: "#65CABD", href: "/inventory" },
  { name: "Expenses", icon: ReceiptEuro, color: "#65CABD", href: "/invoice" },
  { name: "Suppliers", icon: Contact, color: "#65CABD", href: "/supplier" },
  { name: "Recipe", icon: CookingPot, color: "#65CABD", href: "/recipe" },
  { name: "Stock Take", icon: InventoryOutlinedIcon, color: "#65CABD", href: "/stockTake" },
  { name: "Sales", icon: DollarSign, color: "#65CABD", href: "/sales" },
  { name: "Cost Calculator", icon: TrendingUp, color: "#65CABD", href: "/cost" },
  { name: "Agenda", icon: CalendarSearch, color: "#65CABD", href: "/calendar" },
  { name: "Converter", icon: KeySquare, color: "#65CABD", href: "/converter" }, 
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
      <div className="h-full bg-gray-800 bg-opacity-50 backdrop-blur-md p-3 flex flex-col border-r border-gray-700 overflow-y-auto scrollbar-hide">
        {/* Sidebar Toggle Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors max-w-fit"
        >
          <Menu className="text-[16px] sm:text-[24px]" />
        </motion.button>

        {/* Navigation */}
        <nav className="mt-8 flex-grow">
          {SIDEBAR_ITEMS.map((item) => (
            <Link key={item.href} to={item.href}>
              <motion.div className="flex items-center p-3 pl-2 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors mb-2">
                <item.icon
                  className="text-[16px] sm:text-[20px]"
                  style={{ color: item.color, minWidth: "16px" }}
                />
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.span
                      className="ml-4 whitespace-nowrap"
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
            className="flex items-center p-3 pl-2 text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors mb-2 w-full"
          >
            <LogOutIcon
              className="text-[16px] sm:text-[20px]"
              style={{ color: "#F66F6F", minWidth: "16px" }}
            />
            {isSidebarOpen && (
              <span className="ml-4 whitespace-nowrap">Log out</span>
            )}
          </button>
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;
