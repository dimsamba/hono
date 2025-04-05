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
      unit: "",
      quantity: 0,
      price_per_unit: 0,
      total_cost: 0,
      supplier: "",
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

export default function FullFeaturedCrudGrid() {
  const [rows, setRows] = React.useState([]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [setNewRowId] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("inventory").select("*");

      if (error) {
        console.error("Fetch error:", error.message);
        return;
      }

      const formattedData = data.map((item) => ({
        ...item,
        price_per_unit:
          item.price_per_unit != null && !isNaN(item.price_per_unit)
            ? `€ ${item.price_per_unit.toFixed(2)}`
            : "€ 0.00",
        total_cost:
          item.total_cost != null && !isNaN(item.total_cost)
            ? `€ ${item.total_cost.toFixed(2)}`
            : "€ 0.00",
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

    const { data, error } = await supabase
      .from("inventory")
      .delete()
      .eq("id", id);
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

    cleanRow.total_cost = cleanRow.quantity * cleanRow.price_per_unit;

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
    { field: "item_name", headerName: "Item", width: 180, editable: true },
    {
      field: "category",
      headerName: "Category",
      width: 150,
      editable: true,
      type: "singleSelect",
      valueOptions: [
        "Bakery",
        "Beverages",
        "Canned-goods",
        "Charcuterie",
        "Condiments",
        "Dairy",
        "Dry-food",
        "Frozen-food",
        "Spices",
        "Meat",
        "Oils-and-fats",
        "Pasta",
        "Produce",
        "Seafood",
        "Snacks",
        "Sweets-and-desserts",
      ],
    },
    {
      field: "unit",
      headerName: "Unit",
      width: 80,
      editable: true,
      type: "singleSelect",
      valueOptions: [
        "bag",
        "botte",
        "box",
        "can",
        "cl",
        "Carton",
        "cup",
        "gm",
        "jar",
        "kg",
        "Lt",
        "mg",
        "ml",
        "packet",
        "pcs",
      ],
    },
    {
      field: "quantity",
      headerName: "Qty",
      type: "number",
      width: 80,
      editable: true,
    },
    {
      field: "price_per_unit",
      headerName: "€ Unit",
      type: "number",
      width: 100,
      editable: true,
    },
    {
      field: "total_cost",
      headerName: "Total €",
      type: "number",
      width: 100,
      editable: false,
    },
    { field: "supplier", headerName: "Supplier", width: 180, editable: true },
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
         
        }}
      />
    </Box>
  );
}
