import React, { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import { Stack } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { Typography, useMediaQuery, useTheme } from "@mui/material";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";

import {
  GridRowModes,
  DataGrid,
  GridToolbar,
  GridToolbarContainer,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import supabase from "../supabaseClient";

// Enable plugins once
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

// 🔧 Toolbar for adding new rows
function EditToolbar({ setRows, setNewRowId, setRowModesModel }) {
  const handleClick = () => {
    const id = Date.now();
    const newRow = {
      id,
      sale_date: new Date(), // <<== Pre-fill today's date
      item_name: "",
      item_type: "",
      sale_price: "",
      total_value_item: "",
      quantity_sold: "",
      notes: "",
      isNew: true,
    };

    setRows((prev) => [newRow, ...prev]);
    setRowModesModel((prev) => ({
      ...prev,
      [id]: { mode: GridRowModes.Edit, fieldToFocus: "sale_date" }, // 👈 Focus on new row
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

export default function FullFeaturedCrudGrid({ SalesTable }) {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const [rows, setRows] = React.useState(SalesTable); // Use the passed SalesTable
  const [recipes, setRecipes] = React.useState([]);
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

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
    setRows(SalesTable); // Update rows whenever SalesTable changes
  }, [SalesTable]);
  const [rowModesModel, setRowModesModel] = React.useState({});
  const [, setNewRowId] = React.useState(null);

  // Fetch Recipes when component mounts
  React.useEffect(() => {
    const fetchRecipes = async () => {
      const { data, error } = await supabase
        .from("recipes")
        .select("id, recipe_name, recipe_type, actual_sale_price");
      if (error) {
        console.error("Supabase Recipes fetch error:", error.message);
        return;
      }
      setRecipes(data || []);
    };

    fetchRecipes();
  }, []);

  // Fetch Recipes ddata
  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("sales").select("*");

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

    const { error } = await supabase.from("sales").delete().eq("id", id);

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

    cleanRow.total_value_item = cleanRow.quantity_sold * cleanRow.sale_price;

    if (isNew) {
      const { data, error } = await supabase
        .from("sales")
        .insert([cleanRow])
        .eq("id", id)
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
        .from("sales")
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
    const rowDate = dayjs(row.sale_date);
  
    if (fromDate && toDate) {
      return rowDate.isSameOrAfter(fromDate, "day") && rowDate.isSameOrBefore(toDate, "day");
    }
    if (fromDate) {
      return rowDate.isSameOrAfter(fromDate, "day");
    }
    if (toDate) {
      return rowDate.isSameOrBefore(toDate, "day");
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
      field: "sale_date",
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
      field: "item_name",
      headerName: "Item",
      width: 150,
      align: "left",
      headerAlign: "left",
      editable: true,
      renderEditCell: (params) => {
        const handleChange = (event) => {
          const selectedRecipeName = event.target.value;
          const selectedRecipe = recipes.find(
            (r) => r.recipe_name === selectedRecipeName
          );

          if (selectedRecipe) {
            params.api.setEditCellValue(
              {
                id: params.id,
                field: "item_name",
                value: selectedRecipe.recipe_name,
              },
              event
            );
            params.api.setEditCellValue(
              {
                id: params.id,
                field: "item_type",
                value: selectedRecipe.recipe_type,
              },
              event
            );
            params.api.setEditCellValue(
              {
                id: params.id,
                field: "sale_price",
                value: selectedRecipe.actual_sale_price,
              },
              event
            );
          }
        };

        return (
          <Select
            value={params.value || ""}
            onChange={handleChange}
            fullWidth
            sx={{
              color: "lightgray",
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#202938" },
            }}
          >
            {recipes.map((recipe) => (
              <MenuItem key={recipe.id} value={recipe.recipe_name}>
                {recipe.recipe_name}
              </MenuItem>
            ))}
          </Select>
        );
      },
    },
    {
      field: "item_type",
      headerName: "Type",
      width: 150,
      editable: true,
    },
    {
      field: "sale_price",
      headerName: "Price",
      align: "right",
      headerAlign: "right",
      width: 100,
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
      field: "quantity_sold",
      headerName: "Qty",
      align: "center",
      headerAlign: "center",
      width: 80,
      editable: true,
    },
    {
      field: "total_value_item",
      headerName: "Total €",
      type: "numeric",
      width: 100,
      editable: false,
      align: "right",
      headerAlign: "right",
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `€ ${new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(params.value)}`
          : "",      
    },

    { field: "notes", headerName: "Notes", width: 250, editable: true },
  ];

  return (
    <Box sx={{ height: 900, width: "100%" }}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          display="grid"
          gap="15px"
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            mb: "20px",
          }}
        >
           <DesktopDatePicker  
            label="From Date"
            value={fromDate}
            onChange={(newValue) => setFromDate(dayjs(newValue))}
            renderInput={(params) => <TextField {...params} fullWidth/>}
            format="DD-MM-YYYY"
            sx={{
              gridColumn: "span 1",
            }}
          />
          <DesktopDatePicker
            label="To Date"
            value={toDate}
            onChange={(newValue) => setToDate(dayjs(newValue))}
            renderInput={(params) => <TextField {...params} fullWidth/>}
            format="DD-MM-YYYY"
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
              Total from {entryCount} Sales
            </Typography>
          </Box>
        </Box>
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
      </LocalizationProvider>
    </Box>
  );
}
