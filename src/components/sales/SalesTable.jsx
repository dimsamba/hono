import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import CachedIcon from "@mui/icons-material/Cached";
import {
  GlobalStyles,
  Stack,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import Box from "@mui/material/Box";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import React, { useState } from "react";
import StatCardinfo from "../common/StatCardinfo";

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

// Enable plugins once
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

export default function FullFeaturedCrudGrid({ SalesTable, onSalesChange }) {
  const [rows, setRows] = React.useState(SalesTable); // Use the passed SalesTable
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [, setNewRowId] = React.useState(null);

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
              backgroundColor: "#e7ecef !important", // ✅ light red background
              "& .MuiInputBase-input": {
                color: "dimGray", // ✅ text color
                fontSize: "0.9rem",
                fontWeight: 400,
                padding: "14px", // adjust if needed
              },

              "& fieldset": {
                border: "1px solid #777", // optional border styling
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
  const filteredRows = (rows || []).filter((row) => {
    const rowDate = dayjs(row.date);

    if (fromDate && toDate) {
      return (
        rowDate.isSameOrAfter(fromDate, "day") &&
        rowDate.isSameOrBefore(toDate, "day")
      );
    }
    if (fromDate) {
      return rowDate.isSameOrAfter(fromDate, "day");
    }
    if (toDate) {
      return rowDate.isSameOrBefore(toDate, "day");
    }
    return true;
  });

  // Count number of Items
  const totalItemsCount = filteredRows.reduce((sum, row) => {
    const value = Number(row.total_items);
    return sum + (isNaN(value) ? 0 : value);
  }, 0);

  // Count entries between dates
  const entryCount = filteredRows.length;

  // Sum sale_total_disc
  const filteredTotalValue = filteredRows.reduce(
    (sum, row) => sum + (row.sale_total_disc || 0),
    0
  );

  // Format value to 2 decimal places
  const formattedFilteredTotalValue = new Intl.NumberFormat("en-US", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(filteredTotalValue);

  // Customize Toolbar
  const themeGrid = createTheme({
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
        height: "100%",
        width: "100%",
        border: "2px solid lightGray",
        borderRadius: 2,
        p: 1,
      }}
    >
      <Box>
        <StatCardinfo
          title={`Total: € ${formattedFilteredTotalValue}`}
          title1={`Total Sales: ${entryCount}`}
          title2={`Total Items sold: ${totalItemsCount}`}
          //  title3={}
          progress={"none"}
        />
      </Box>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <Box
          display="grid"
          gap="5px"
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            mb: "5px",
          }}
        >
          <GlobalStyles
            styles={{
              ".MuiPickersPopper-root .MuiPaper-root": {
                backgroundColor: "#f5f5f5 !important",
                color: "#4a5759 !important",
                fontSize: "1rem",
                lineHeight: 1.8,
                borderRadius: "8px",
              },

              // Day numbers (default state)
              ".MuiDayCalendar-weekContainer .MuiPickersDay-root": {
                color: "#4a5759 !important",
              },

              // Selected day (override white-on-white)
              ".MuiDayCalendar-weekContainer .MuiPickersDay-root.Mui-selected":
                {
                  backgroundColor: "#2a9d8f !important",
                  color: "#fff !important",
                },

              // Today’s date
              ".MuiDayCalendar-weekContainer .MuiPickersDay-root.MuiDayCalendar-dayWithMargin.MuiPickersDay-today":
                {
                  border: "1px solid #2a9d8f",
                },

              // ✅ Day-of-week headers (top row: S, M, T, etc.)
              ".MuiDayCalendar-header .MuiTypography-root": {
                color: "#4a5759 !important",
                fontWeight: 800,
              },
              ".MuiPickersCalendarHeader-root .MuiIconButton-root": {
                color: "#2a9d8f !important", // or any color you prefer
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
                fullWidth: true,
                sx: {
                  "& .MuiInputBase-input": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500,
                  },
                  "& .MuiInputLabel-root": {
                    color: "#38a3a5",
                    fontSize: "16px",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#38a3a5",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "darkGreen",
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
                    fontSize: "16px",
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
          <IconButton
            onClick={() => {
              setFromDate(null);
              setToDate(null);
            }}
            sx={{
              width: "50px",
              "&:hover": {
                backgroundColor: "transparent", // remove hover background
              },
              "& .MuiSvgIcon-root": {
                fontSize: "2rem", // adjust icon size as needed
                color: "#577590", // customize icon color
              },
            }}
          >
            <CachedIcon />
          </IconButton>
        </Box>

        {/* </Box> */}
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
