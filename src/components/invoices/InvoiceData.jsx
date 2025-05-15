import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Chip } from "@mui/material";
import dayjs from "dayjs";

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
function EditToolbar({ setRows, setRowModesModel }) {
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
      <Button color="LightGray" onClick={handleClick} startIcon={<AddIcon />}>
        Add record
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

export default function FullFeaturedCrudGrid({ InvoiceData, onInvoiceChange }) {
  const [rows, setRows] = React.useState(InvoiceData); // Use the passed inventoryData

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
              backgroundColor: `#121212 !important`,
              border: "0px solid lightgray",
              alignContent: "center",
              padding: "0px",
              "& .MuiInputBase-input": {
                color: "white",
                fontSize: "0.9rem",
                padding: "15px",
                border: "0px solid lightgray",
              },
            },
          },
        }}
      />
    );
  };

  React.useEffect(() => {
    setRows(InvoiceData); // Update rows whenever inventoryData changes
  }, [InvoiceData]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("invoices").select("*");

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      const formattedData = data.map((item) => ({
        ...item,
        id: item.id || crypto.randomUUID(), // Ensure each row has a unique id
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

    cleanRow.tva_perct =
      (cleanRow.amount_ttc - cleanRow.amount_ht) / cleanRow.amount_ht;
    cleanRow.tva_perct = cleanRow.tva_perct ? cleanRow.tva_perct * 100 : 0;

    if (isNew) {
      const { data, error } = await supabase
        .from("invoices")
        .insert([cleanRow])
        .select();
      if (error) {
        console.error("Insert error:", error.message);
        return newRow;
      }

      const [inserted] = data;
      setRows((prev) => prev.map((row) => (row.id === id ? inserted : row)));
      return inserted;
    } else {
      const { error } = await supabase
        .from("invoices")
        .update(cleanRow)
        .eq("id", id);
      if (error) {
        console.error("Update error:", error.message);
        return newRow;
      }

      setRows((prev) =>
        prev.map((row) => (row.id === id ? { ...cleanRow, id } : row))
      );
      return { ...cleanRow, id };
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
          ? `€ ${parseFloat(params.value).toFixed(2)}`
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
          ? `€ ${parseFloat(params.value).toFixed(2)}`
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
          ? `${parseFloat(params.value).toFixed(2)} %`
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
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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

            "& .MuiDataGrid-row.MuiDataGrid-row--editing": {
              backgroundColor: "white !important", // Light orange for editing rows
            },
            "& .MuiDataGrid-scrollbarFiller--header": {
              backgroundColor: '#202938 !important'
            }
          }}
        />
      </Box>
    </LocalizationProvider>
  );
}
