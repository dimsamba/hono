import AddIcon from "@mui/icons-material/Add";
import CachedIcon from "@mui/icons-material/Cached";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  GlobalStyles,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  GridToolbar,
  GridToolbarContainer,
} from "@mui/x-data-grid";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import React, { useEffect, useState, useMemo } from "react";
import dayjs from "dayjs";
import supabase from "../supabaseClient";
// Enable plugins once
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// 🔧 Toolbar for adding new rows
function EditToolbar({ setRows, setRowModesModel }) {
  const handleClick = () => {
    const id = crypto.randomUUID();
    const newRow = {
      id,
      amount: "",
      date: new Date(), // <<== Pre-fill today's date
      category: "",
      from: "",
      note: "",
      isNew: true,
    };

    setRows((prev) => [newRow, ...prev]);
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "amount" }, // 👈 Focus on new row
    }));
    // Removed setNewRowId as it is not needed
  };

  return (
    <GridToolbarContainer>
      <Button
        onClick={handleClick}
        startIcon={<AddIcon sx={{ color: "#3FA89B" }} />}
      >
        <Typography sx={{ color: "#3FA89B", fontWeight: 600 }}>
          Add new expense
        </Typography>
      </Button>
    </GridToolbarContainer>
  );
}

// 🔧 Combines custom toolbar + MUI toolbar
function CombinedToolbar({ setRows, setRowModesModel }) {
  return (
    <Stack spacing={1}>
      <EditToolbar
        setRows={setRows}
        // Removed setNewRowId as it is not needed
        setRowModesModel={setRowModesModel}
      />
      <GridToolbar
        sx={{
          "& .MuiSvgIcon-root": { color: "lightgray" },
          "& .MuiButtonBase-root": { color: "lightgray" },
        }}
      />
    </Stack>
  );
}

export default function FullFeaturedCrudGrid({
  FamilyFinanceTable,
  onFFChange,
  onFilteredRowsChange = () => {},
  onTotalValueChange = () => {},
}) {
  const [rows, setRows] = React.useState(FamilyFinanceTable); // Use the passed FamilyFinanceTable
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [, setExpensesFromFF] = React.useState(0);

  // 👇 Define custom editable date field
  const MyDateField = (params) => {
    const { id, field, value, api } = params;
    const dateValue = value ? dayjs(value) : dayjs();

    return (
      <DatePicker
        value={dateValue}
        onChange={(newValue) => {
          api.setEditCellValue(
            { id, field, value: newValue?.toISOString() },
            event
          ); // or without `event` if not available
        }}
        format="DD-MM-YYYY"
        slotProps={{
          textField: {
            variant: "outlined",
            size: "small",
            sx: {
              backgroundColor: "#e7ecef !important", // ✅ light red background
              "& .MuiInputBase-input": {
                color: "dimGray", // ✅ text color
                fontSize: "0.9rem",
                fontWeight: 400,
                padding: "14px", // adjust if needed
              },

              "& fieldset": {
                border: "1px solid #777", // optional border styling
              },
            },
          },
        }}
      />
    );
  };

  React.useEffect(() => {
    setRows(FamilyFinanceTable); // Update rows whenever FamilyFinanceTable changes
  }, [FamilyFinanceTable]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [] = React.useState(null);

  // Fetch "Paid "invoices between dates
  React.useEffect(() => {
    const fetchData = async () => {
      // Log fromDate and toDate before processing
      console.log("From Date:", fromDate);
      console.log("To Date:", toDate);

      // Ensure fromDate and toDate are not null and fallback to defaults
      const validFromDate = fromDate
        ? dayjs(fromDate)
        : dayjs().startOf("month"); // Default to current month's start
      const validToDate = toDate ? dayjs(toDate) : dayjs().endOf("month"); // Default to current month's end

      // Log whether the dates are valid
      console.log("Is 'fromDate' valid:", validFromDate.isValid());
      console.log("Is 'toDate' valid:", validToDate.isValid());

      // If either date is invalid, log an error
      if (!validFromDate.isValid() || !validToDate.isValid()) {
        console.error("Invalid date value detected:", fromDate, toDate);
        return; // Exit if the dates are invalid
      }

      const start = validFromDate.startOf("day").toISOString();
      const end = validToDate.endOf("day").toISOString();

      const { data, error } = await supabase
        .from("familyexpenses")
        .select("amount")
        .gte("date", start)
        .lte("date", end);

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      console.log("Fetching Family Expenses between", start, "and", end);

      const total = data.reduce((acc, curr) => acc + (curr.amount || 0), 0);
      setExpensesFromFF(total);
    };

    fetchData();
  }, [fromDate, toDate]);

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit },
    }));
    // Notify parent
    onFFChange();
  };

  const handleSaveClick = (id) => async () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View },
    }));

    await repeatRecurringExpenses(); // safe to call again

    onFFChange();
  };

  const handleDeleteClick = (id) => async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this row?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("familyexpenses")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase DELETE error:", error.message);
      return;
    }

    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    // Notify parent
    onFFChange();
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    }));

    const row = rows.find((r) => r.id === id);
    if (row?.isNew) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const processRowUpdate = async (newRow) => {
    const { isNew, id, ...cleanRow } = newRow;

    // Manual validation
    if (
      newRow.amount === null ||
      newRow.amount === undefined ||
      newRow.amount === ""
    ) {
      setSnackbar({ children: "Amount is required", severity: "error" });
      throw new Error("Amount is required");
    }

    if (isNaN(newRow.amount)) {
      setSnackbar({
        children: "Amount must be a number",
        severity: "error",
      });
      throw new Error("Amount must be a number");
    }

    try {
      if (isNew) {
        const { data: existing, error: fetchError } = await supabase
          .from("familyexpenses")
          .select("id")
          .eq("amount", cleanRow.amount)
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        // ✅ Insert new row
        const { data, error } = await supabase
          .from("familyexpenses")
          .insert([cleanRow])
          .select();

        if (error) throw error;

        const [inserted] = data;
        setRows((prev) => prev.map((row) => (row.id === id ? inserted : row)));
        return inserted;
      } else {
        // ✏️ Update existing row
        const { error } = await supabase
          .from("familyexpenses")
          .update(cleanRow)
          .eq("id", id);

        if (error) throw error;

        const updated = { ...cleanRow, id };
        setRows((prev) => prev.map((row) => (row.id === id ? updated : row)));
        return updated;
      }
    } catch (error) {
      console.error(`${isNew ? "Insert" : "Update"} error:`, error.message);
      return newRow;
    }
  };

  const handleRowModesModelChange = (newModel) => {
    setRowModesModel(newModel);
    // Notify parent
    onFFChange();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  // List of expense categories
  const expenseCategories = [
    "Bank Card",
    "Bank Card 2",
    "Car Expenses",
    "Clothing",
    "Dining Out / Takeaway",
    "Doctor / Dentist / Optician",
    "Electricity",
    "Groceries",
    "Health Insurance",
    "Hobbies",
    "Home Repairs / Maintenance",
    "House Appliances",
    "House Insurance",
    "Mobile Intrn / TV",
    "Mobile Tammy",
    "Others",
    "Parking Fees",
    "BB & BUBU",
    "Property Tax",
    "Public Transport Pass",
    "Rent",
    "Scooter Insurance",
    "Side Activities",
    "Software Subscriptions",
    "Supplies / Equipment",
    "Water Bill",
  ];

  // List of frequency categories
  const frequency = [
    "Daily",
    "Weekly",
    "Bi-Weekly",
    "Monthly",
    "Quarterly",
    "Semi-Annually",
    "Yearly",
    "One-Time",
    "Every 2 Months",
    "Every 3 Months",
    "Every 6 Months",
    "Every 2 Years",
  ];

  // Recurency of bills
  function shouldRepeatToday(lastDate, frequency) {
    const today = dayjs();
    const last = dayjs(lastDate);

    if (
      [
        "Monthly",
        "Quarterly",
        "Every 2 Months",
        "Every 3 Months",
        "Every 6 Months",
        "Semi-Annually",
        "Yearly",
        "Every 2 Years",
      ].includes(frequency)
    ) {
      const monthsToAdd = recurrenceMap[frequency];
      const nextDate = last.add(monthsToAdd, "month");
      return nextDate.isSame(today, "day");
    }

    if (["Weekly", "Bi-Weekly", "Daily"].includes(frequency)) {
      const daysToAdd = recurrenceMap[frequency];
      const nextDate = last.add(daysToAdd, "day");
      return nextDate.isSame(today, "day");
    }

    return false;
  }
  async function repeatRecurringExpenses() {
    const { data, error } = await supabase
      .from("familyexpenses")
      .select("*")
      .eq("note", "monthly bills");

    if (error) throw error;

    for (const row of data) {
      if (!row.frequency) continue;

      const shouldRepeat = shouldRepeatToday(row.date, row.frequency);

      if (shouldRepeat) {
        // Check if already saved today to avoid duplicates
        const { data: existing } = await supabase
          .from("familyexpenses")
          .select("*")
          .eq("date", dayjs().format("YYYY-MM-DD"))
          .eq("category", row.category)
          .eq("note", "monthly bills");

        if (existing.length === 0) {
          await supabase.from("familyexpenses").insert([
            {
              amount: row.amount,
              category: row.category,
              date: dayjs().format("YYYY-MM-DD"),
              from: null,
              note: "monthly bills",
              frequency: row.frequency,
            },
          ]);
        }
      }
    }

    console.log("Recurring expense check done.");
  }
  useEffect(() => {
    const runRecurring = async () => {
      try {
        await repeatRecurringExpenses(); // import or define this function
      } catch (err) {
        console.error("Error running recurring expense logic:", err);
      }
    };

    runRecurring();
  }, []);

  // Filter between dates
  // Get value between dates
  const { filteredRows, filteredTotalValue } = useMemo(() => {
    const filtered = (rows || []).filter((row) => {
      const rowDate = dayjs(row.date);

      if (fromDate && toDate) {
        return (
          rowDate.isSameOrAfter(fromDate, "day") &&
          rowDate.isSameOrBefore(toDate, "day")
        );
      }
      if (fromDate) {
        return rowDate.isSameOrAfter(fromDate, "day");
      }
      if (toDate) {
        return rowDate.isSameOrBefore(toDate, "day");
      }
      return true;
    });

    const total = filtered.reduce((sum, row) => sum + (row.amount || 0), 0);

    const paid = filtered
      .filter((row) => row.paid === true)
      .reduce((sum, row) => sum + (row.amount || 0), 0);

    const unpaid = filtered
      .filter((row) => row.paid === false)
      .reduce((sum, row) => sum + (row.amount || 0), 0);

    return {
      filteredRows: filtered,
      filteredTotalValue: total,
    };
  }, [rows, fromDate, toDate]); // Only recompute when these change

  // Format value to 2 decimal places
  const formattedFilteredTotalValue = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(filteredTotalValue);

  // ⬇️ Send filtered results to parent
  useEffect(() => {
    onFilteredRowsChange(filteredRows);
    onTotalValueChange(filteredTotalValue);
  }, [
    filteredRows,
    filteredTotalValue,
    onFilteredRowsChange,
    onTotalValueChange,
  ]);

  // Customize Toolbar
  const theme = createTheme({
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            "&.MuiDataGrid-paper": {
              backgroundColor: "#F2FAF8",
              color: "#333",
              fontWeight: 600,
            },
          },
        },
      },
    },
  });
  const isNonMobile = useMediaQuery("(min-width:600px)");

  // TextField and InputLabel customizations
  const sharedStyles = {
    backgroundColor: "#ebf1fa",
    "& .MuiInputLabel-root": {
      color: "#007f5f",
      fontSize: 14,
      backgroundColor: "#ebf1fa",
      px: 1,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #60d394",
      },
      "&:hover fieldset": {
        borderColor: "#60d394",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  useEffect(() => {
    const ids = rows.map((r) => r.id);
    const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (duplicates.length > 0) {
      console.warn("❌ Duplicate row IDs found:", duplicates);
    } else {
      console.log("✅ All row IDs are unique:", ids);
    }
  }, [rows]);

  const handleProcessRowUpdateError = (error, row) => {
    console.error("Update error:", error.message);
    setSnackbar({ children: error.message, severity: "error" }); // optional snackbar
    setRowModesModel((prevModel) => ({
      ...prevModel,
      [row.id]: { mode: "edit", ignoreModifications: true },
    }));
  };

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Actions",
      width: 100,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isInEditMode
          ? [
              <GridActionsCellItem
                icon={<SaveIcon />}
                label="Save"
                onClick={handleSaveClick(id)}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelClick(id)}
              />,
            ]
          : [
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={handleEditClick(id)}
              />,
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDeleteClick(id)}
              />,
            ];
      },
    },
    {
      field: "amount",
      headerName: "Amount",
      width: 100,
      editable: true,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${parseFloat(params.value).toFixed(2)}`
          : "",
    },
    {
      field: "date",
      headerName: "Date",
      width: 180,
      editable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const date = new Date(params.value);
        return <span>{formatDate(date)}</span>;
      },
      renderEditCell: (params) => <MyDateField {...params} />,
    },
    {
      field: "category",
      headerName: "Category",
      width: 250,
      editable: true,
      type: "singleSelect",
      valueOptions: expenseCategories,
      renderEditCell: (params) => (
        <Select
          value={params.value}
          onChange={(e) =>
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value,
            })
          }
          fullWidth
          sx={{
            color: "dimGray !important",
            fontSize: "15px",
            fontWeight: 600, // semibold
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: "#e7ecef",
                color: "black",
              },
            },
          }}
        >
          {params.colDef.valueOptions.map((option, index) => (
            <MenuItem key={`${String(option)}-${index}`} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "frequency",
      headerName: "Frequency",
      width: 180,
      editable: true,
      type: "singleSelect",
      valueOptions: frequency,
      renderEditCell: (params) => (
        <Select
          value={params.value}
          onChange={(e) =>
            params.api.setEditCellValue({
              id: params.id,
              field: params.field,
              value: e.target.value,
            })
          }
          fullWidth
          sx={{
            color: "dimGray !important",
            fontSize: "15px",
            fontWeight: 600, // semibold
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                backgroundColor: "#e7ecef",
                color: "black",
              },
            },
          }}
        >
          {params.colDef.valueOptions.map((option, index) => (
            <MenuItem key={`${String(option)}-${index}`} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "from",
      headerName: "From",
      width: 200,
      editable: true,
    },
    {
      field: "note",
      headerName: "Note",
      width: 250,
      editable: true,
    },
  ];

  return (
    <Box
      sx={{
        height: 700,
        width: "100%",
        border: "2px solid lightGray",
        borderRadius: 2,
        p: 1,
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          display="grid"
          gap="5px"
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            my: 1,
          }}
        >
          <GlobalStyles
            styles={{
              ".MuiPickersPopper-root .MuiPaper-root": {
                backgroundColor: "#f5f5f5 !important",
                color: "#4a5759 !important",
                fontSize: "1rem",
                lineHeight: 1.8,
                borderRadius: "8px",
              },

              // Day numbers (default state)
              ".MuiDayCalendar-weekContainer .MuiPickersDay-root": {
                color: "#4a5759 !important",
              },

              // Selected day (override white-on-white)
              ".MuiDayCalendar-weekContainer .MuiPickersDay-root.Mui-selected":
                {
                  backgroundColor: "#2a9d8f !important",
                  color: "#fff !important",
                },

              // Today’s date
              ".MuiDayCalendar-weekContainer .MuiPickersDay-root.MuiDayCalendar-dayWithMargin.MuiPickersDay-today":
                {
                  border: "1px solid #2a9d8f",
                },

              // ✅ Day-of-week headers (top row: S, M, T, etc.)
              ".MuiDayCalendar-header .MuiTypography-root": {
                color: "#4a5759 !important",
                fontWeight: 800,
              },
              ".MuiPickersCalendarHeader-root .MuiIconButton-root": {
                color: "#2a9d8f !important", // or any color you prefer
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
                variant: "outlined",
                sx: {
                  ...sharedStyles,
                  "& .MuiSvgIcon-root": {
                    color: "#2a9d8f",
                  },
                  "& .MuiInputBase-input": {
                    color: "#2a9d8f",
                    fontSize: "1rem",
                    fontWeight: 500,
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
                variant: "outlined",
                sx: {
                  ...sharedStyles,
                  "& .MuiSvgIcon-root": {
                    color: "#2a9d8f",
                  },
                  "& .MuiInputBase-input": {
                    color: "#2a9d8f",
                    fontSize: "1rem",
                    fontWeight: 500,
                  },
                },
              },
            }}
          />
          <IconButton
            onClick={() => {
              setFromDate(null);
              setToDate(null);
            }}
            sx={{
              width: "50px",
              "&:hover": {
                backgroundColor: "transparent", // remove hover background
              },
              "& .MuiSvgIcon-root": {
                fontSize: "2rem", // adjust icon size as needed
                color: "#577590", // customize icon color
              },
            }}
          >
            <CachedIcon />
          </IconButton>
        </Box>

        <ThemeProvider theme={theme}>
          <DataGrid
            rows={filteredRows} // Apply the filtered rows here
            columns={columns}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={handleRowModesModelChange}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(error, row) =>
              handleProcessRowUpdateError(error, row)
            }
            getRowId={(row) => row.id}
            slots={{
              toolbar: () => (
                <CombinedToolbar
                  setRows={setRows}
                  setRowModesModel={setRowModesModel}
                />
              ),
            }}
            sx={{
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
              "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='tva_perct']":
                {
                  backgroundColor: "red", // light red
                  color: "#b71c1c", // dark red text
                  fontWeight: 600,
                  border: "2px solid #f44336",
                },
            }}
          />
        </ThemeProvider>
      </LocalizationProvider>
    </Box>
  );
}
