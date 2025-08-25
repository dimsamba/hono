import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CurrencyExchangeOutlinedIcon from "@mui/icons-material/CurrencyExchangeOutlined";
import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import AppsOutlinedIcon from "@mui/icons-material/AppsOutlined";
import PlaylistAddOutlinedIcon from "@mui/icons-material/PlaylistAddOutlined";
import FormatListNumberedTwoToneIcon from '@mui/icons-material/FormatListNumberedTwoTone';
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";

import icon from "../../../public/icons/icon-192x192.png";
import { motion } from "framer-motion";
import {
  Badge,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  useTheme,
} from "@mui/material";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgendaNotification from "../common/AgendaNotification";
import Notification from "../common/Notification";
import { tokens } from "../theme";
import { Tooltip } from "@mui/material";

// Imports for timmer Icon set up
import { useTimers } from "../TimerContext";
import AccessAlarmsOutlinedIcon from "@mui/icons-material/AccessAlarmsOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

const Topbar = ({ title }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [invoiceAlerts, setInvoiceAlerts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [agendaAnchorEl, setAgendaAnchorEl] = useState(null);
  const [agendaTasks, setAgendaTasks] = useState([]);
  const navigate = useNavigate();
  const [shortcutAnchorEl, setShortcutAnchorEl] = useState(null);
  const [openShortcut, setOpenShortcut] = useState(false);
  let hoverTimeout = null;
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));
  // const { activeTimers } = useTimers();
  const { timers, activeTimers, stopRingingTimers } = useTimers();
  //  const activeTimers = timers.filter((t) => t.isRunning).length;

  // Clock function Date and Time
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = now.toLocaleString("default", { month: "short" }); // e.g. Jul
      const year = now.getFullYear();
      const time = now.toLocaleTimeString("en-GB"); // HH:MM:SS format

      setCurrentTime(`${day} ${month} ${year} - ${time}`);
    };

    updateClock(); // set initial time
    const intervalId = setInterval(updateClock, 1000); // update every second

    return () => clearInterval(intervalId);
  }, []);

  // Fetch agend Notifications
  useEffect(() => {
    const getAgenda = async () => {
      const data = await AgendaNotification();
      setAgendaTasks(data);
    };
    getAgenda();
  }, []);

  useEffect(() => {
    const getAlerts = async () => {
      const result = await Notification();
      setInvoiceAlerts(result);
    };
    getAlerts();
  }, []);

  const handleCloseMenu = () => setAnchorEl(null);

  const handleOpenDialog = (invoice) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
    //handleCloseMenu();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInvoice(null);
  };

  const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.15 },
  };

  // ShortCut Mouse hover
  const handleOpen = (event) => {
    clearTimeout(hoverTimeout);
    setShortcutAnchorEl(event.currentTarget);
    setOpenShortcut(true);
  };

  const handleClose = () => {
    hoverTimeout = setTimeout(() => {
      setOpenShortcut(false);
      setShortcutAnchorEl(null);
    }, 20); // small delay so user can move mouse into popup
  };

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      sx={{
        backgroundColor: "#f3f4f6", // Tailwind's bg-gray-100
        borderBottom: "2px solid #e5e7eb", // Tailwind's border-gray-200
        p: 0.5,
        height: 60,
      }}
    >
      {/* LEFT GROUP: Return Button + Title */}
      <Box display="flex" alignItems="center" gap={1}>
        {/* Return Button */}
        <Box sx={{ cursor: "pointer", width: 70 }}>
          <motion.img
            whileHover={{ scale: 0.8 }}
            onClick={() => navigate("/iconsgrid")}
            className="rounded-full transition-colors cursor-pointer"
            src={icon}
            alt="icon"
            animate={{ opacity: 0.8, scale: 0.7 }}
            exit={{ opacity: 1, scale: 0.7 }}
            sx={{
              width: 18,
              height: 18,
            }}
          />
        </Box>
        {/* Title */}
        <Typography variant="h4" color="#3FA89B" mr="25px">
          {title}
        </Typography>

        {/* Shortcut Icon */}
        {/* <div
          className="relative cursor-pointer"
          onMouseEnter={handleOpen}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            variants={iconVariants}
            initial="initial"
            whileHover="hover"
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <AppsOutlinedIcon sx={{ color: "#3FA89B", fontSize: "35px" }} />
          </motion.div>
        </div> */}

        <Menu
          anchorEl={shortcutAnchorEl}
          open={openShortcut}
          onClose={() => setOpenShortcut(false)}
          MenuListProps={{
            onMouseEnter: () => clearTimeout(hoverTimeout), // cancel close
            onMouseLeave: handleClose, // close only when leaving menu
          }}
          PaperProps={{
            sx: {
              backgroundColor: "#f3f4f6",
              borderRadius: "12px",
              px: 0.5,
            },
          }}
        >
          <Box display="flex" gap={0} justifyContent="center">
            {/* Overview */}
            <Tooltip
              title="Overview"
              placement="top"
              arrow
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: "#f3f4f6",
                      color: "#3FA89B",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.30)",
                    },
                    "& .MuiTooltip-arrow": {
                      color: "white", // arrow color matches bg
                    },
                  },
                },
              }}
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                onClick={() => {
                  navigate("/overview");
                  setShortcutAnchorEl(null);
                }}
                style={{
                  cursor: "pointer",
                  width: "40px", // 👈 fixed width
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "5px",
                }}
              >
                <InsertChartOutlinedIcon
                  sx={{ color: "#0466c8", fontSize: "35px" }}
                />
              </motion.div>
            </Tooltip>

            {/* Vendor */}
            <Tooltip
              title="Vendor"
              placement="top"
              arrow
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: "#f3f4f6",
                      color: "#3FA89B",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.30)",
                    },
                    "& .MuiTooltip-arrow": {
                      color: "white", // arrow color matches bg
                    },
                  },
                },
              }}
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                onClick={() => {
                  navigate("/vendor");
                  setShortcutAnchorEl(null);
                }}
                style={{
                  cursor: "pointer",
                  width: "40px", // 👈 fixed width
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "5px",
                }}
              >
                <StorefrontOutlinedIcon
                  sx={{ color: "#ff006e", fontSize: "35px" }}
                />
              </motion.div>
            </Tooltip>

            {/* Sales */}
            <Tooltip
              title="Sales"
              placement="top"
              arrow
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: "#f3f4f6",
                      color: "#3FA89B",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.30)",
                    },
                    "& .MuiTooltip-arrow": {
                      color: "white", // arrow color matches bg
                    },
                  },
                },
              }}
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                onClick={() => {
                  navigate("/sales");
                  setShortcutAnchorEl(null);
                }}
                style={{
                  cursor: "pointer",
                  width: "40px", // 👈 fixed width
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "5px",
                }}
              >
                <CurrencyExchangeOutlinedIcon
                  sx={{ color: "#3FA89B", fontSize: "30px" }}
                />
              </motion.div>
            </Tooltip>

            {/* Items List */}
            <Tooltip
              title="Item's List"
              placement="top"
              arrow
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: "#f3f4f6",
                      color: "#3FA89B",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.30)",
                    },
                    "& .MuiTooltip-arrow": {
                      color: "white", // arrow color matches bg
                    },
                  },
                },
              }}
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                onClick={() => {
                  navigate("/items");
                  setShortcutAnchorEl(null);
                }}
                style={{
                  cursor: "pointer",
                  width: "40px", // 👈 fixed width
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "5px",
                }}
              >
                <PlaylistAddOutlinedIcon
                  sx={{ color: "#3FA89B", fontSize: "35px" }}
                />
              </motion.div>
            </Tooltip>

             {/* Task List */}
            <Tooltip
              title="Task List"
              placement="top"
              arrow
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: "#f3f4f6",
                      color: "#3FA89B",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.30)",
                    },
                    "& .MuiTooltip-arrow": {
                      color: "white", // arrow color matches bg
                    },
                  },
                },
              }}
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                onClick={() => {
                  navigate("/prep");
                  setShortcutAnchorEl(null);
                }}
                style={{
                  cursor: "pointer",
                  width: "40px", // 👈 fixed width
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "5px",
                }}
              >
                <FormatListNumberedTwoToneIcon
                  sx={{ color: "#3FA89B", fontSize: "35px" }}
                />
              </motion.div>
            </Tooltip>

             {/* Family Finances */}
            <Tooltip
              title="Family Finances"
              placement="top"
              arrow
              slotProps={{
                popper: {
                  sx: {
                    "& .MuiTooltip-tooltip": {
                      backgroundColor: "#f3f4f6",
                      color: "#3FA89B",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "1px solid #ddd",
                      borderRadius: "8px",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.30)",
                    },
                    "& .MuiTooltip-arrow": {
                      color: "white", // arrow color matches bg
                    },
                  },
                },
              }}
            >
              <motion.div
                variants={iconVariants}
                initial="initial"
                whileHover="hover"
                onClick={() => {
                  navigate("/family-finance");
                  setShortcutAnchorEl(null);
                }}
                style={{
                  cursor: "pointer",
                  width: "40px", // 👈 fixed width
                  height: "40px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: "5px",
                }}
              >
                <SavingsOutlinedIcon
                  sx={{ color: "#7678ed", fontSize: "35px" }}
                />
              </motion.div>
            </Tooltip>
          </Box>
        </Menu>
      </Box>

      {/* RIGHT BOX */}
      <Box
        display="flex"
        alignItems="center"
        sx={{
          backgroundColor: "#f3f4f6",
          borderRadius: "3px",
          p: 1,
        }}
      >
        {/* Icon Stop alarm */}
        <div className="relative cursor-pointer ml-3">
          {timers.some((t) => t.isFlashing) && (
            <motion.div
              animate={{ scale: [1, 1.3, 1] }} // 👈 grows then shrinks
              transition={{
                duration: 0.8,
                repeat: Infinity, // 👈 loop forever
                ease: "easeInOut",
              }}
            >
              <NotificationsActiveOutlinedIcon
                onClick={stopRingingTimers}
                sx={{ color: "#eb6424", fontSize: 30, cursor: "pointer", mr: 1 }}
              />
            </motion.div>
          )}
        </div>

        {/* Timer Icon */}
        <div
          className="relative cursor-pointer"
          onClick={() => navigate("/timer")}
        >
          <motion.div
            variants={iconVariants}
            initial="initial"
            whileHover="hover"
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
          >
            <AccessAlarmsOutlinedIcon
              sx={{
                color: "#3FA89B",
                fontSize: "30px",
                mr: 1,
              }}
            />
            {activeTimers > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#eb6424] text-white text-lg rounded-full w-7 h-5 flex items-center justify-center">
                {activeTimers}
              </span>
            )}
          </motion.div>
        </div>

        {/* Clock */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            pr: 1,
            fontSize: "1.3rem",
            fontWeight: 500,
            color: "#3FA899",
            fontFamily: "monospace",
            borderRadius: "6px",
            ml: 2,
          }}
        >
          {currentTime}
        </Box>

        {/* Notification Icon */}
        <IconButton
          sx={{ color: colors.grey[700] }}
          onMouseEnter={(event) => setAnchorEl(event.currentTarget)}

        >
          <Badge
            badgeContent={invoiceAlerts.length}
            sx={{
              color: "#3FA89B",
              "& .MuiBadge-badge": {
                fontSize: "1rem", // ✅ Increase font size here
                minWidth: 30, // optional: widen the badge if needed
                height: 20, // optional: adjust height
                backgroundColor: "#eb6424",
              },
            }}
            color="error"
          >
            <NotificationsOutlinedIcon
              sx={{
                color: "#3FA89B",
                fontSize: "27px",
              }}
            />
          </Badge>
        </IconButton>
        {/* Notification Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          PaperProps={{
            sx: {
              backgroundColor: "#f3f4f6", // Tailwind bg-gray-100
              maxHeight: 300,
              width: "300px",
            },
            onMouseLeave: () => handleCloseMenu(null), // 👈 closes when mouse leaves
          }}
          MenuListProps={{
            sx: {
              backgroundColor: "#f3f4f6", // consistent list background
            },
          }}
        >
          <Box
            sx={{
              textAlign: "Left",
              padding: "8px 16px",
              color: colors.grey[700],
              backgroundColor: "#f3f4f6",
            }}
          >
            <Typography variant="h6">
              <FileCopyOutlinedIcon
                sx={{
                  color: colors.greenAccent[700],
                  fontSize: "16px",
                  mr: 1,
                }}
              />
              Invoices
            </Typography>
          </Box>

          {invoiceAlerts.length === 0 ? (
            <MenuItem onClick={handleCloseMenu}>No new invoices</MenuItem>
          ) : (
            invoiceAlerts.map((invoice) => (
              <MenuItem
                key={invoice.id}
                onClick={() => {
                  navigate("/invoice");
                  handleOpenDialog(invoice);
                }}
                sx={{
                  display: "flex",
                  backgroundColor: "#f3f4f6",
                  color: "#111",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 14,
                    color: dayjs(invoice.invoice_date).isBefore(dayjs(), "day")
                      ? "#ff5714"
                      : "#454955", // Tailwind's text-gray-900
                    fontWeight: dayjs(invoice.invoice_date).isBefore(
                      dayjs(),
                      "day"
                    )
                      ? "semiBold"
                      : "normal",
                  }}
                >
                  {dayjs(invoice.invoice_date).isBefore(dayjs(), "day")
                    ? `Overdue ${dayjs(invoice.invoice_date).format(
                        "DD-MM-YYYY"
                      )}`
                    : `Due on ${dayjs(invoice.invoice_date).format(
                        "DD-MM-YYYY"
                      )}`}
                  {" - "}€{" "}
                  {invoice.amount_ttc !== undefined &&
                  invoice.amount_ttc !== null
                    ? new Intl.NumberFormat("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }).format(invoice.amount_ttc)
                    : "N/A"}
                </Typography>
              </MenuItem>
            ))
          )}
        </Menu>

        {/* Invoice Detail Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          PaperProps={{
            sx: {
              backgroundColor: "#f3f4f6", // Tailwind's bg-gray-100
              color: "#111827", // Tailwind's text-gray-900
            },
          }}
        >
          <DialogTitle sx={{ color: "#111827" }}>
            Invoice N. {selectedInvoice?.id}
          </DialogTitle>

          <DialogContent>
            <DialogContentText sx={{ color: "#374151" }}>
              {" "}
              {/* text-gray-700 */}
              <strong>Due Date:</strong>{" "}
              {dayjs(selectedInvoice?.invoice_date).format("DD-MM-YYYY")}
              <br />
              <strong>Amount HT:</strong> €{" "}
              {selectedInvoice?.amount_ht
                ? new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(selectedInvoice.amount_ht)
                : "N/A"}
              <br />
              <strong>Amount TTC:</strong> €{" "}
              {selectedInvoice?.amount_ttc
                ? new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(selectedInvoice.amount_ttc)
                : "N/A"}
              <br />
              <strong>Category:</strong> {selectedInvoice?.category || "N/A"}
              <br />
              <strong>From:</strong> {selectedInvoice?.from || "N/A"}
              <br />
              <strong>Description:</strong> {selectedInvoice?.note || "N/A"}
            </DialogContentText>
          </DialogContent>

          <DialogActions
            sx={{
              backgroundColor: "#f9fafb",
              borderTop: "1px solid #e5e7eb",
            }}
          >
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: "#374151",
                "&:hover": {
                  backgroundColor: "#e5e7eb",
                  color: "#111827",
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Agenda Notifications Icon */}
        <IconButton
          sx={{ color: colors.grey[700] }}
          onMouseEnter={(event) => setAgendaAnchorEl(event.currentTarget)}
        >
          <Badge
            badgeContent={agendaTasks.length}
            color="error"
            sx={{
              color: "#3FA89B",
              "& .MuiBadge-badge": {
                fontSize: "1rem", // ✅ Increase font size here
                minWidth: 30, // optional: widen the badge if needed
                height: 20, // optional: adjust height
                backgroundColor: "#eb6424",
              },
            }}
          >
            <EventAvailableOutlinedIcon
              sx={{
                color: "#3FA89B",
                fontSize: "27px",
              }}
            />
          </Badge>
        </IconButton>

        {/* Agenda Dropdown */}
        <Menu
          anchorEl={agendaAnchorEl}
          open={Boolean(agendaAnchorEl)}
          onClose={() => setAgendaAnchorEl(null)}
          PaperProps={{
            sx: {
              backgroundColor: "#f3f4f6",
              maxHeight: 300,
              width: "300px",
            },
            onMouseLeave: () => setAgendaAnchorEl(null), // 👈 closes when mouse leaves
          }}
          MenuListProps={{
            sx: {
              backgroundColor: "#f3f4f6", // sets .MuiList-root background
            },
          }}
          onClick={() => {
            setAgendaAnchorEl(null); // close menu
          }}
        >
          <Box
            sx={{
              textAlign: "Left",
              padding: "8px 16px",
              color: colors.grey[700],
              backgroundColor: "#f3f4f6", // Tailwind's bg-gray-100
              "& .MuiList-root": {
                backgroundColor: "#f3f4f6", // Tailwind's bg-gray-100
              },
            }}
          >
            <Typography variant="h6">
              <EventAvailableOutlinedIcon
                sx={{
                  color: colors.greenAccent[700],
                  fontSize: "16px",
                  mr: 1,
                }}
              />
              Upcoming Tasks
            </Typography>
          </Box>

          {agendaTasks.length === 0 ? (
            <MenuItem>No upcoming tasks</MenuItem>
          ) : (
            agendaTasks.map((item) => (
              <MenuItem
                key={item.id}
                onClick={() => {
                  navigate("/calendar", {
                    state: {
                      taskId: item.id, // optional: task-level targeting
                      taskDate: item.date, // required: scroll-to-date
                    },
                  });
                  setAgendaAnchorEl(null);
                }}
                sx={{
                  backgroundColor: "#f3f4f6", // Tailwind's bg-gray-100
                  color: "#111",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: 14,
                  }}
                >
                  {dayjs(item.date).format("DD-MM-YYYY HH:mm")} -{" "}
                  {item.entry_name}
                </Typography>
              </MenuItem>
            ))
          )}
        </Menu>
      </Box>
    </Box>
  );
};

export default Topbar;
