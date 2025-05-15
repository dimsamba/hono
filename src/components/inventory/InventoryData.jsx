import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { Stack } from "@mui/material";
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
      <Button color="LightGray" onClick={handleClick} startIcon={<AddIcon />}>
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

export default function FullFeaturedCrudGrid({ InventoryData }) {
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
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.View },
    }));
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
      field: "item_name",
      headerName: "Item",
      width: 180,
      editable: true,
    },
    {
      field: "category",
      headerName: "Category",
      width: 120,
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
        "Dry-food",
        "Frozen-food",
        "Fruits and-vegetables",
        "Meat",
        "Oils-and-fats",
        "Pasta",
        "Produce",
        "Seafood",
        "Snacks",
        "Spices",
        "Sweets-and-desserts",
      ],
    },
    {
      field: "pack_type",
      headerName: "Pack Type",
      width: 100,
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
  );
}
