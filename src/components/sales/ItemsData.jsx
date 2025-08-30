import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CachedIcon from "@mui/icons-material/Cached";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import {
  Stack,
  Typography,
  FormControl,
  InputLabel,
  useMediaQuery,
  IconButton,
  GlobalStyles,
} from "@mui/material";
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
import React, { useEffect, useState, useMemo } from "react";
import supabase from "../supabaseClient";

// 🔧 Toolbar for adding new rows
function EditToolbar({
  setRows,
  setNewRowId,
  setRowModesModel,
  filtersAreActive,
}) {
  const handleClick = () => {
    const id = Date.now();
    const newRow = {
      id,
      item_name: "",
      item_price: "",
      details: "",
      category: "",
      image: "",
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
          Add new Item to Sell
        </Typography>
      </Button>
    </GridToolbarContainer>
  );
}

// 🔧 Combines custom toolbar + MUI toolbar
function CombinedToolbar({
  setRows,
  setNewRowId,
  setRowModesModel,
  filtersAreActive,
}) {
  return (
    <Stack spacing={1}>
      <EditToolbar
        setRows={setRows}
        setNewRowId={setNewRowId}
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

export default function FullFeaturedCrudGrid({
  ItemsData,
  onItemsChange,
  onFilteredRowsChange = () => {},
  onTotalValueChange = () => {},
}) {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [rows, setRows] = React.useState(ItemsData);
  const [selectedCategory, setSelectedCategory] = useState("");
  const uniqueCategories = [
    ...new Set(rows.map((row) => row.category).filter(Boolean)),
  ];

  // Active Filters
  const filtersAreActive = selectedCategory !== "";

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

  // Filter between dates
  // Get value between dates
  // 1. Filter rows by date
  const { filteredRows, filteredTotalValue } = useMemo(() => {
    let filtered = rows;

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter((row) => row.category === selectedCategory);
    }

    const total = filtered.reduce(
      (sum, row) => sum + (parseFloat(row.amount) || 0),
      0
    );

    return { filteredRows: filtered, filteredTotalValue: total };
  }, [rows, selectedCategory]);

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

  // TextField and InputLabel customizations
  const sharedStyles = {
    "& .MuiInputLabel-root": {
      color: "#38a3a5",
      fontSize: 14,
      px: 1,
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

  // Handle file upload
  const handleFileUpload = async (file, params) => {
    try {
      // Create a unique filename
      const fileName = `${Date.now()}-${file.name}`;

      // Upload to "images" bucket
      const { data, error } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: publicUrl } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      // Update row with permanent URL
      params.api.setEditCellValue({
        id: params.id,
        field: params.field,
        value: publicUrl.publicUrl,
      });
    } catch (err) {
      console.error("Upload failed:", err.message);
    }
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
      field: "image",
      headerName: "Image",
      width: 300,
      editable: true,
      renderCell: (params) =>
        params.value ? (
          <img
            src={params.value}
            alt={params.row.item_name}
            style={{
              width: 80,
              height: 60,
              objectFit: "cover",
              borderRadius: 4,
            }}
          />
        ) : (
          <span style={{ color: "#888" }}>No image</span>
        ),
      renderEditCell: (params) => (
        <input
          type="file"
          accept="image/*"
          style={{ width: "100%" }}
          onChange={async (e) => {
            const file = e.target.files[0];
            if (file) {
              await handleFileUpload(file, params);
            }
          }}
        />
      ),
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
      <Box
        display="grid"
        gap="5px"
        gridTemplateColumns="repeat(3, minmax(0, 1fr))"
        sx={{
          "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
          my: 1,
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
            ".MuiDayCalendar-weekContainer .MuiPickersDay-root.Mui-selected": {
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
            {[...uniqueCategories]
              .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
              .map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
        <IconButton
          onClick={() => {
            setSelectedCategory("");
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
      <ThemeProvider theme={theme}>
        <DataGrid
          rows={filteredRows}
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
