import { useState, useEffect, useContext } from "react";
import {
  Box,
  IconButton,
  Typography,
  useTheme,
  Badge,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import FileCopyOutlinedIcon from "@mui/icons-material/FileCopyOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import Notification from "../common/Notification";
import AgendaNotification from "../common/AgendaNotification";
import { ColorModeContext, tokens } from "../theme";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const Topbar = ({ title }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const colorMode = useContext(ColorModeContext);
  const [invoiceAlerts, setInvoiceAlerts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [agendaAnchorEl, setAgendaAnchorEl] = useState(null);
  const [agendaTasks, setAgendaTasks] = useState([]);
  const navigate = useNavigate();

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
      <Box display="flex" justifyContent="space-between" p={2}>
      <Typography variant="h4" color={colors.grey[100]}>
        {title}
      </Typography>

      <Box
        display="flex"
        backgroundColor={colors.primary[400]}
        borderRadius="3px"
      >
        {/* Notification Icon */}
        <IconButton
          sx={{ color: colors.grey[300] }}
          onClick={(event) => setAnchorEl(event.currentTarget)} // open Menu
        >
          <Badge badgeContent={invoiceAlerts.length} color="error">
            <NotificationsOutlinedIcon />
          </Badge>
        </IconButton>

        {/* Notification Dropdown */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseMenu}
          slotProps={{
            style: {
              maxHeight: 300,
              width: "300px",
            },
          }}
        >
          <Box
            sx={{
              textAlign: "Left",
              padding: "8px 16px",
              color: colors.greenAccent[400],
              backgroundColor: colors.grey[600],
            }}
          >
            <Typography variant="h6">
              {
                <FileCopyOutlinedIcon
                  sx={{
                    color: colors.greenAccent[400],
                    fontSize: "16px",
                    mr: 1,
                  }}
                />
              }
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
                  display: "flex", // Use flexbox
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: dayjs(invoice.invoice_date).isBefore(dayjs(), "day")
                      ? "#fcba04"
                      : "inherit",
                  }}
                >
                  {dayjs(invoice.invoice_date).isBefore(dayjs(), "day")
                    ? `Overdue ${dayjs(invoice.invoice_date).format(
                        "DD-MM-YYYY"
                      )}`
                    : `due on ${dayjs(invoice.invoice_date).format(
                        "DD-MM-YYYY"
                      )}`}
                  {" - "}
                  € {invoice.amount_ttc !== undefined &&
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
        <Dialog open={dialogOpen} onClose={handleCloseDialog}>
          <DialogTitle>Invoice N. {selectedInvoice?.id}</DialogTitle>
          <DialogContent>
            <DialogContentText>
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

          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              sx={{
                color: "lightGray", // Change the text color here
                "&:hover": {
                  color: "white",
                },
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

        {/* Agenda Notifications Icon */}
        <IconButton
          sx={{ color: colors.grey[300] }}
          onClick={(event) => setAgendaAnchorEl(event.currentTarget)} // open Menu
        >
          <Badge badgeContent={agendaTasks.length} color="error">
            <EventAvailableOutlinedIcon />
          </Badge>
        </IconButton>

        {/* Agenda Dropdown */}
        <Menu
          anchorEl={agendaAnchorEl}
          open={Boolean(agendaAnchorEl)}
          onClose={() => setAgendaAnchorEl(null)}
          slotProps={{
            style: {
              maxHeight: 300,
              width: "300px",
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
              color: colors.greenAccent[400],
              backgroundColor: colors.grey[600],
            }}
          >
            <Typography variant="h6">
              <EventAvailableOutlinedIcon
                sx={{
                  color: colors.greenAccent[400],
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
            >
              <Typography variant="body2">
                {dayjs(item.date).format("DD-MM-YYYY")} - {item.entry_name}
              </Typography>
            </MenuItem>            
            ))
          )}
        </Menu>

        {/* Settings & Profile */}
         <IconButton onClick={colorMode.toggleColorMode}>
          {theme.palette.mode === "dark" ? (
            <DarkModeOutlinedIcon />
          ) : (
            <LightModeOutlinedIcon />
          )}
        </IconButton>
      </Box>
    </Box>
  );
};

export default Topbar;
