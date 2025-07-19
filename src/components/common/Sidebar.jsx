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
import HouseOutlinedIcon from '@mui/icons-material/HouseOutlined';

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
    name: "Task List",
    icon: PlaylistAddCheckIcon,
    color: "#3FA89B",
    href: "/prep",
  },
  {
    name: "Lab",
    icon: Inventory2OutlinedIcon,
    color: "#3FA89B",
    children: [
      { name: "Inventory", href: "/inventory", icon: Inventory2OutlinedIcon },
      { name: "Recipe", href: "/recipe", icon: RamenDiningOutlinedIcon },
      { name: "Suppliers", href: "/supplier", icon: ContactPhoneOutlinedIcon },
    ],
  },
  {
    name: "Finances",
    icon: ReceiptLongOutlinedIcon,
    color: "#3FA89B",
    children: [
      { name: "Expenses", href: "/invoice", icon: ReceiptLongOutlinedIcon },
      { name: "Stock Take", href: "/stockTake", icon: InventoryOutlinedIcon },
      { name: "Cost Calculator", href: "/cost", icon: SavingsOutlinedIcon },
    ],
  },
  {
    name: "Agenda",
    icon: DateRangeOutlinedIcon,
    color: "#3FA89B",
    href: "/calendar",
  },
   {
    name: "Family Finance",
    icon: HouseOutlinedIcon,
    color: "#3FA89B",
    href: "/family-finance",
  },
  {
    name: "Converter",
    icon: SyncProblemOutlinedIcon,
    color: "#3FA89B",
    href: "/converter",
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [openGroups, setOpenGroups] = useState({});

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
      animate={{ width: isSidebarOpen ? 175 : 65 }}
      className="sidebar-container"
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
          {SIDEBAR_ITEMS.map((item, index) => {
            const isGroup = !!item.children;
            const isOpen = openGroups[item.name] || false;

            return (
              <div key={item.name}>
                <div
                  className="flex items-center p-2 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors mb-2 cursor-pointer"
                  onClick={() => {
                    if (isGroup) {
                      setOpenGroups((prev) => ({
                        ...prev,
                        [item.name]: !prev[item.name],
                      }));
                    } else {
                      navigate(item.href);
                    }
                  }}
                  onMouseEnter={() => setHoveredItem(item.name)} // moved here
                  onMouseLeave={() => setHoveredItem(null)} // moved here
                >
                  <Tooltip
                    title={!isSidebarOpen ? item.name : ""}
                    placement="right"
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
                    <motion.div
                      animate={
                        hoveredItem === item.name
                          ? { scale: 1.5, rotate: 10 }
                          : { scale: 1, rotate: 0 }
                      }
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                      }}
                      style={{
                        borderRadius: "6px",
                        padding: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <item.icon
                        className="text-[16px] sm:text-[20px]"
                        style={{
                          color:
                            item.color?.match(
                              /#(?:[0-9a-fA-F]{3}){1,2}/
                            )?.[0] ?? "#333",
                          minWidth: "16px",
                        }}
                      />
                    </motion.div>
                  </Tooltip>

                  {/* Text */}
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

                  {/* Chevron for group */}
                  {isGroup && isSidebarOpen && (
                    <motion.span className="ml-auto text-xs text-gray-500">
                      {isOpen ? "▲" : "▼"}
                    </motion.span>
                  )}
                </div>

                {isGroup && isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="ml-6"
                  >
                    {item.children.map((child) => (
                      <Link key={child.href} to={child.href}>
                        <div
                          className="flex items-center pt-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg mb-2"
                          onMouseEnter={() => setHoveredItem(child.name)}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <Tooltip
                            title={!isSidebarOpen ? child.name : ""}
                            placement="right"
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
                            <motion.div
                              animate={
                                hoveredItem === child.name
                                  ? { scale: 1.5, rotate: 10 }
                                  : { scale: 1, rotate: 0 }
                              }
                              transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 15,
                              }}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingTop: "5px",
                                borderRadius: "6px",
                              }}
                            >
                              <child.icon
                                className="text-[16px] sm:text-[18px]"
                                style={{ color: "#f78154" }}
                              />
                            </motion.div>
                          </Tooltip>

                          {isSidebarOpen && (
                            <span className="ml-3">{child.name}</span>
                          )}
                        </div>
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            );
          })}

          {/* Logout Button */}
          <button
            onClick={signOut}
            className="flex items-center p-3 pl-2 text-sm font-medium rounded-lg hover:bg-orange-300 transition-colors mb-2 w-full"
          >
            <LogOutIcon
              className="text-[16px] sm:text-[20px]"
              style={{ color: "#f78154", minWidth: "16px" }}
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
