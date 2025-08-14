import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import DateRangeOutlinedIcon from "@mui/icons-material/DateRangeOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import RamenDiningOutlinedIcon from "@mui/icons-material/RamenDiningOutlined";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import SyncProblemOutlinedIcon from "@mui/icons-material/SyncProblemOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import PlaylistAddCheckIcon from "@mui/icons-material/PlaylistAddCheck";
import AlarmOnOutlinedIcon from "@mui/icons-material/AlarmOnOutlined";
import QueryStatsIcon from "@mui/icons-material/QueryStats";

import { Tooltip } from "@mui/material";
import { motion } from "framer-motion";
import { LogOutIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import icon from "../../../public/icons/icon-192x192.png";

const SIDEBAR_ITEMS = [
  { name: "Overview", icon: InsertChartOutlinedIcon, href: "/overview" },
  { name: "Vendor", icon: StorefrontOutlinedIcon, href: "/vendor" },
  { name: "Sales", icon: LocalAtmOutlinedIcon, href: "/sales" },
  { name: "Item's List", icon: PlaylistAddOutlinedIcon, href: "/items" },
  {
    name: "Family Finance",
    icon: SavingsOutlinedIcon,
    href: "/family-finance",
  },
  { name: "Inventory", href: "/inventory", icon: Inventory2OutlinedIcon },
  { name: "Recipe", href: "/recipe", icon: RamenDiningOutlinedIcon },
  { name: "Suppliers", href: "/supplier", icon: ContactPhoneOutlinedIcon },
  { name: "Expenses", href: "/invoice", icon: ReceiptLongOutlinedIcon },
  { name: "Stock Take", href: "/stockTake", icon: InventoryOutlinedIcon },
  { name: "Cost Calculator", href: "/cost", icon: SavingsOutlinedIcon },
  { name: "Agenda", href: "/calendar", icon: DateRangeOutlinedIcon },
  { name: "Timer", href: "/timer", icon: AlarmOnOutlinedIcon },
  { name: "Task List", href: "/prep", icon: PlaylistAddCheckIcon },
  { name: "Converter", href: "/converter", icon: SyncProblemOutlinedIcon },
  { name: "Traceability", icon: QueryStatsIcon, href: "/traceability" },
];

export default function IconGridMenu() {
  const navigate = useNavigate();

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    navigate("/login");
  };

  // Flatten parent + children into a single array
  const flatItems = SIDEBAR_ITEMS.flatMap((item) => {
    if (item.children) {
      return [
        { name: item.name, icon: item.icon, href: "#" },
        ...item.children,
      ];
    }
    return [item];
  });

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.2, rotate: 5 },
  };

  return (
    <div className="p-6">
      {/* Logo */}
      <div className="flex justify-center mb-6">
        <motion.img
          whileHover={{ rotate: 12, scale: 0.9 }}
          src={icon}
          alt="logo"
          className="h-20 w-20 rounded-full cursor-pointer"
        />
      </div>

      {/* Icon grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {flatItems.map((item, idx) => (
          <Tooltip
            key={idx}
            title={item.name}
            placement="top"
            arrow
            slotProps={{
              tooltip: {
                sx: {
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: "#3FA89B",
                  color: "white",
                  borderRadius: 1,
                },
              },
              arrow: { sx: { color: "#3FA89B" } },
            }}
          >
            <Link to={item.href} className="flex flex-col items-center">
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="p-4 rounded-xl shadow-md bg-white hover:bg-gray-50"
              >
                <item.icon style={{ fontSize: 40, color: "#3FA89B" }} />
              </motion.div>
              <span className="mt-2 text-sm font-medium text-gray-700">
                {item.name}
              </span>
            </Link>
          </Tooltip>
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
            className="p-4 rounded-xl shadow-md bg-white hover:bg-gray-50"
          >
            <LogOutIcon size={40} color="#fb6107" />
          </motion.div>
          <span className="mt-2 text-sm font-medium text-gray-700">
            Log out
          </span>
        </div>
      </div>
    </div>
  );
}
