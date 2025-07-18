import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
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
import AccessTimeIcon from "@mui/icons-material/AccessTime";

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
  const [currentTime, setCurrentTime] = useState(dayjs().format("HH:mm:ss"));

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

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      p={2}
      sx={{
        backgroundColor: "#f3f4f6", // Tailwind's bg-gray-100
        borderBottom: "1px solid #e5e7eb", // Tailwind's border-gray-200
      }}
    >
      <Typography variant="h4" color="#3FA89B">
        {title}
      </Typography>

      <Box display="flex" backgroundColor="#f3f4f6" borderRadius="3px">
        {/*  Clock */}
        {/* Clock */}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#3FA899",
            fontFamily: "monospace",
            borderRadius: "6px",
            ml: 2,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 22, mr: 1, color: "#3FA89B" }} />
          {currentTime}
        </Box>

        {/* Notification Icon */}
        <IconButton
          sx={{ color: colors.grey[700] }}
          onClick={(event) => setAnchorEl(event.currentTarget)}
        >
          <Badge
            badgeContent={invoiceAlerts.length}
            sx={{
              color: "#3FA89B",
              "& .MuiBadge-badge": {
                fontSize: "1rem", // ✅ Increase font size here
                minWidth: 20, // optional: widen the badge if needed
                height: 20, // optional: adjust height
                backgroundColor: "#eb6424",
              },
            }}
            color="error"
          >
            <NotificationsOutlinedIcon />
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
                onClick={() => handleOpenDialog(invoice)}
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
          onClick={(event) => setAgendaAnchorEl(event.currentTarget)}
        >
          <Badge
            badgeContent={agendaTasks.length}
            color="error"
            sx={{
              color: "#3FA89B",
              "& .MuiBadge-badge": {
                fontSize: "1rem", // ✅ Increase font size here
                minWidth: 20, // optional: widen the badge if needed
                height: 20, // optional: adjust height
                backgroundColor: "#eb6424",
              },
            }}
          >
            <EventAvailableOutlinedIcon />
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
          }}
          MenuListProps={{
            sx: {
              backgroundColor: "#f3f4f6", // sets .MuiList-root background
            },
          }}
          onClick={() => {
            navigate("/calendar");
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
                  {dayjs(item.date).format("DD-MM-YYYY")} - {item.entry_name}
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
