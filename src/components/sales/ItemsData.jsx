import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { Stack, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import NewItemEditCell from "../inventory/NewItemEditCell";
import { normalizeText } from "../../utils/normalizeText";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  GridToolbar,
  GridToolbarContainer,
} from "@mui/x-data-grid";
import * as React from "react";
import supabase from "../supabaseClient";

// 🔧 Toolbar for adding new rows
function EditToolbar({ setRows, setNewRowId, setRowModesModel }) {
  const handleClick = () => {
    const id = Date.now();
    const newRow = {
      id,
      item_name: "",
      item_price: "",
      details: "",
      isNew: true,
    };

    setRows((prev) => [newRow, ...prev]);
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "item_name" }, // 👈 Focus on new row
    }));
    setNewRowId(id);
  };

  return (
    <GridToolbarContainer>
      <Button
        onClick={handleClick}
        startIcon={<AddIcon sx={{ color: "#3FA89B" }} />}
      >
        <Typography sx={{ color: "#3FA89B", fontWeight: 600 }}>
          Add new Item to Sell
        </Typography>
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

export default function FullFeaturedCrudGrid({ ItemsData, onItemsChange }) {
  const [rows, setRows] = React.useState(ItemsData);

  React.useEffect(() => {
    setRows(ItemsData); // Update rows whenever SupplierData changes
  }, [ItemsData]);

  const [rowModesModel, setRowModesModel] = React.useState({});
  const [] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("itemsList").select("*");

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      const formattedData = data.map((item) => ({
        ...item,
        id: item.id,
        item_name: item.item_name,
        item_price: item.item_price,
        details: item.details,
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

  const handleEditClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit },
    }));
    // Notify parent
    onItemsChange();
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View },
    }));
    // Notify parent
    onItemsChange();
  };

  const handleDeleteClick = (id) => async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this row?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("itemsList").delete().eq("id", id);
    if (error) {
      console.error("Supabase DELETE error:", error.message);
      return;
    }

    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    // Notify parent
    onItemsChange();
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
    cleanRow.item_name = cleanRow.item_name.trim();
    const normalizedInput = normalizeText(cleanRow.item_name);

    try {
      if (isNew) {
        const { data, error: fetchError } = await supabase
          .from("itemsList")
          .select("id, item_name");

        if (fetchError) throw fetchError;

        const isDuplicate = data.some((item) => {
          const dbNormalized = normalizeText(item.item_name);
          return dbNormalized === normalizedInput;
        });

        if (isDuplicate) {
          alert(`Item "${cleanRow.item_name}" already exists.`);
          return { ...newRow, _error: true }; // Tag for later use if needed
        }

        const { data: insertData, error } = await supabase
          .from("itemsList")
          .insert([cleanRow])
          .select();

        if (error) throw error;

        const [inserted] = insertData;
        setRows((prev) => prev.map((row) => (row.id === id ? inserted : row)));
        return inserted;
      } else {
        const { error } = await supabase
          .from("itemsList")
          .update(cleanRow)
          .eq("id", id);

        if (error) throw error;

        const updatedRow = { ...cleanRow, id };
        setRows((prev) =>
          prev.map((row) => (row.id === id ? updatedRow : row))
        );
        return updatedRow;
      }
    } catch (err) {
      console.error(`${isNew ? "Insert" : "Update"} error:`, err.message);
      return newRow;
    }
  };

  const handleRowModesModelChange = (newModel) => {
    setRowModesModel(newModel);
    // Notify parent
    onItemsChange();
  };

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
      field: "item_name",
      headerName: "Item",
      width: 180,
      editable: true,
      renderEditCell: (params) => (
        <NewItemEditCell {...params} setRows={setRows} />
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
      editable: true,
      align: "left",
      headerAlign: "left",
      type: "singleSelect",
      valueOptions: ["Food", "Beverage", "Produces"],
    },
    {
      field: "item_price",
      headerName: "Price",
      type: "numeric",
      align: "right",
      headerAlign: "right",
      width: 120,
      editable: true,
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(params.value)}`
          : "",
    },
    {
      field: "details",
      headerName: "Details",
      width: 400,
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
      <ThemeProvider theme={theme}>
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
      </ThemeProvider>
    </Box>
    // </motion.div>
  );
}
