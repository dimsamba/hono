import AddIcon from "@mui/icons-material/Add";
import CachedIcon from "@mui/icons-material/Cached";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import {
  Chip,
  GlobalStyles,
  IconButton,
  Stack,
  Typography,
  useMediaQuery,
  FormControl,
  InputLabel,
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
import InvoiceNumberEditCell from "./InvoiceNumberEditCell";

// Enable plugins once
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// 🔧 Toolbar for adding new rows
function EditToolbar({ setRows, setRowModesModel, filtersAreActive }) {
  const handleClick = () => {
    const id = crypto.randomUUID();
    const newRow = {
      id,
      invoice_numb: "",
      invoice_date: new Date(), // <<== Pre-fill today's date
      amount_ht: "",
      amount_ttc: "",
      category: "",
      tva_perct: 0,
      paid: false,
      from: "",
      note: "",
      isNew: true,
    };

    setRows((prev) => [newRow, ...prev]);
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "invoice_numb" }, // 👈 Focus on new row
    }));
    // Removed setNewRowId as it is not needed
  };

  return (
    <GridToolbarContainer>
      <Button
        onClick={handleClick}
        startIcon={
          <AddIcon sx={{ color: filtersAreActive ? "#f07167" : "#3FA89B" }} />
        }
        disabled={filtersAreActive}
        sx={{
          border: `1px solid ${filtersAreActive ? "#f07167" : "#3FA89B"}`,
          "&:hover": {
            border: "px solid #3FA89B",
          },
        }}
      >
        <Typography
          sx={{
            color: filtersAreActive ? "#f07167" : "#3FA89B",
            fontWeight: 600,
          }}
        >
          Add new expense
        </Typography>
      </Button>
    </GridToolbarContainer>
  );
}

// 🔧 Combines custom toolbar + MUI toolbar
function CombinedToolbar({ setRows, setRowModesModel, filtersAreActive }) {
  return (
    <Stack spacing={1}>
      <EditToolbar
        setRows={setRows}
        setRowModesModel={setRowModesModel}
        filtersAreActive={filtersAreActive}
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

export default function FullFeaturedCrudGrid({
  InvoiceData,
  onInvoiceChange,
  onFilteredRowsChange = () => {},
  onTotalValueChange = () => {},
  onPaidValueChange = () => {},
  onUnpaidValueChange = () => {},
}) {
  const [rows, setRows] = React.useState(InvoiceData); // Use the passed inventoryData
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [entryDate, setEntryDate] = useState(null);
  const [, setExpensesFromInvoices] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPaid, setSelectedPaid] = useState("");
  const [selectedFrom, setSelectedFrom] = useState("");
  const uniqueCategories = [
    ...new Set(rows.map((row) => row.category).filter(Boolean)),
  ];
  // const uniquePaid = [...new Set(rows.map((row) => row.paid).filter(Boolean))];
  const uniquePaid = [...new Set(rows.map((row) => row.paid))]; // Keep both true and false
  const uniqueFrom = [...new Set(rows.map((row) => row.from).filter(Boolean))];

  // Active Filters
  const filtersAreActive =
    fromDate !== null ||
    toDate !== null ||
    entryDate !== null ||
    selectedCategory !== "" ||
    selectedPaid !== "" ||
    selectedFrom !== "";

  React.useEffect(() => {
    setRows(InvoiceData); // Update rows whenever inventoryData changes
  }, [InvoiceData]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [] = React.useState(null);

  // Fetch "Paid "invoices between dates
  React.useEffect(() => {
    const fetchData = async () => {
      // Log fromDate and toDate before processing
      console.log("From Date:", fromDate);
      console.log("To Date:", toDate);
      console.log("To Date:", entryDate);

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
        .from("invoices")
        .select("amount_ttc")
        .gte("invoice_date", start)
        .lte("invoice_date", end)
        .eq("paid", true);

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      console.log("Fetching invoices between", start, "and", end);

      const total = data.reduce((acc, curr) => acc + (curr.amount_ttc || 0), 0);
      setExpensesFromInvoices(total);
    };

    fetchData();
  }, [fromDate, toDate, entryDate]);

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
    onInvoiceChange();
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View },
    }));
    // Notify parent
    onInvoiceChange();
  };

  const handleDeleteClick = (id) => async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this row?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("invoices").delete().eq("id", id);

    if (error) {
      console.error("Supabase DELETE error:", error.message);
      return;
    }

    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    // Notify parent
    onInvoiceChange();
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

    // Calculate TVA %
    cleanRow.tva_perct =
      (cleanRow.amount_ttc - cleanRow.amount_ht) / cleanRow.amount_ht;
    cleanRow.tva_perct = cleanRow.tva_perct ? cleanRow.tva_perct * 100 : 0;

    // ❗ Manual validation
    if (
      newRow.amount_ttc === null ||
      newRow.amount_ttc === undefined ||
      newRow.amount_ttc === ""
    ) {
      setSnackbar({ children: "Amount TTC is required", severity: "error" });
      throw new Error("Amount TTC is required");
    }

    if (isNaN(newRow.amount_ttc)) {
      setSnackbar({
        children: "Amount TTC must be a number",
        severity: "error",
      });
      throw new Error("Amount TTC must be a number");
    }

    try {
      if (isNew) {
        const { data: existing, error: fetchError } = await supabase
          .from("invoices")
          .select("id")
          .eq("invoice_numb", cleanRow.invoice_numb)
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (existing) {
          alert(`Invoice: "${cleanRow.invoice_numb}" already exists.`);
          return newRow;
        }

        // ✅ Insert new row
        const { data, error } = await supabase
          .from("invoices")
          .insert([cleanRow])
          .select();

        if (error) throw error;

        const [inserted] = data;
        setRows((prev) => prev.map((row) => (row.id === id ? inserted : row)));
        return inserted;
      } else {
        // ✏️ Update existing row
        const { error } = await supabase
          .from("invoices")
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
    onInvoiceChange();
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
    "Accountant fee",
    "Advertising & promotions",
    "Banking & transaction fees",
    "Cleaning services & supplies",
    "Consultancy fees",
    "Customs and import duties",
    "Depreciation & amortization",
    "Emplacement rent",
    "Employees Charges",
    "Equipment purchases",
    "Fees",
    "Food & beverages",
    "Freight & shipping costs",
    "Insurance premiums",
    "IT & Software purchases",
    "IT & Software subscriptions",
    "Legal fees",
    "License cost",
    "Loan interests & financing costs",
    "Maintenance",
    "Marketing & Sales",
    "Materials",
    "Material rent",
    "Office supplies & consumables",
    "Other charges",
    "Other fees",
    "Other rents",
    "Packaging and branding",
    "Phone & Internet services",
    "Property improvements",
    "Recruitment costs",
    "Revenue Tax",
    "Sales commissions",
    "Shipping & delivery charges",
    "Staff benefits",
    "Storage costs",
    "Supplies",
    "Taxes (TVA)",
    "Training & professional development",
    "Transport cost",
    "Uniforms or protective clothing",
    "Utilities bills",
    "Vehicle purchases",
    "Warehousing costs",
    "Website and SEO services",
    "Work hours",
  ];

  // Filter between dates
  // Get value between dates
  const {
    filteredRows,
    filteredTotalValue,
    filteredPaidValue,
    filteredUnpaidValue,
  } = useMemo(() => {
    let filtered = (rows || []).filter((row) => {
      const rowDate = dayjs(row.invoice_date);

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

    if (entryDate) {
      filtered = filtered.filter((row) =>
        dayjs(row.created_at).isSame(entryDate, "day")
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((row) => row.category === selectedCategory);
    }

    // Paid filter
    if (selectedPaid !== "") {
      const paidBool = selectedPaid === "true";
      filtered = filtered.filter((row) => row.paid === paidBool);
    }

    // From filter
    if (selectedFrom) {
      filtered = filtered.filter((row) => row.from === selectedFrom);
    }

    const total = filtered.reduce((sum, row) => sum + (row.amount_ttc || 0), 0);

    const paid = filtered
      .filter((row) => row.paid === true)
      .reduce((sum, row) => sum + (row.amount_ttc || 0), 0);

    const unpaid = filtered
      .filter((row) => row.paid === false)
      .reduce((sum, row) => sum + (row.amount_ttc || 0), 0);

    return {
      filteredRows: filtered,
      filteredTotalValue: total,
      filteredPaidValue: paid,
      filteredUnpaidValue: unpaid,
      filtered,
    };
  }, [
    rows,
    fromDate,
    toDate,
    entryDate,
    selectedCategory,
    selectedPaid,
    selectedFrom,
  ]); // Only recompute when these change

  // ⬇️ Send filtered results to parent
  useEffect(() => {
    onFilteredRowsChange(filteredRows);
    onTotalValueChange(filteredTotalValue);
    onPaidValueChange(filteredPaidValue);
    onUnpaidValueChange(filteredUnpaidValue);
  }, [
    filteredRows,
    filteredTotalValue,
    filteredPaidValue,
    filteredUnpaidValue,
    onFilteredRowsChange,
    onTotalValueChange,
    onPaidValueChange,
    onUnpaidValueChange,
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

   // Customization for decimals and thousands separators
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
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
      field: "invoice_numb",
      headerName: "Invoice N.",
      width: 150,
      align: "right",
      headerAlign: "right",
      editable: true,
      renderEditCell: (params) => (
        <InvoiceNumberEditCell {...params} setRows={setRows} />
      ),
    },
    {
      field: "invoice_date",
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
      field: "amount_ht",
      headerName: "Amt HT",
      width: 100,
      editable: true,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${formatCurrency(parseFloat(params.value))}`
          : "",
    },
    {
      field: "amount_ttc",
      headerName: "Amt TTC",
      width: 100,
      editable: true,
      type: "number",
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${formatCurrency(parseFloat(params.value))}`
          : "",
    },
    {
      field: "tva_perct",
      headerName: "TVA %",
      width: 100,
      type: "percent",
      align: "right",
      headerAlign: "right",
      editable: false,
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `${formatCurrency(parseFloat(params.value))} %`
          : "",
    },
    {
      field: "paid",
      headerName: "Paid",
      type: "boolean", // enables checkbox rendering
      width: 120,
      editable: true,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Paid" : "Unpaid"}
          color={params.value ? "success" : "error"}
          size="small"
          sx={{
            width: "70px",
            "& .MuiChip-root": {},
          }}
        />
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
    {
      field: "created_at",
      headerName: "Entry Date",
      width: 180,
      editable: false,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const date = new Date(params.value);
        return <span>{formatDate(date)}</span>;
      },
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
            my: 0,
          }}
        >
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
                variant: "outlined",
                sx: {
                  "& .MuiInputBase-input": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500,
                  },
                  "& .MuiInputLabel-root": {
                    color: "#38a3a5",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#38a3a5",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "darkGreen",
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
                variant: "outlined",
                sx: {
                  "& .MuiInputBase-input": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500,
                  },
                  "& .MuiInputLabel-root": {
                    color: "#38a3a5",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#38a3a5",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "darkGreen",
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
            label="Entry Date"
            value={entryDate}
            onChange={(newValue) => setEntryDate(dayjs(newValue))}
            format="DD-MM-YYYY"
            slotProps={{
              textField: {
                variant: "outlined",
                sx: {
                  "& .MuiInputBase-input": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500,
                  },
                  "& .MuiInputLabel-root": {
                    color: "#38a3a5",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#38a3a5",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "darkGreen",
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#38a3a5",
                  },
                },
              },
            }}
          />

          <IconButton
            onClick={() => {
              setFromDate(null);
              setToDate(null);
              setEntryDate(null);
              setSelectedCategory(""); // Reset Category
              setSelectedPaid(""); // Reset paid
              setSelectedFrom(""); // Reset from
            }}
            sx={{
              width: "70px",
              "& .MuiSvgIcon-root": {
                fontSize: "1.5rem", // adjust icon size as needed
                color: filtersAreActive ? "#f07167" : "#3FA89B",
                border: `1px solid ${filtersAreActive ? "#f07167" : "#3FA89B"}`,
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
        {/* Filter Selects */}
        <Box
          display="grid"
          gap="5px"
          gridTemplateColumns="repeat(3, minmax(0, 1fr))"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            my: 1,
          }}
        >
          <FormControl
            sx={{
              ...sharedStyles,
              width: "100%",
              // Selected value text
              "& .MuiSelect-select": {
                color: "#17395d !important", // this is where you set the main text color
                fontSize: "16px",
                fontWeight: 500,
              },
              // Dropdown icon (arrow)
              "& .MuiSvgIcon-root": {
                fontSize: "2.2rem",
                color: "#38a3a5", // customize icon color
              },
              "& .MuiFormLabel-root": {
                color: "#38a3a5 !important",
              },
            }}
          >
            <InputLabel>Category</InputLabel>

            <Select
              value={selectedCategory}
              label="Category"
              onChange={(e) => setSelectedCategory(e.target.value)}
              sx={{
                ...sharedStyles,
              }}
            >
              {/* NEW: “All” option */}
              <MenuItem value="">
                <em>All</em>
              </MenuItem>

              {[...uniqueCategories]
                .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
                .map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <FormControl
            sx={{
              ...sharedStyles,
              width: "100%",
              // Selected value text
              "& .MuiSelect-select": {
                color: "#17395d !important", // this is where you set the main text color
                fontSize: "16px",
                fontWeight: 500,
              },
              // Dropdown icon (arrow)
              "& .MuiSvgIcon-root": {
                fontSize: "2.2rem",
                color: "#38a3a5", // customize icon color
              },
              "& .MuiFormLabel-root": {
                color: "#38a3a5 !important",
              },
            }}
          >
            <InputLabel>Paid / Unpaid</InputLabel>
            <Select
              value={selectedPaid}
              label="Paid / Unpaid"
              onChange={(e) => setSelectedPaid(e.target.value)}
              sx={{
                ...sharedStyles,
              }}
            >
              <MenuItem value="">
                <em>All</em>
              </MenuItem>

              {uniquePaid.map((paid) => (
                <MenuItem key={paid} value={String(paid)}>
                  {paid === true ? "Paid" : "Unpaid"}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            sx={{
              ...sharedStyles,
              width: "100%",
              // Selected value text
              "& .MuiSelect-select": {
                color: "#17395d !important", // this is where you set the main text color
                fontSize: "16px",
                fontWeight: 500,
              },
              // Dropdown icon (arrow)
              "& .MuiSvgIcon-root": {
                fontSize: "2.2rem",
                color: "#38a3a5", // customize icon color
              },
              "& .MuiFormLabel-root": {
                color: "#38a3a5 !important",
              },
            }}
          >
            <InputLabel>From</InputLabel>
            <Select
              value={selectedFrom}
              label="From"
              onChange={(e) => setSelectedFrom(e.target.value)}
              sx={{
                ...sharedStyles,
              }}
            >
              {/* NEW: “All” option */}
              <MenuItem value="">
                <em>All</em>
              </MenuItem>

              {[...uniqueFrom]
                .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
                .map((from) => (
                  <MenuItem key={from} value={from}>
                    {from}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
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
                  filtersAreActive={filtersAreActive}
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
