import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CachedIcon from "@mui/icons-material/Cached";
import {
  GlobalStyles,
  Stack,
  IconButton,
  useMediaQuery,
  InputLabel,
  FormControl,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import React, { useState, useEffect, useMemo } from "react";
import {
  DataGrid,
  GridActionsCellItem,
  GridRowEditStopReasons,
  GridRowModes,
  GridToolbar,
} from "@mui/x-data-grid";
import supabase from "../supabaseClient";

// 🔧 Toolbar for adding new rows
function EditToolbar() {}

// 🔧 Combines custom toolbar + MUI toolbar
function CombinedToolbar({
  setRows,
  setNewRowId,
  setRowModesModel,
  selectionModel,
  handleDeleteSelected,
}) {
  return (
    <Stack spacing={1} direction="row" alignItems="center">
      {/* Existing toolbar buttons */}
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

      {/* Bulk Delete Button */}
      <Button
        variant="outlined"
        onClick={handleDeleteSelected}
        disabled={selectionModel.length === 0}
        sx={{
          width: "140px",
          fontSize: "0.8rem", // adjust icon size as needed
          color:
            selectionModel.length > 0
              ? "#d00000 !important"
              : "#999 !important",
          borderRadius: 1,
          border: "1px solid #ff0054",
          fontWeight: 500,
          minWidth: "140px",
          height: "100%",
          "&:hover": {
            //  backgroundColor: "#e7e7e7", // remove hover background
            border: "1px solid #d00000",
          },
        }}
      >
        Delete ({selectionModel.length})
      </Button>
    </Stack>
  );
}

// Enable plugins once
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function FullFeaturedCrudGrid({
  SalesTable,
  onSalesChange,
  onMetricsChange,
}) {
  const [rows, setRows] = React.useState(SalesTable); // Use the passed SalesTable
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [, setNewRowId] = React.useState(null);
  const [selectedPaiment, setSelectedPaiment] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [selectionModel, setSelectionModel] = React.useState([]);

  const handleDeleteSelected = async () => {
    if (selectionModel.length === 0) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${selectionModel.length} row(s)?`
    );
    if (!confirmDelete) return;

    // Delete from Supabase
    const { error } = await supabase
      .from("sales")
      .delete()
      .in("id", selectionModel); // <-- delete all selected IDs at once

    if (error) {
      console.error("Supabase bulk DELETE error:", error.message);
      alert("Error deleting rows.");
      return;
    }

    // Remove from local state
    setRows((prevRows) =>
      prevRows.filter((row) => !selectionModel.includes(row.id))
    );

    // Reset selection
    setSelectionModel([]);

    // Optional: notify parent
    onSalesChange();
  };

  const uniquePaiment = [
    ...new Set((rows || []).map((row) => row.payment_type).filter(Boolean)),
  ];
  const uniqueItem = [
    ...new Set(
      (rows || [])
        .flatMap((row) => row.items?.map((item) => item.name) ?? [])
        .filter(Boolean)
    ),
  ];

  const filtersAreActive =
    fromDate !== null ||
    toDate !== null ||
    selectedPaiment !== "" ||
    selectedItem !== "";

  React.useEffect(() => {
    setRows(SalesTable); // Update rows whenever SalesTable changes
  }, [SalesTable]);
  const [rowModesModel, setRowModesModel] = React.useState({});

  // Fetch Sales data
  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("sales").select("*");

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      const formattedData = data.map((item) => {
        let itemsString = "";

        try {
          const parsedItems =
            typeof item.items === "string"
              ? JSON.parse(item.items)
              : item.items;

          itemsString = parsedItems
            .map((i) => {
              const unitPrice = i["disc-price"] ?? i.price;
              const isDiscounted = !!i["disc-price"];
              return `${i.quantity} x ${i.name} €${parseFloat(
                unitPrice
              ).toFixed(2)}${isDiscounted ? "" : ""} = €${parseFloat(
                i.total
              ).toFixed(2)}`;
            })
            .join("\n"); // Line breaks for each item
        } catch (err) {
          console.warn("Failed to parse items:", item.items, err);
          itemsString = "";
        }

        return {
          ...item,
          items_display: itemsString,
        };
      });

      setRows(formattedData);
    };

    fetchData();
  }, []);

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
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
    // Notify parent
    onSalesChange();
  };

  const processRowUpdate = async (newRow) => {
    const { isNew, id, ...cleanRow } = newRow;

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
    // Notify parent
    onSalesChange();
  };

  // Filter between dates
  // Get value between dates
  const filteredData = useMemo(() => {
    let totalSalesAmount = 0;
    let totalEntries = 0;
    let totalItemsCount = 0;
    let totalIndvItems = 0;
    let filteredItemCount = 0;

    const filteredRows = (rows || []).filter((row) => {
      const rowDate = dayjs(row.date);

      if (fromDate && rowDate.isBefore(fromDate, "day")) return false;
      if (toDate && rowDate.isAfter(toDate, "day")) return false;
      if (selectedPaiment && row.payment_type !== selectedPaiment) return false;

      const rowItems =
        typeof row.items === "string" ? JSON.parse(row.items) : row.items || [];

      if (selectedItem) {
        const hasItem = rowItems.some(
          (i) =>
            i.name?.trim().toLowerCase() === selectedItem.trim().toLowerCase()
        );
        if (!hasItem) return false;
      }

      // Passed all filters — count things
      totalEntries += 1;
      totalSalesAmount += Number(row.sale_total_disc) || 0;
      totalItemsCount += Number(row.total_items) || 0;

      rowItems.forEach((i) => {
        totalIndvItems += Number(i.quantity) || 0;

        if (
          selectedItem &&
          i.name?.trim().toLowerCase() === selectedItem.trim().toLowerCase()
        ) {
          filteredItemCount += Number(i.quantity) || 0;
        }
      });

      return true;
    });

    return {
      filteredRows,
      totalSalesAmount,
      totalEntries,
      totalItems: totalItemsCount,
      totalindvItems: totalIndvItems,
      filteredItemCount,
    };
  }, [rows, fromDate, toDate, selectedPaiment, selectedItem]);

  // Notify parent of changes
  useEffect(() => {
    onMetricsChange(filteredData);
  }, [filteredData]);

  // 👇 Now you can safely use these in your JSX or other logic
  const { filteredRows } = filteredData;

  // Customize Toolbar
  const themeGrid = createTheme({
    components: {
      MuiPaper: {
        styleOverrides: {
          root: {
            "&.MuiDataGrid-paper": {
              backgroundColor: "#F2FAF8",
              color: "red",
              fontWeight: 600,
            },
          },
        },
      },
    },
  });

  // TextField and InputLabel customizations
  const sharedStyles = {
    "& .MuiInputLabel-root": {
      color: "#38a3a5",
      fontSize: 14,
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

  //Fetch from sales table
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("sales").select("items");

      if (error) {
        console.error("Error fetching sales data:", error.message);
        return;
      }

      const itemCounts = {};

      data.forEach(({ items }) => {
        if (items) {
          let parsedItems;

          try {
            // Supabase might return items already as an object, or as a JSON string
            parsedItems = typeof items === "string" ? JSON.parse(items) : items;
          } catch (e) {
            console.error("Error parsing item JSON:", e);
            return;
          }

          parsedItems.forEach(({ name, quantity }) => {
            if (!name || !quantity) return;
            itemCounts[name] = (itemCounts[name] || 0) + Number(quantity);
          });
        }
      });
    };

    fetchData();
  }, []);

  const columns = [
    {
      field: "actions",
      type: "actions",
      headerName: "Del",
      width: 60,
      cellClassName: "actions",
      getActions: ({ id }) => {
        const isInEditMode = rowModesModel[id]?.mode === GridRowModes.Edit;
        return isInEditMode
          ? []
          : [
              <GridActionsCellItem
                icon={<DeleteIcon />}
                label="Delete"
                onClick={handleDeleteClick(id)}
              />,
            ];
      },
    },
    {
      field: "id",
      headerName: "Sales N.",
      type: "numeric",
      align: "right",
      headerAlign: "right",
      width: 80,
      editable: true,
    },
    {
      field: "orderNumber",
      headerName: "Order N.",
      type: "numeric",
      align: "right",
      headerAlign: "right",
      width: 80,
      editable: true,
    },
    {
      field: "date",
      headerName: "Date",
      width: 150,
      editable: true,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const date = new Date(params.value);

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");

        const formattedDate = `${day}-${month}-${year} | ${hours}:${minutes}`;

        return <span>{formattedDate}</span>;
      },

      renderEditCell: (params) => <MyDateField {...params} />,
    },
    {
      field: "sale_total_disc",
      headerName: "Sales w/ Disc",
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
      field: "items_display",
      headerName: "Items",
      width: 350,
      renderCell: (params) => (
        <Tooltip
          title={
            <pre
              style={{
                fontSize: 18,
                whiteSpace: "pre-wrap",
                fontWeight: 300,
                lineHeight: 1.2,
              }}
            >
              {params.row.items_display}
            </pre>
          }
          arrow
          placement="top"
          slotProps={{
            tooltip: {
              sx: {
                fontSize: 16,
                fontWeight: 400,
                backgroundColor: "#edf6f9", // optional
                color: "#006d77", // optional
                border: "1px solid #006d77", // optional
                borderRadius: 2, // optional
                padding: "10px", // optional
                minWidth: "400px", // optional
              },
            },
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              maxWidth: "100%",
            }}
          >
            {params.value}
          </span>
        </Tooltip>
      ),
    },
    {
      field: "total_items",
      headerName: "Qty",
      align: "center",
      headerAlign: "center",
      width: 80,
      editable: true,
    },
    {
      field: "sales_total",
      headerName: "Sales Total",
      align: "right",
      headerAlign: "right",
      type: "numeric",
      width: 150,
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
      field: "discount_perc",
      headerName: "Disc %",
      align: "right",
      headerAlign: "right",
      width: 110,
      editable: true,
      renderCell: (params) =>
        params.value && !isNaN(params.value)
          ? `${new Intl.NumberFormat("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(params.value)}%`
          : "",
    },

    {
      field: "received_amount",
      headerName: "Paid €",
      type: "numeric",
      width: 110,
      editable: true,
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
    {
      field: "change_given",
      headerName: "Change",
      type: "numeric",
      width: 110,
      editable: true,
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

    {
      field: "payment_type",
      headerName: "Type",
      width: 110,
      editable: true,
    },
    { field: "comment", headerName: "Comment", width: 180, editable: true },
  ];

  return (
    <Box
      sx={{
        height: "600px",
        width: "100%",
        border: "2px solid lightGray",
        borderRadius: 2,
        p: 1,
      }}
    >
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          display="grid"
          gap="10px"
          gridTemplateColumns="repeat(5, minmax(0, 1fr))"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 5" },
            mb: "20px",
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
              ".MuiDayCalendar-weekContainer .MuiPickersDay-root.Mui-selected":
                {
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

          <DesktopDatePicker
            label="From Date"
            value={fromDate}
            onChange={(newValue) => {
              const selectedDate = dayjs(newValue);
              setFromDate(selectedDate);
              // If toDate is empty or equal to old fromDate, update it too
              if (!toDate || toDate.isSame(fromDate, "day")) {
                setToDate(selectedDate);
              }
            }}
            format="DD-MM-YYYY"
            slotProps={{
              textField: {
                fullWidth: "100%",
                sx: {
                  "& .MuiInputBase-input": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500, // semibold
                  },
                  "& .MuiInputLabel-root": {
                    color: "#38a3a5",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#38a3a5", // default border
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "darkGreen", // hover border
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#38a3a5",
                  },
                },
              },
            }}
          />

          <DesktopDatePicker
            label="To Date"
            value={toDate}
            onChange={(newValue) => setToDate(dayjs(newValue))}
            format="DD-MM-YYYY"
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  "& .MuiInputBase-input": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500, // semibold
                  },
                  "& .MuiInputLabel-root": {
                    color: "#38a3a5",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#38a3a5", // default border
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "darkGreen", // hover border
                    },
                  },
                  "& .MuiSvgIcon-root": {
                    color: "#38a3a5",
                  },
                },
              },
            }}
          />

          {/* Payment Type */}
          <FormControl
            sx={{
              ...sharedStyles,
              width: "100%",
              // Selected value text
              "& .MuiSelect-select": {
                color: "dimGray !important",
                fontSize: "16px",
                fontWeight: 500, // semibold
              },
              // Dropdown icon (arrow)
              "& .MuiSvgIcon-root": {
                fontSize: "2.2rem",
                color: "#38a3a5", // customize icon color
              },
              "& .MuiFormLabel-root": {
                color: "#38a3a5 !important",
              },
            }}
          >
            <InputLabel>Paiment Type</InputLabel>
            <Select
              value={selectedPaiment}
              label="Paiment Type"
              onChange={(e) => setSelectedPaiment(e.target.value)}
              sx={{
                ...sharedStyles,
              }}
            >
              {/* NEW: “All” option */}
              <MenuItem value="">
                <em>All</em>
              </MenuItem>

              {[...uniquePaiment]
                .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
                .map((paimt) => (
                  <MenuItem key={paimt} value={paimt}>
                    {paimt}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <FormControl
            sx={{
              ...sharedStyles,
              width: "100%",
              // Selected value text
              "& .MuiSelect-select": {
                color: "dimGray !important",
                fontSize: "16px",
                fontWeight: 500, // semibold
              },
              // Dropdown icon (arrow)
              "& .MuiSvgIcon-root": {
                fontSize: "2.2rem",
                color: "#38a3a5", // customize icon color
              },
              "& .MuiFormLabel-root": {
                color: "#38a3a5 !important",
              },
            }}
          >
            <InputLabel>Item</InputLabel>
            <Select
              value={selectedItem}
              label="Iteme"
              onChange={(e) => setSelectedItem(e.target.value)}
              sx={{
                ...sharedStyles,
              }}
            >
              {/* NEW: “All” option */}
              <MenuItem value="">
                <em>All</em>
              </MenuItem>

              {[...uniqueItem]
                .sort((a, b) => a.localeCompare(b)) // Sort alphabetically
                .map((itemName) => (
                  <MenuItem key={itemName} value={itemName}>
                    {itemName}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>

          <IconButton
            onClick={() => {
              setFromDate(null);
              setToDate(null);
              setSelectedPaiment(""); // Reset payment_type
              setSelectedItem(""); // Reset payment_type
              setSelectionModel([]); // reset selection
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

        <ThemeProvider theme={themeGrid}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            editMode="row"
            rowModesModel={rowModesModel}
            onRowModesModelChange={handleRowModesModelChange}
            onRowEditStop={handleRowEditStop}
            processRowUpdate={processRowUpdate}
            getRowId={(row) => row.id}
            checkboxSelection // ✅ adds checkboxes
            disableRowSelectionOnClick // ✅ avoids selecting row when editing
            onRowSelectionModelChange={(newSelection) =>
              setSelectionModel(newSelection)
            }
            rowSelectionModel={selectionModel}
            slots={{
              toolbar: () => (
                <CombinedToolbar
                  setRows={setRows}
                  setNewRowId={setNewRowId}
                  setRowModesModel={setRowModesModel}
                  selectionModel={selectionModel} // pass selection
                  handleDeleteSelected={handleDeleteSelected} // ✅ pass bulk delete
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
              "& .MuiDataGrid-row--editing .MuiDataGrid-cell[data-field='sale_total_disc']":
                {
                  backgroundColor: "red", // light red
                  color: "#b71c1c", // dark red text
                  fontWeight: 600,
                },
            }}
          />
        </ThemeProvider>
      </LocalizationProvider>
    </Box>
  );
}
