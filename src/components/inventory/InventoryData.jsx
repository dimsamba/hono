import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import { Stack, Typography } from "@mui/material";
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
import * as React from "react";
import supabase from "../supabaseClient";

// 🔧 Toolbar for adding new rows
function EditToolbar({ setRows, setNewRowId, setRowModesModel }) {
  const handleClick = () => {
    const id = Date.now();
    const newRow = {
      id,
      item_name: "",
      category: "",
      pack_type: "",
      qnty_item_pack: "",
      unit_type: "",
      unit_per_itm: "",
      total_units_per_pack: "",
      price_per_pack: "",
      price_per_item: "",
      price_per_unit: "",
      yield_pct: "",
      effective_price_per_unit: "",
      supplier: "",
      note: "",
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
          Add record
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

export default function FullFeaturedCrudGrid({
  InventoryData,
  onInventoryChanges,
}) {
  const [rows, setRows] = React.useState(InventoryData); // Use the passed inventoryData

  React.useEffect(() => {
    setRows(InventoryData); // Update rows whenever inventoryData changes
  }, [InventoryData]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [, setNewRowId] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("inventory").select("*");

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      const formattedData = data.map((item) => ({
        ...item,
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
    onInventoryChanges();
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View },
    }));
    // Notify parent
    onInventoryChanges();
  };

  const handleDeleteClick = (id) => async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this row?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("inventory").delete().eq("id", id);

    if (error) {
      console.error("Supabase DELETE error:", error.message);
      return;
    }

    setRows((prevRows) => prevRows.filter((row) => row.id !== id));
    // Notify parent
    onInventoryChanges();
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

    cleanRow.total_units_per_pack =
      cleanRow.qnty_item_pack * cleanRow.unit_per_itm;
    cleanRow.price_per_unit =
      cleanRow.price_per_pack / cleanRow.total_units_per_pack;
    cleanRow.effective_price_per_unit =
      cleanRow.price_per_unit / (cleanRow.yield_pct / 100);
    cleanRow.price_per_item = cleanRow.price_per_pack / cleanRow.qnty_item_pack;

    if (isNew) {
      const { data, error } = await supabase
        .from("inventory")
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
        .from("inventory")
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
    onInventoryChanges();
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
                sx={{
                  color: "#333 !important",
                }}
              />,
              <GridActionsCellItem
                icon={<CancelIcon />}
                label="Cancel"
                onClick={handleCancelClick(id)}
                sx={{
                  color: "#333 !important",
                }}
              />,
            ]
          : [
              <GridActionsCellItem
                icon={<EditIcon />}
                label="Edit"
                onClick={handleEditClick(id)}
                sx={{
                  color: "#333 !important",
                }}
              />,
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDeleteClick(id)}
                sx={{
                  color: "#333 !important",
                }}
              />,
            ];
      },
    },
    {
      field: "item_name",
      headerName: "Item",
      width: 180,
      editable: true,
    },
    {
      field: "category",
      headerName: "Category",
      width: 200,
      editable: true,
      type: "singleSelect",
      valueOptions: [
        "Bakery",
        "Beverages",
        "Canned-goods",
        "Charcuterie",
        "Condiments",
        "Dry",
        "Dairy",
        "Dry-Goods",
        "Eggs",
        "Frozen-Foods",
        "Fruits-Vegetables",
        "Grains",
        "Herbs",
        "Meat",
        "Nuts",
        "Oils-Fats",
        "Pasta",
        "Pastry-Goods",
        "Prepared Foods",
        "Produce",
        "Sauces",
        "Seafood",
        "Snacks",
        "Spices",
        "Sweets-Desserts",
      ],
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
          {params.colDef.valueOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "pack_type",
      headerName: "Pack Type",
      width: 150,
      editable: true,
      type: "singleSelect",
      valueOptions: [
        "bag",
        "bottle",
        "box",
        "bucket",
        "can",
        "carton",
        "case",
        "container",
        "crate",
        "drum",
        "jar",
        "jug",
        "keg",
        "pack",
        "pail",
        "roll",
        "sack",
        "shrink pack",
        "tin",
        "tray",
        "tube",
        "tub",
        "wrap",
      ],
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
          {params.colDef.valueOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "qnty_item_pack",
      headerName: "Qty/Pack",
      type: "number",
      width: 100,
      editable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "unit_type",
      headerName: "Unit",
      width: 120,
      editable: true,
      align: "center",
      headerAlign: "center",
      type: "singleSelect",
      valueOptions: [
        "bottle",
        "cl",
        "gm",
        "kg",
        "lt",
        "lb",
        "ml",
        "oz",
        "piece",
        "portion",
        "sheet",
        "slice",
        "sprig",
        "tbsp",
        "tsp",
        "unit",
      ],
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
          {params.colDef.valueOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </Select>
      ),
    },
    {
      field: "unit_per_itm",
      headerName: "Unit/Item",
      width: 100,
      type: "number",
      editable: true,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `${parseFloat(params.value).toFixed(0)}`
          : "",
    },
    {
      field: "total_units_per_pack",
      headerName: "Unit/pack",
      width: 100,
      type: "number",
      editable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `${parseFloat(params.value).toFixed(0)}`
          : "",
    },
    {
      field: "price_per_pack",
      headerName: "€ Pack",
      type: "numeric",
      width: 100,
      editable: true,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${parseFloat(params.value).toFixed(2)}`
          : "",
    },
    {
      field: "price_per_item",
      headerName: "€ Item",
      type: "numeric",
      width: 100,
      editable: true,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${parseFloat(params.value).toFixed(2)}`
          : "",
    },
    {
      field: "price_per_unit",
      headerName: "€ Unit",
      type: "numeric",
      width: 100,
      editable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${parseFloat(params.value).toFixed(4)}`
          : "",
    },
    {
      field: "yield_pct",
      headerName: "Yield",
      type: "percent",
      width: 100,
      editable: true,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `${parseFloat(params.value).toFixed(0)} %`
          : "",
    },
    {
      field: "effective_price_per_unit",
      headerName: "Efective €",
      type: "numeric",
      width: 100,
      editable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${parseFloat(params.value).toFixed(3)}`
          : "",
    },
    {
      field: "supplier",
      headerName: "Supplier",
      width: 150,
      editable: true,
    },
    {
      field: "note",
      headerName: "Note",
      width: 180,
      editable: true,
    },
  ];

  return (
    <Box
      sx={{
        height: 900,
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
          disableVirtualization
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
            "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='effective_price_per_unit']":
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
