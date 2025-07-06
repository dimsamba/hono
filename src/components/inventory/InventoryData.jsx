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
import ItemNameEditCell from "./ItemNameEditCell"; // Adjust path if needed
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
import { useEffect, useState, value, id } from "react";

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
          Add new Item
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

  // Fetch data from inventory table on mount
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
    const { isNew, id, ...rest } = newRow;

    // Safely parse numbers
    const qnty_item_pack = parseFloat(rest.qnty_item_pack) || 0;
    const unit_per_itm = parseFloat(rest.unit_per_itm) || 0;
    const price_per_pack = parseFloat(rest.price_per_pack) || 0;
    const yield_pct = parseFloat(rest.yield_pct) || 100;

    const total_units_per_pack = qnty_item_pack * unit_per_itm || 0;
    const price_per_unit = total_units_per_pack
      ? price_per_pack / total_units_per_pack
      : 0;
    const effective_price_per_unit =
      yield_pct !== 0 ? price_per_unit / (yield_pct / 100) : 0;
    const price_per_item =
      qnty_item_pack !== 0 ? price_per_pack / qnty_item_pack : 0;

    const cleanRow = {
      ...rest,
      total_units_per_pack,
      price_per_unit,
      effective_price_per_unit,
      price_per_item,
    };

    try {
      if (isNew) {
        // 🔍 Normalize input name
        const newNormalized = normalizeText(cleanRow.item_name);

        // 🔍 Fetch all names (lightweight)
        const { data: allItems, error: fetchError } = await supabase
          .from("inventory")
          .select("id, item_name");

        if (fetchError) throw fetchError;

        const isDuplicate = allItems?.some(
          (item) => normalizeText(item.item_name) === newNormalized
        );

        if (isDuplicate) {
          const msg = `Item "${cleanRow.item_name}" already exists.`;
          alert(msg);
          throw new Error(msg); // This cancels row insertion in DataGrid
        }

        // 🆕 Insert new item
        const { data, error } = await supabase
          .from("inventory")
          .insert([cleanRow])
          .select();

        if (error) throw error;

        const [inserted] = data;
        setRows((prev) => prev.map((row) => (row.id === id ? inserted : row)));
        return inserted;
      } else {
        // ✏️ Update existing item
        const { error } = await supabase
          .from("inventory")
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
      headerName: "Item Name",
      width: 200,
      editable: true,
      renderEditCell: (params) => (
        <ItemNameEditCell {...params} setRows={setRows} />
      ),
    },
    {
      field: "category",
      headerName: "Category",
      width: 180,
      editable: true,
      type: "singleSelect",
      valueOptions: [
        "Alcohol",
        "Appetizers",
        "Bakery",
        "Beverages",
        "Breads",
        "Canned-goods",
        "Cereals",
        "Cheese",
        "Charcuterie",
        "Chocolate",
        "Coffee-Tea",
        "complement",
        "Condiments",
        "Confectionery",
        "Dry",
        "Dried-Fruits",
        "Dried-Goods",
        "Dried-Nuts",
        "Dairy",
        "Dry-Goods",
        "Eggs",
        "Frozen-Foods",
        "Fruits-Vegetables",
        "Grains",
        "Herbs-Spices",
        "Meat",
        "Miscellaneous",
        "Nuts",
        "Oils-Fats",
        "Other",
        "Pasta",
        "Pastry-Goods",
        "Pickles",
        "Prepared Foods",
        "Preserves",
        "Produce",
        "Sauces",
        "Seafood",
        "Seeds",
        "Snacks",
        "Soups",
        "Spices",
        "Spirits",
        "Syrups",
        "Sweets-Desserts",
        "wines",
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
        "bar",
        "barrel",
        "basket",
        "batch",
        "bunch",
        "bundle",
        "barquette",
        "bottle",
        "box",
        "brick",
        "bucket",
        "can",
        "carton",
        "case",
        "cask",
        "cassette",
        "chest",
        "container",
        "crate",
        "drum",
        "flask",
        "foil",
        "glass",
        "filet",
        "jar",
        "jug",
        "kilo",
        "keg",
        "kit",
        "miscellaneous",
        "net",
        "none",
        "pack",
        "packet",
        "pail",
        "roll",
        "sack",
        "sachet",
        "shrink pack",
        "sheet",
        "slice",
        "tablettes",
        "tin",
        "tray",
        "tube",
        "unit",
        "vial",
        "wrap",
        "other",
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
      width: 100,
      editable: true,
      align: "center",
      headerAlign: "center",
      type: "singleSelect",
      valueOptions: [
        "bottle",
        "can",
        "cup",
        "dash",
        "dozen",
        "each",
        "cl",
        "fl",
        "gm",
        "kg",
        "lt",
        "lb",
        "miscellaneous",
        "ml",
        "none",
        "other",
        "oz",
        "piece",
        "pinch",
        "pint",
        "portion",
        "quart",
        "slice",
        "sheet",
        "sprig",
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
      editable: false,
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
          ? `€ ${parseFloat(params.value).toFixed(4)}`
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
              color: "#333 !important",
            },
            "& .MuiDataGrid-columnHeader": {
              backgroundColor: "white !important",
              color: "#333 !important",
            },
            "& .MuiDataGrid-scrollbarFiller": {
              backgroundColor: "white !important",
            },
            "& .MuiButton-text": {
              color: "#0d1b2a !important",
            },
            "& .MuiDataGrid-row--editing .MuiDataGrid-cell": {
              backgroundColor: "#edf2fb !important",
              //   boxShadow: "2", // remove default shadow if needed
            },
            "& .MuiDataGrid-row--editing input": {
              height: "100% !important",
              color: "dimGray !important",
              fontSize: "15px",
              fontWeight: 600,
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
                backgroundColor: "#bfbdc1 !important", // light red
                color: "#b71c1c", // dark red text
                fontWeight: 600,
                border: "2px solid #6d6a75",
              },
            "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='price_per_item']":
              {
                backgroundColor: "#bfbdc1 !important", // light red
                color: "#b71c1c", // dark red text
                fontWeight: 600,
                border: "2px solid #6d6a75",
              },
            "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='price_per_unit']":
              {
                backgroundColor: "#bfbdc1 !important", // light red
                color: "#b71c1c", // dark red text
                fontWeight: 600,
                border: "2px solid #6d6a75",
                borderLeft: "none",
              },
            "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='effective_price_per_unit']":
              {
                backgroundColor: "#bfbdc1 !important", // light red
                color: "#b71c1c", // dark red text
                fontWeight: 600,
                border: "2px solid #6d6a75",
              },
          }}
        />
      </ThemeProvider>
    </Box>
  );
}
