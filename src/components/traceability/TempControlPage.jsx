import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CachedIcon from "@mui/icons-material/Cached";
import {
  Grid,
  Typography,
  Paper,
  IconButton,
  Box,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  GlobalStyles,
} from "@mui/material";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
} from "@mui/x-data-grid";
import dayjs from "dayjs";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { useNavigate } from "react-router-dom";
import AcUnitOutlinedIcon from "@mui/icons-material/AcUnitOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import KeyboardReturnOutlinedIcon from "@mui/icons-material/KeyboardReturnOutlined";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import supabase from "../supabaseClient";
import { Tooltip } from "@mui/material";
import * as React from "react";

const TempControlPage = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editId, setEditId] = useState(null);
  const navigate = useNavigate();
  const [openKeypad, setOpenKeypad] = useState(false);
  const [selectedAppliance, setSelectedAppliance] = useState("");
  const [tempValue, setTempValue] = useState("");
  const [tempComment, setTempComment] = useState("");
  const [rows, setRows] = React.useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [rowModesModel] = React.useState({});

  // Get unique appliance names from your rows
  const uniqueAppliances = [
    ...new Set((rows || []).map((row) => row.appliance_name).filter(Boolean)),
  ];

  // Filter rows based on selected appliance
  const filteredRows = rows.filter((row) => {
    const matchesAppliance =
      !selectedAppliance || row.appliance_name === selectedAppliance;

    if (!row.log_date) return false;

    const logDate = new Date(row.log_date);
    const logDateOnly = new Date(
      logDate.getFullYear(),
      logDate.getMonth(),
      logDate.getDate()
    );

    const fromDateOnly = fromDate
      ? new Date(fromDate.year(), fromDate.month(), fromDate.date())
      : null;
    const toDateOnly = toDate
      ? new Date(toDate.year(), toDate.month(), toDate.date())
      : null;

    const matchesDate =
      (!fromDateOnly || logDateOnly >= fromDateOnly) &&
      (!toDateOnly || logDateOnly <= toDateOnly);

    return matchesAppliance && matchesDate;
  });

  // ✅ Define filtersAreActive **before using it in JSX**
  const filtersAreActive = !!fromDate || !!toDate || !!selectedAppliance;

  // Fetch items from Supabase on mount
  useEffect(() => {
    const fetchItems = async () => {
      const { data, error } = await supabase
        .from("appliences")
        .select("*")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching items:", error);
      } else {
        setItems(data);
      }
    };

    fetchItems();
  }, []);

  const handleAdd = () => {
    setEditId(null);
    setEditName("");
    setEditDescription("");
    setOpen(true);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setEditName(item.appliance);
    setEditDescription(item.description);
    setOpen(true);
  };

  const handleSave = async () => {
    if (editId) {
      // Update existing item with .select() to get updated data back
      const { data, error } = await supabase
        .from("appliences")
        .update({
          appliance: editName,
          description: editDescription,
        })
        .eq("id", editId)
        .select();

      if (error) {
        console.error(error);
        return;
      }

      if (data && data.length > 0) {
        setItems((prev) =>
          prev.map((item) => (item.id === editId ? data[0] : item))
        );
      } else {
        console.error("Update returned no data");
      }
    } else {
      // Insert new item
      const { data, error } = await supabase
        .from("appliences")
        .insert([{ appliance: editName, description: editDescription }])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }
      setItems((prev) => [...prev, data]);
    }

    setOpen(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Do you want to delete this item?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("appliences").delete().eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClose = () => {
    setOpen(false);
  };

  // Shared TextField styles
  const sharedStyles = {
    "& .MuiInputLabel-root": {
      color: "#38a3a5",
      fontSize: 14,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #38a3a5",
      },
      "&:hover fieldset": {
        borderColor: "darkGreen",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  // Save temperature log
  const handleSaveTemperature = async () => {
    if (!tempValue.trim()) {
      alert("Please enter a temperature before saving.");
      return;
    }

    const now = new Date();
    now.setHours(now.getHours() + 2); // add 2 hours
    const timestamp = now.toISOString();

    const { error } = await supabase.from("temp_logs").insert([
      {
        appliance_name: selectedAppliance?.appliance || "",
        log_date: timestamp,
        temperature: parseFloat(tempValue),
        comment: tempComment,
      },
    ]);

    if (error) {
      console.error("Error saving temperature:", error);
      return;
    }
    setOpenKeypad(false); // Close popup
    setTempValue(""); // Reset input
    setTempComment(""); // Reset comment
    setSelectedAppliance(null); // Reset appliance filter

    // Refresh DataGrid by refetching temp_logs
    const { data, error: selectError } = await supabase
      .from("temp_logs")
      .select("*");
    if (selectError) {
      console.error("Supabase SELECT error:", selectError.message);
    } else {
      const formattedData = data.map((item) => ({
        ...item,
        id: item.id,
        appliance_name: item.appliance_name,
        log_date: item.log_date,
        temperature: item.temperature,
        comment: item.comment,
        isNew: false,
      }));
      setRows(formattedData);
    }
  };

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("temp_logs").select("*");

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      const formattedData = data.map((item) => ({
        ...item,
        id: item.id,
        appliance_name: item.appliance_name,
        log_date: item.log_date,
        temperature: item.temperature,
        comment: item.comment,
        isNew: false,
      }));

      setRows(formattedData);
    };

    fetchData();
  }, []);

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleDeleteClick = (id) => async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this row?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("temp_logs").delete().eq("id", id);
    if (error) {
      console.error("Supabase DELETE error:", error.message);
      return;
    }

    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    // Notify parent
    onSupplierChange();
  };

  // Open keypad for temperature input
  const handleOpenKeypad = (appliance) => {
    setSelectedAppliance(appliance);
    setTempValue("");
    setTempComment("");
    setOpenKeypad(true);
  };

  // Define columns for the data grid
  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 80,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isInEditMode
          ? []
          : [
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDeleteClick(id)}
              />,
            ];
      },
    },
    {
      field: "appliance_name",
      headerName: "Appliance",
      width: 160,
      editable: true,
    },
    {
      field: "log_date",
      headerName: "Log Date",
      width: 200,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const date = new Date(params.value);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${day}-${month}-${year} | ${hours}:${minutes}`;
      },
    },

    {
      field: "temperature",
      headerName: "°C",
      width: 80,
      editable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "comment",
      headerName: "Comment",
      width: 750,
      editable: true,
    },
  ];

  return (
    <main className="max-w-7xl mx-auto py-6 px-1 lg:px-8 scrollbar-hide">
      <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8">
        {/* Add Button */}
        <motion.div className="flex grid-cols-2 gap-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 ml-2">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate(-1)}
            sx={{
              backgroundColor: "#778da9",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#415a77",
              },
              height: 40,
              borderRadius: 2,
              width: "100px",
            }}
          >
            <KeyboardReturnOutlinedIcon />
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={handleAdd}
            sx={{
              backgroundColor: "#3FA89B",
              color: "#fff",
              "&:hover": {
                backgroundColor: "#2f7f7a",
              },
              height: 40,
              width: "200px",
              borderRadius: 2,
            }}
          >
            Add Appliance
          </Button>

          {/* Dialog for adding/editing items */}
          <Dialog
            open={open}
            onClose={handleClose}
            PaperProps={{
              sx: {
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                padding: 1,
              },
            }}
          >
            <DialogTitle
              sx={{ fontWeight: 600, color: "#3FA89B", fontSize: 20 }}
            >
              {editId ? "Edit Item" : "Add New Item"}
            </DialogTitle>

            <DialogContent dividers>
              <TextField
                label="Item Name"
                fullWidth
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                sx={{
                  ...sharedStyles,
                  "& .MuiInputBase-input": {
                    color: "#3FA89B",
                    fontSize: 16,
                  },
                }}
              />
              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                sx={{
                  ...sharedStyles,
                  mt: 2,
                  "& .MuiInputBase-input": {
                    color: "#3FA89B",
                    fontSize: 16,
                  },
                }}
              />
            </DialogContent>

            <DialogActions>
              <Button
                variant="contained"
                onClick={handleClose}
                sx={{
                  width: 100,
                  backgroundColor: "#f0c808",
                  color: "#333",
                  "&:hover": { backgroundColor: "#ffba08" },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSave()}
                sx={{
                  width: 100,
                  mr: 2,
                  backgroundColor: "#3FA89B",
                  "&:hover": { backgroundColor: "#2f7f7a" },
                }}
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Key pad */}
          <Dialog
            open={openKeypad}
            onClose={() => setOpenKeypad(false)}
            PaperProps={{
              sx: {
                backgroundColor: "#f9f9f9",
                borderRadius: "8px",
                padding: 1,
              },
            }}
          >
            <DialogTitle
              sx={{ fontWeight: 600, color: "#3FA89B", fontSize: 20 }}
            >
              Enter Temperature for {selectedAppliance?.appliance}
            </DialogTitle>

            <DialogContent>
              <Box display="flex" justifyContent="center" mb={2}>
                <TextField
                  value={tempValue}
                  sx={{
                    ...sharedStyles,
                    "& .MuiInputBase-input": {
                      color: "#3FA89B",
                      fontSize: 16,
                    },
                  }}
                  inputProps={{
                    readOnly: true,
                  }}
                />
              </Box>

              <Box
                display="grid"
                gridTemplateColumns="repeat(3, 60px)"
                gap={1}
                justifyContent="center"
              >
                {[
                  "1",
                  "2",
                  "3",
                  "4",
                  "5",
                  "6",
                  "7",
                  "8",
                  "9",
                  "-",
                  "0",
                  ".",
                ].map((key) => (
                  <Button
                    key={key}
                    variant="contained"
                    onClick={() => setTempValue((prev) => prev + key)}
                    sx={{
                      fontSize: 26,
                      bgcolor: "#fff",
                      border: "1px solid #3FA89B",
                      color: "#555",
                      "&:hover": {
                        bgcolor: "#e6f2f1",
                        borderColor: "#3FA89B",
                      },
                    }}
                  >
                    {key}
                  </Button>
                ))}
              </Box>

              <TextField
                label="Comment (optional)"
                fullWidth
                multiline
                rows={3}
                value={tempComment}
                onChange={(e) => setTempComment(e.target.value)}
                sx={{
                  ...sharedStyles,
                  mt: 3,
                  "& .MuiInputBase-input": {
                    color: "#3FA89B",
                    fontSize: 16,
                  },
                }}
              />
            </DialogContent>

            {/* Dialog Actions */}
            <DialogActions
              sx={{
                display: "flex",
                gap: 1,
                width: "100%",
                justifyContent: "space-between",
              }}
            >
              <Button
                variant="contained"
                onClick={handleSaveTemperature}
                sx={{
                  flex: 1,
                  height: 40,
                  backgroundColor: "#3FA89B",
                  "&:hover": { backgroundColor: "#2f7f7a" },
                }}
              >
                Save
              </Button>

              <Button
                variant="contained"
                onClick={() => {
                  setTempValue("");
                  setTempComment("");
                }}
                sx={{
                  flex: 1,
                  height: 40,
                  backgroundColor: "#9eb3c2",
                  "&:hover": { backgroundColor: "#4f6d7a" },
                }}
              >
                Clear
              </Button>

              <Button
                variant="contained"
                onClick={() => setOpenKeypad(false)}
                sx={{
                  flex: 1,
                  height: 40,
                  backgroundColor: "#ff6b35",
                  "&:hover": { backgroundColor: "#d1495b" },
                }}
              >
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        </motion.div>

        <Box>
          {/* Items Grid */}
          <Grid
            container
            spacing={1}
            sx={{
              width: "100%",
              alignContent: "flex-start",
              mt: 0,
              mx: 0,
              mb: 2,
            }}
          >
            {items.map((item) => {
              if (!item) return null;

              return (
                <Grid
                  item
                  key={item.id}
                  xs={6} // 1 column on extra-small
                  sm={3} // 3 columns on small
                  md={3} // 3 columns on medium
                  lg={2} // 5 columns on large
                  sx={{
                    minWidth: 80, // ensures Paper never gets too narrow
                  }}
                >
                  <Tooltip
                    title={item.description || "No description"}
                    arrow
                    componentsProps={{
                      tooltip: {
                        sx: {
                          fontSize: 16,
                          backgroundColor: "#fff",
                          border: "1px solid #3FA89B",
                          borderRadius: "8px",
                          color: "#888",
                          fontWeight: "bold",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          maxWidth: 300,
                        },
                      },
                    }}
                  >
                    <Paper
                      elevation={2}
                      onClick={() => handleOpenKeypad(item)}
                      sx={{
                        width: "full",
                        height: 140,
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        backgroundColor: "#F5F5F5",
                        "&:hover": { backgroundColor: "#ebebeb" },
                        transition: "background-color 0.3s ease",
                        border: "1px solid #3FA89B",
                        borderRadius: "8px",
                      }}
                    >
                      <AcUnitOutlinedIcon
                        sx={{ fontSize: 50, color: "#3FA89B", mt: 1 }}
                      />
                      <Typography
                        variant="body2"
                        align="center"
                        sx={{
                          mt: 1,
                          color: "#3FA89B",
                          fontSize: 16,
                          mx: 1,
                        }}
                      >
                        {item.appliance}
                      </Typography>

                      {/* Edit/Delete Buttons */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: 4,
                          left: 4,
                          right: 4,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEdit(item);
                          }}
                          sx={{
                            color: "#00a8e8",
                            "&:hover": {
                              backgroundColor: "#c0c0c0",
                            },
                          }}
                        >
                          <EditIcon fontSize="medium" />
                        </IconButton>

                        <IconButton
                          size="small"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(item.id);
                          }}
                          sx={{
                            color: "#ff6b35",
                            "&:hover": {
                              backgroundColor: "#c0c0c0",
                            },
                          }}
                        >
                          <DeleteIcon fontSize="medium" />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Box>
        {/* </Box> */}

        {/* 2 nd Column Table of Content */}
        <Box
          sx={{
            height: "700px",
            width: "100%",
            border: "2px solid lightGray",
            borderRadius: 2,
            p: 1,
            mx: 1,
          }}
        >
          <Box
            display="grid"
            gap="10px"
            gridTemplateColumns="repeat(5, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 5" },
              mb: "20px",
            }}
          >
            {/* APPLIANCES */}
            <GlobalStyles
              styles={{
                ".MuiPickersPopper-root .MuiPaper-root": {
                  backgroundColor: "#f5f5f5 !important",
                  color: "#577590 !important",
                  fontSize: "1rem",
                  lineHeight: 1.8,
                  borderRadius: "8px",
                },

                // Day numbers (default state)
                ".MuiDayCalendar-weekContainer .MuiPickersDay-root": {
                  color: "#577590 !important",
                },

                // Selected day (override white-on-white)
                ".MuiDayCalendar-weekContainer .MuiPickersDay-root.Mui-selected":
                  {
                    backgroundColor: "#2a9d8f !important",
                    color: "#577590 !important",
                  },
                // Today’s date
                ".MuiDayCalendar-weekContainer .MuiPickersDay-root.MuiDayCalendar-dayWithMargin.MuiPickersDay-today":
                  {
                    border: "1px solid #2a9d8f",
                  },
                // ✅ Day-of-week headers (top row: S, M, T, etc.)
                ".MuiDayCalendar-header .MuiTypography-root": {
                  color: "#577590 !important",
                  fontWeight: 800,
                },
                ".MuiPickersCalendarHeader-root .MuiIconButton-root": {
                  color: "#577590 !important", // or any color you prefer
                },
                "& .MuiMenu-paper": {
                  backgroundColor: "white !important",
                  color: "#577590 !important",
                },
                "& .MuiMenuItem-root:hover": {
                  backgroundColor: "#eff1ed !important",
                },
                "& .MuiMenuItem-root:selected": {
                  backgroundColor: "red !important",
                },
              }}
            />
            <DesktopDatePicker
              label="From Date"
              value={fromDate}
              onChange={(newValue) => {
                const selectedDate = dayjs(newValue);
                setFromDate(selectedDate);
                // If toDate is empty or equal to old fromDate, update it too
                if (!toDate || toDate.isSame(fromDate, "day")) {
                  setToDate(selectedDate);
                }
              }}
              format="DD-MM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: "100%",
                  sx: {
                    "& .MuiInputBase-input": {
                      color: "dimGray !important",
                      fontSize: "16px",
                      fontWeight: 500, // semibold
                    },
                    "& .MuiInputLabel-root": {
                      color: "#38a3a5",
                    },
                    "& .MuiOutlinedInput-root": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#38a3a5", // default border
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "darkGreen", // hover border
                      },
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#38a3a5",
                    },
                  },
                },
              }}
            />

            <DesktopDatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(dayjs(newValue))}
              format="DD-MM-YYYY"
              slotProps={{
                textField: {
                  fullWidth: true,
                  sx: {
                    fullWidth: "100%",
                    "& .MuiInputBase-input": {
                      color: "dimGray !important",
                      fontSize: "16px",
                      fontWeight: 500, // semibold
                    },
                    "& .MuiInputLabel-root": {
                      color: "#38a3a5",
                    },
                    "& .MuiOutlinedInput-root": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#38a3a5", // default border
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: "darkGreen", // hover border
                      },
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#38a3a5",
                    },
                  },
                },
              }}
            />
            <FormControl
              sx={{
                ...sharedStyles,
                width: "100%",
                "& .MuiSelect-select": {
                  color: "dimGray !important",
                  fontSize: "16px",
                  fontWeight: 500,
                },
                "& .MuiSvgIcon-root": {
                  fontSize: "2.2rem",
                  color: "#38a3a5",
                },
                "& .MuiFormLabel-root": {
                  color: "#38a3a5 !important",
                },
              }}
            >
              <InputLabel id="appliance-label">Appliances</InputLabel>
              <Select
                labelId="appliance-label"
                label="Appliances" // ✅ tells the notch how big to open
                value={selectedAppliance}
                onChange={(e) => setSelectedAppliance(e.target.value)}
                sx={{
                  ...sharedStyles,
                }}
              >
                <MenuItem value="">
                  <em>All</em>
                </MenuItem>
                {uniqueAppliances
                  .sort((a, b) => a.localeCompare(b))
                  .map((applianceName) => (
                    <MenuItem key={applianceName} value={applianceName}>
                      {applianceName}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            <IconButton
              onClick={() => {
                setFromDate(null);
                setToDate(null);
                setSelectedAppliance("");
              }}
              sx={{
                width: "70px",
                "& .MuiSvgIcon-root": {
                  fontSize: "1.5rem", // adjust icon size as needed
                  color: filtersAreActive ? "#f07167" : "#3FA89B",
                  border: `1px solid ${
                    filtersAreActive ? "#f07167" : "#3FA89B"
                  }`,
                  borderRadius: 10,
                  width: "40px",
                  height: "40px",
                  "&:hover": {
                    backgroundColor: "#ebf2fa", // remove hover background
                  },
                },
              }}
            >
              <CachedIcon />
            </IconButton>
          </Box>

          {/* Data Grid */}
          <DataGrid
            rows={filteredRows} // Use filtered rows based on selected appliance
            columns={columns}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowEditStop={handleRowEditStop}
            getRowId={(row) => row.id}
            sx={{
              mr: 1,
              ml: 1,
              flexGrow: 1,
              height: "560px",
              width: "100%",
              border: "none",
              "& .MuiDataGrid-scrollbar": {
                overflow: "hidden",
                scrollBar: "none",
              },
              "& .MuiDataGrid-cell": {
                fontSize: "0.9rem",
                color: "#111", // dark text for light background
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontSize: "0.9rem",
                fontWeight: "bold",
              },
              "& .MuiButtonBase-root": {
                color: "#111",
              },
              "& .MuiDataGrid-columnHeader": {
                backgroundColor: "white !important",
                color: "#111",
              },
              "& .MuiDataGrid-scrollbarFiller": {
                backgroundColor: "white !important",
              },
              "& .MuiButton-text": {
                color: "#0d1b2a !important",
              },
              "& .MuiDataGrid-row--editing .MuiDataGrid-cell": {
                backgroundColor: "#e7ecef !important",
                // boxShadow: "none", // remove default shadow if needed
              },
              "& .MuiDataGrid-row--editing input": {
                color: "dimGray !important",
                fontSize: "15px",
                fontWeight: 600, // semibold
              },
              "& .MuiDataGrid-cell": {
                borderBlockColor: "lightGray",
                color: "dimGray !important",
                fontSize: "15px",
                fontWeight: 400, // semibold
              },
              // other global styles...
              "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='total_units_per_pack']":
                {
                  backgroundColor: "red", // light red
                  color: "#b71c1c", // dark red text
                  fontWeight: 600,
                  border: "2px solid #f44336",
                },
              "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='price_per_unit']":
                {
                  backgroundColor: "red", // light red
                  color: "#b71c1c", // dark red text
                  fontWeight: 600,
                  border: "2px solid #f44336",
                },
            }}
          />
        </Box>
      </motion.div>
    </main>
  );
};

export default TempControlPage;
