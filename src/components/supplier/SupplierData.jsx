import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import { Stack, Typography } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
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
      name: "",
      contact: "",
      company: "",
      isNew: true,
    };

    setRows((prev) => [newRow, ...prev]);
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "name" }, // 👈 Focus on new row
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
          Add supplier
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

export default function FullFeaturedCrudGrid({ SupplierData }) {
  const [rows, setRows] = React.useState(SupplierData);

  React.useEffect(() => {
    setRows(SupplierData); // Update rows whenever SupplierData changes
  }, [SupplierData]);

  const [rowModesModel, setRowModesModel] = React.useState({});
  const [] = React.useState(null);

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("suppliers").select("*");

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      const formattedData = data.map((item) => ({
        ...item,
        id: item.id,
        name: item.name,
        contact: item.contact,
        company: item.company,
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

    const { error } = await supabase.from("suppliers").delete().eq("id", id);
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

    if (isNew) {
      const { data, error } = await supabase
        .from("suppliers")
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
        .from("suppliers")
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
    { field: "name", headerName: "Name", width: 180, editable: true },
    {
      field: "contact",
      headerName: "Contact",
      width: 150,
      editable: true,
      align: "center",
      headerAlign: "center",
    },
    {
      field: "company",
      headerName: "Company",
      width: 150,
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
