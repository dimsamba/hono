//import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import React, { useState, useEffect } from "react";
import { Box, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Chip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { tokens } from "../theme";
import { v4 as uuidv4 } from "uuid";
import {
  GridRowModes,
  DataGrid,
  GridToolbar,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import supabase from "../supabaseClient";

// 🔧 Toolbar for adding new rows
function EditToolbar({ setRows, setNewRowId, setRowModesModel }) {
  const handleAddClick = () => {
    const id = uuidv4();
    const newRow = {
      id, // or just "id," (ES6 shorthand)
      description: "",
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      recurring: false,
      frequency: "monthly",
      project_id: null,
      category_id: null,
      isNew: true,
    };

    setRows((prev) => [newRow, ...prev]);
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "description" },
    }));
    setNewRowId(id);
  };

  return (
    <GridToolbarContainer>
      <Button
        color="LightGray"
        onClick={handleAddClick}
        startIcon={<AddIcon />}
      >
        Add record
      </Button>
    </GridToolbarContainer>
  );
}

// 🔧 Combines custom toolbar + MUI toolbar
function CombinedToolbar({ setRows, setNewRowId, setRowModesModel }) {
  return (
    <Stack spacing={1}>
      <EditToolbar
        setRows={setRows}
        setNewRowId={setNewRowId}
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

export default function FullFeaturedCrudGrid({ CostData }) {
  const [rows, setRows] = React.useState(CostData); // Use the passed CostData
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  React.useEffect(() => {
    setRows(CostData); // Update rows whenever CostData changes
  }, [CostData]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [, setNewRowId] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("cost_items")
        .select(
          `id, description, amount, date, recurring, frequency, project_id, category_id`
        );

      if (!error) {
        setRows(data);
      }
    };

    fetchData();
  }, []);

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
   // setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
      setRowModesModel((prev) => ({
          ...prev,
          [id]: { mode: GridRowModes.Edit },
        }));
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit },
    }));
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View, ignoreModifications: true  },
    }));
  };

  const handleDeleteClick = (id) => async () => {
    await supabase.from("cost_items").delete().eq("id", id);
    setRows(rows.filter((row) => row.id !== id));
  };

  const processRowUpdate = async (newRow) => {
    const { error } = await supabase.from("cost_items").upsert(newRow);
    if (!error) {
      setRows((prev) =>
        prev.map((row) => (row.id === newRow.id ? newRow : row))
      );
    }
    return newRow;
  };

  const handleRowModesModelChange = (model) => {
    setRowModesModel(model);
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

  // Filter between dates
  // Get value between dates
  const filteredRows = (rows || []).filter((row) => {
    if (!fromDate && !toDate) return true;

    const rowDate = new Date(row.sale_date);

    if (fromDate && toDate) {
      return rowDate >= fromDate && rowDate <= toDate;
    }
    if (fromDate) {
      return rowDate >= fromDate;
    }
    if (toDate) {
      return rowDate <= toDate;
    }
    return true;
  });

  // Count entries between dates
  const entryCount = filteredRows.length;

  // Sum total_value_item
  const filteredTotalValue = filteredRows.reduce(
    (sum, row) => sum + (row.total_value_item || 0),
    0
  );

  // Format value to 2 decimal places
  const formattedFilteredTotalValue = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(filteredTotalValue);

  // Get the Invoice amount between Dates
  const getInvoicesTotalAmount = (invoices, fromDate, toDate) => {
    if (!invoices) return 0;
  
    return invoices
      .filter((inv) => {
        const createdAt = new Date(inv.created_at);
        if (fromDate && toDate) {
          return createdAt >= fromDate && createdAt <= toDate;
        } else if (fromDate) {
          return createdAt >= fromDate;
        } else if (toDate) {
          return createdAt <= toDate;
        }
        return true;
      })
      .reduce((sum, inv) => sum + (inv.amount_ttc || 0), 0);
  };
  const [invoicesData, setInvoicesData] = useState([]);
  useEffect(() => {
    if (!Array.isArray(rows)) return; // Prevents the error
  
    const invoicesRowIndex = rows.findIndex(
      (row) => row.description === "Invoices"
    );
  
    if (invoicesRowIndex !== -1) {
      const total = getInvoicesTotalAmount(invoicesData, fromDate, toDate);
  
      const updatedRows = [...rows];
      updatedRows[invoicesRowIndex] = {
        ...updatedRows[invoicesRowIndex],
        amount: total,
      };
      setRows(updatedRows);
    }
  }, [fromDate, toDate, rows, invoicesData]);  


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
      field: "description",
      headerName: "Description",
      width: 250,
      editable: true,
      type: "singleSelect",
      valueOptions: [
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
        "Insurance premiums",
        "Invoices",
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
      ],
    },
    {
      field: "amount",
      headerName: "Amount (€)",
      type: "number",
      width: 120,
      editable: true,
      align: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${parseFloat(params.value).toFixed(2)}`
          : "",
    },
    {
      field: "date",
      headerName: "Date",
      width: 180,
      type: "timestamp",
      editable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const formattedDate = formatDate(params.value);
        return <span>{formattedDate}</span>;
      },
      renderEditCell: (params) => {
        let value = params.value;

        // Make sure it's a Date object, or default to today
        if (typeof value === "string") {
          value = new Date(value);
        } else if (!value) {
          value = new Date();
        }
        // Check if the value is a valid date
        return (
          <DatePicker
            value={value}
            onChange={(newValue) => {
              params.api.setEditCellValue({
                id: params.id,
                field: "invoice_date",
                value: newValue,
              });
            }}
            renderInput={(inputParams) => <TextField {...inputParams} />}
            sx={{
              "& .MuiInputLabel-root": {
                "&.Mui-open": {
                  backgroundColor: `#202938 !important`,
                },
              },
              "& .MuiOutlinedInput-root": {
                "& fieldset": {
                  borderColor: "#202938 !important",
                },
              },
            }}
          />
        );
      },
    },
    {
      field: "recurring",
      headerName: "Recurring",
      type: "boolean",
      width: 120,
      editable: true,
      renderCell: (params) => (
        <Chip
          label={params.value ? "Yes" : "No"}
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
      field: "frequency",
      headerName: "Frequency",
      width: 120,
      editable: true,
      type: "singleSelect",
      valueOptions: ["monthly", "yearly", "quarterly", "weekly"],
    },
    {
      field: "project_id",
      headerName: "Project ID",
      width: 100,
      editable: true,
      type: "number",
    },
    {
      field: "category_id",
      headerName: "Category ID",
      width: 100,
      editable: true,
      type: "number",
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        display="grid"
        gap="15px"
        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
        sx={{
          "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
          mb: "20px",
        }}
      >
        <DatePicker
          label="From Date"
          value={fromDate}
          onChange={(newValue) => setFromDate(newValue)}
          renderInput={(params) => <TextField {...params} />}
          sx={{
            gridColumn: "span 1",
          }}
        />
        <DatePicker
          label="To Date"
          value={toDate}
          onChange={(newValue) => setToDate(newValue)}
          renderInput={(params) => <TextField {...params} />}
          sx={{
            gridColumn: "span 1",
          }}
        />
        <Box
          sx={{
            display: "flex", // Enable flexbox layout
            justifyContent: "left", // Center horizontally
            alignItems: "center", // Center vertically
            height: "100%", // Make sure Box takes up the full height
            gridColumn: "span 2",
          }}
        >
          <Button
            color="LightGray"
            onClick={() => {
              setFromDate(null);
              setToDate(null);
            }}
            startIcon={<AutorenewIcon sx={{ ml: "11px", scale: 1.3 }} />}
            sx={{
              height: "45px",
              width: "10%", // Full width button
              "&:hover": {
                scale: 1.15, // Scale up on hover
                border: "1px solid white", // Change this to the color you want on hover
                color: "#white", // Change this to the color you want on hover
                cursor: "pointer", // Make the cursor pointer to show it's clickable
              },
            }}
          ></Button>
          <Typography
            variant="h5"
            color="lightGray"
            fontWeight="bold"
            sx={{
              ml: "20px",
            }}
          >
            € {formattedFilteredTotalValue}
          </Typography>
          <Typography
            variant="h5"
            color="lightGray"
            fontWeight="bold"
            sx={{
              ml: "20px",
            }}
          >
            {entryCount} Entries
          </Typography>
        </Box>
      </Box>
      <Box sx={{ height: 900, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          editMode="row"
          rowModesModel={rowModesModel}
          onRowModesModelChange={handleRowModesModelChange}
          onRowEditStop={handleRowEditStop}
          processRowUpdate={processRowUpdate}
          getRowId={(row) => row.id}
          slots={{
            toolbar: () => (
              <CombinedToolbar
                setRows={setRows}
                setNewRowId={setNewRowId}
                setRowModesModel={setRowModesModel}
              />
            ),
          }}
          sx={{
            "& .MuiDataGrid-scrollbar": {
              overflow: "hidden",
              scrollBar: "none",
            },
            "& .MuiDataGrid-cell": {
              fontSize: "0.9rem",
              color: "LightGray",
            },
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: `#202938 !important`,
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              color: "White !important",
              fontSize: "0.9rem",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-filler": {
              backgroundColor: `#202938 !important`,
            },
            "& .MuiDataGrid-scrollbarFiller": {
              backgroundColor: `#202938 !important`,
            },
            // eliminate columns NUMBER arrow up/down
            "& input[type=number]::-webkit-inner-spin-button, & input[type=number]::-webkit-outer-spin-button":
              {
                WebkitAppearance: "none",
                margin: 0,
              },
            "&. editInputCell": {
              backgroundColor: "white !important",
              color: "white !important",
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
