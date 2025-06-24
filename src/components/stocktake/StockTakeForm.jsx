import {
  Alert,
  Box,
  Button,
  FormControl,
  GlobalStyles,
  Snackbar,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import supabase from "../supabaseClient"; // Import Supabase client
import StatCard from "../common/StatCard";
import { format } from "date-fns";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";

const StockTakeForm = ({
  onStockTakeSaved,
  invItems = [],
  setInvItems,
  onTotalValueChange = 0,
}) => {
  // Accept fetchData as a prop
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage] = useState("");
  const [snackbarSeverity] = useState("success"); // success, error, warning
  const [stockTakeDate, setStockTakeDate] = useState(dayjs());
  const [stockTakeNote, setStockTakeNote] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [inventoryItems, setInventoryItems] = useState([]);
  const [stockTake, setStockTake] = useState([]);
  const [stockTakeId, setStockTakeId] = useState(""); // Initialize as an empty string
  const [totalItems, setTotalItems] = useState();
  const Today = new Date(); // Get today's date
  Today.setHours(0, 0, 0, 0); // Set time to midnight to avoid timezone issues
  const [stockTakeSelected, setStockTakeSelected] = useState(false);
  const [latestEntryDate, setLatestEntryDate] = useState(null);

  // Automatically set stockTakeId when stockTake prop is available
  useEffect(() => {
    if (!stockTakeId) {
      // Only warn in dev, or just return silently
      console.log(
        "StockTakeForm mounted without a stockTakeId. Waiting for one..."
      );
      return;
    }

    // Fetch the stockTake data from Supabase here...
  }, [stockTakeId]);

  useEffect(() => {
    setTotalItems(invItems.length) - 1;
  }, [invItems]);

  const fetchStockTake = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("stockTake")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching stockTake:", error.message);
    } else {
      setStockTake(data);
      if (data.length > 0) {
        // fallback: get latest by checking max date manually
        const latest = data.reduce((a, b) =>
          new Date(a.created_at) > new Date(b.created_at) ? a : b
        );
        setLatestEntryDate(latest.created_at);
      }
    }
    setLoading(false);
  }; // Ensure this is part of a valid block or remove if unnecessary

  useEffect(() => {
    fetchStockTake();
  }, []);

  // ✅ Fetch inventory ONCE on mount
  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase.from("inventory").select("*");
      if (error) {
        console.error("Error fetching inventory:", error.message);
      } else {
        setInventoryItems(data || []);
      }
    };
    fetchInventory();
  }, []);

  // calculateions
  useEffect(() => {
    const total = invItems.reduce((sum, i) => sum + (i.value || 0), 0);
    setTotalValue(total);

    if (onTotalValueChange) onTotalValueChange(total);
  }, [invItems]);

  // Handle item changes
  const handleItemsChange = (index, field, value) => {
    const updated = [...invItems];

    if (field === "item_id") {
      const item = inventoryItems.find((item) => item.item_name === value);
      if (item) {
        updated[index] = {
          ...updated[index],
          item_id: item.item_name,
          item_name: item.item_name, // Ensure item_name is updated
          price_per_unit: item.price_per_unit,
          unit_type: item.unit_type,
          unit_per_itm: item.unit_per_itm,
          counted_qty: "",
          value: item.price_per_unit,
        };
      }
    } else if (field === "counted_qty") {
      if (value === "") {
        updated[index].counted_qty = ""; // allow empty string for typing
        updated[index].value = 0; // or leave unchanged if you prefer
      } else {
        const quantity = parseFloat(value);
        const price = updated[index].price_per_unit || 0;
        updated[index].counted_qty = quantity;
        updated[index].value = quantity * price;
      }
    }

    setInvItems(updated);
  };

  const addItemsRow = () => {
    setInvItems([
      ...invItems,
      {
        item_id: "",
        item_name: "",
        counted_qty: "",
        unit_type: "",
        unit_per_itm: 0,
        price_per_unit: 0,
        value: 0,
      },
    ]);
  };

  const removeItemsRow = (index) => {
    const updated = invItems.filter((_, i) => i !== index);
    setInvItems(updated);
  };

  const [totalValue, setTotalValue] = useState(0);

  // Save stockTake
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Insert stockTake
    const { data, error } = await supabase
      .from("stockTake")
      .insert([
        {
          date: stockTakeDate,
          total_value: totalValue,
          total_items: totalItems,
          note: stockTakeNote,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error saving stockTake:", error.message);
      alert("Error saving stockTake");
      setLoading(false);
      return;
    } else {
      alert("Stock Take saved successfully!");
      // ✅ Continue with ingredient saving
    }

    const stockTakeId = data.id;

    // 🔐 Get the logged-in user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("User not authenticated:", userError?.message);
      alert("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    // ✅ Now build the invItems array with user_id and recipe_id
    const itemsToInsert = invItems.map((item) => ({
      user_id: userId,
      stock_take_id: stockTakeId,
      item_id: item.id, // this is the inventory item's ID
      item_name: item.item_name,
      counted_qty: item.counted_qty,
      unit_type: item.unit_type,
      unit_per_itm: item.unit_per_itm,
      price_per_unit: item.price_per_unit,
      item_value: item.value,
      created_at: new Date().toISOString(), // optional
    }));

    // Insert invItems
    const { error: insertError } = await supabase
      .from("stockTake_Items")
      .insert(itemsToInsert);

    if (insertError) {
      console.error("Error saving invItems:", insertError.message);
    } else {
      console.log("invItems saved successfully.");
      // alert("invItems saved successfully");
    }

    // Reset state
    setStockTakeDate(Today);
    setStockTakeNote("");
    setInvItems([]);
    setStockTakeSelected(false);

    // ✅ Refresh the table
    fetchStockTake();

    //  onStockTakeSaved && onStockTakeSaved();
    setLoading(false);
  };

  // Update Stock Take
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    const parsedStockTakeId = parseInt(stockTakeId);
    if (!Number.isInteger(parsedStockTakeId)) {
      console.warn("Invalid stockTakeId during update:", stockTakeId);
      alert("Invalid stockTake ID. Cannot update.");
      setLoading(false);
      return;
    }

    // 🔐 Get the logged-in user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("User not authenticated:", userError?.message);
      alert("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    // ✅ Step 1: Update stockTake
    const { error: updateError } = await supabase
      .from("stockTake")
      .update({
        date: stockTakeDate,
        note: stockTakeNote,
        total_value: totalValue,
        total_items: totalItems,
      })
      .eq("id", parseInt(stockTakeId));

    if (updateError) {
      console.error("Error updating stockTake:", updateError.message);
      alert("Failed to update stockTake.");
      setLoading(false);
      return;
    }

    // ✅ Step 2: Delete old invItems
    const { error: deleteError } = await supabase
      .from("stockTake_Items")
      .delete()
      .eq("stock_take_id", parseInt(stockTakeId));

    if (deleteError) {
      console.error("Error deleting old invItems:", deleteError.message);
      alert("Failed to delete old invItems.");
      setLoading(false);
      return;
    }

    // ✅ Step 3: Insert updated item list
    const itemsToInsert = invItems.map((item) => ({
      user_id: userId,
      stock_take_id: parseInt(stockTakeId),
      item_id: item.id,
      item_name: item.item_name || "Unnamed item",
      counted_qty: item.counted_qty,
      unit_type: item.unit_type,
      unit_per_itm: item.unit_per_itm,
      price_per_unit: item.price_per_unit,
      item_value: item.value,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("stockTake_Items")
      .insert(itemsToInsert);

    if (insertError) {
      console.error("Error saving updated invItems:", insertError.message);
      alert("Failed to insert updated invItems.");
      setLoading(false);
      return;
    }

    alert("Stock Take and Stock Take Items updated successfully!");
    setStockTakeDate(Today);
    setStockTakeNote("");
    setInvItems([]);
    setStockTakeSelected(false);

    // ✅ Refresh the table
    fetchStockTake();

    onStockTakeSaved && onStockTakeSaved();
    setLoading(false);
  };

  // Fetch stockTake and invItems from both tables "stockTake" and "recipe_ingredients"
  const handleStockTakeSelect = async (stockTakeId) => {
    setStockTakeSelected(true); // Set stockTakeSelected to true
    try {
      // Fetch StockTake from "stockTake" table
      const { data: stockTake, error: recipeErrorError } = await supabase
        .from("stockTake")
        .select("*")
        .eq("id", stockTakeId)
        .single();

      if (recipeErrorError) throw recipeErrorError;

      // Set the current stockTake ID correctly 👇
      setStockTakeId(stockTakeId); // ✅ <--- THIS LINE WAS MISSING

      // Set StockTake data in form fields
      setStockTakeDate(stockTake.date ? new Date(stockTake.date) : null);
      setStockTakeNote(stockTake.note);
      setTotalItems(stockTake.total_items);

      // Fetch invItems from "stockTake_Items" table
      const { data: invItems, error: itemsError } = await supabase
        .from("stockTake_Items")
        .select("*")
        .eq("stock_take_id", stockTakeId);

      if (itemsError) throw itemsError;

      const enrichedItems = invItems.map((itm) => ({
        ...itm,
        item_id: itm.item_name,
        price_per_unit: itm.price_per_unit,
        unit_type: itm.unit_type,
        unit_per_itm: itm.unit_per_itm,
        value: itm.item_value,
      }));

      setInvItems(enrichedItems);
      // Removed setShouldSave as it is not defined
    } catch (error) {
      console.error("Error loading stockTake:", error.message);
    }
  };

  // Delete stockTake
  const handleDeleteStockTake = async (stockTakeId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this stockTake?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase
      .from("stockTake")
      .delete()
      .eq("id", stockTakeId); // Use the actual column for identifying the stockTake

    if (error) {
      console.error("Error deleting stockTake:", error.message);
      alert("Failed to delete stockTake.");
    } else {
      alert("stockTake deleted successfully.");
      setStockTakeDate(Today);
      setStockTakeNote("");
      setInvItems([]);
      setStockTakeSelected(false);

      // ✅ Refresh the table
      fetchStockTake();
    }
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

  // TextField and InputLabel customizations
  const sharedStyles = {
    backgroundColor: "#ebf1fa",
    "& .MuiInputLabel-root": {
      color: "#007f5f",
      fontSize: 16,
      backgroundColor: "#ebf1fa",
      px: 1,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #60d394",
      },
      "&:hover fieldset": {
        borderColor: "#60d394",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  return (
    <Box
      sx={{
        height: 3000,
        width: "100%",
        border: "2px solid lightGray",
        borderRadius: 2,
        padding: 1,
      }}
    >
      <Box
        display="grid"
        gap="15px"
        gridTemplateColumns="repeat(1, minmax(0, 1fr))"
        sx={{
          "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
        }}
      >
        <StatCard
          icon={
            <InventoryOutlinedIcon
              sx={{ color: "#38a3a5", fontSize: "26px" }}
            />
          }
          title={"Stock Take Summary"}
          value={`${stockTake.length} Entries`}
          subtitle={
            latestEntryDate
              ? `Last Entry: ${format(new Date(latestEntryDate), "dd-MM-yyyy")}`
              : "No data available"
          }
          progress={"none"}
          sx={{
            gridColumn: "span 1",
          }}
        />
      </Box>
      <form onSubmit={handleSubmit}>
        <h3 className="text-base mb-2 ml-1 mt-1 text-[#3FA89B] font-bold">
          STOCK TAKE CALCULATOR
        </h3>
        <Box
          display="grid"
          gap="15px"
          gridTemplateColumns="repeat(1, minmax(0, 1fr))"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
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

          {/* stockTake Date */}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ width: "100%" }}>
              <DesktopDatePicker
                format="DD-MM-YYYY"
                value={dayjs(stockTakeDate)}
                onChange={(newValue) => setStockTakeDate(dayjs(newValue))}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    size: "small",
                    sx: {
                      ...sharedStyles,
                      "& .MuiSvgIcon-root": {
                        color: "#2a9d8f",
                      },
                      "& .MuiInputBase-input": {
                        color: "#2a9d8f",
                        fontSize: "1rem",
                        fontWeight: 500,
                      },
                    },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>

          {/* Note */}
          <FormControl
            fullWidth
            variant="outlined"
            sx={{ gridColumn: "span 2" }}
          >
            <TextField
              fullWidth
              variant="outlined"
              label="Note"
              value={stockTakeNote}
              onChange={(e) => setStockTakeNote(e.target.value)}
              multiline
              minRows={2} // or rows={4} if you want a fixed height
              sx={{
                ...sharedStyles,
                "& .MuiInputBase-inputMultiline": {
                  color: "#333", // ✅ text color for textarea
                  fontSize: 16,
                },
              }}
            />
          </FormControl>
        </Box>

        {/* 🧠 Calculated Fields */}
        <Box
          display="grid"
          gap="10px"
          alignContent={"center"}
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          sx={{
            ...sharedStyles,
            mt: 2,
            pl: 3,
            py: 2,
            fontSize: 14,
            color: "#333",
            border: "1px solid #60d394",
          }}
        >
          <Box gridColumn="span 2">
            <>Number of Items:</> {totalItems}
          </Box>
          <Box gridColumn="span 2">
            <>Stock Take Value:</> €{totalValue.toFixed(2)}
          </Box>
        </Box>

        {/* IngredientsTable */}
        <Box
          sx={{
            ...sharedStyles,
            mt: 2,
            px: "5px",
            pb: "5px",
            fontSize: 14,
            border: "1px solid #60d394",
            "& .bg-gray-200": {
              backgroundColor: "#ebf1fa",
            },
            "& .text-white": {
              color: "#007f5f",
            },
          }}
        >
          <table className="table-auto w-full text-sm bg-[#ebf1fa] text-[#333] rounded shadow">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 font-semibold text-white text-left">
                  Select an Item
                </th>
                <th className="p-2 font-semibold text-white text-left">
                  Qty Used
                </th>
                <th className="p-2 font-semibold text-white text-left">
                  Unit type
                </th>
                <th className="p-2 font-semibold text-white text-left">
                  Unit p/ Item
                </th>
                <th className="p-2 font-semibold text-white text-left">
                  Price/Unit
                </th>
                <th className="p-2 font-semibold text-white text-left">
                  Value
                </th>
                <th className="p-2">Del</th>
              </tr>
            </thead>
            <tbody>
              {invItems.map((item, index) => (
                <tr key={index}>
                  <td className="p-2">
                    <select
                      className="bg-gray-100 p-1 rounded w-full"
                      value={item.item_id}
                      onChange={(e) =>
                        handleItemsChange(index, "item_id", e.target.value)
                      }
                    >
                      <option value="">Select item</option>
                      {[...inventoryItems]
                        .sort((a, b) => a.item_name.localeCompare(b.item_name))
                        .map((item) => (
                          <option key={item.item_name} value={item.item_name}>
                            {item.item_name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      className="bg-gray-100 p-1 rounded w-20"
                      value={item.counted_qty}
                      onChange={(e) =>
                        handleItemsChange(index, "counted_qty", e.target.value)
                      }
                    />
                  </td>
                  <td className="p-2">{item.unit_type}</td>
                  <td className="p-2">{item.unit_per_itm}</td>
                  <td className="p-2">€{item.price_per_unit?.toFixed(5)}</td>
                  <td className="p-2">€{item.value?.toFixed(4)}</td>
                  <td className="p-2 text-right">
                    <button
                      type="button" // <<<<< THIS is critical
                      onClick={() => removeItemsRow(index)}
                      className="hover:text-red-400 text-lightGray font-semibold px-2 py-1 rounded"
                    >
                      𝘅
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Finish item Table */}
        </Box>
        <Box
          display="grid"
          gap="10px"
          gridTemplateColumns={isMobile ? "repeat(2, 1fr)" : "repeat(8, 1fr)"}
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 1" },
          }}
        >
          {/* Add invItems button */}
          <Button
            onClick={addItemsRow}
            variant="contained"
            sx={{
              gridColumn: isMobile ? "span 2" : "span 2",
              backgroundColor: "#26A889",
              color: "white",
              fontSize: 14,
              "&:hover": {
                backgroundColor: "#62CDB4",
              },
              marginTop: isMobile ? 2 : 2,
              height: 40,
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginRight: "0.5rem",
              }}
            >
              +{" "}
            </span>
            Items
          </Button>

          {/* Save stockTake Button */}
          <Button
            type="submit"
            variant="contained"
            disabled={loading || stockTakeSelected}
            sx={{
              gridColumn: isMobile ? "span 1" : "span 2",
              backgroundColor: "#26A889",
              color: "white",
              fontSize: 14,
              "&:hover": {
                backgroundColor: "#62CDB4",
              },
              marginTop: isMobile ? 0 : 2,
              height: 40,
            }}
          >
            {loading ? "Saving..." : "Save"}
          </Button>

          {/* Update stockTake Button */}
          <Button
            type="button"
            onClick={handleUpdate}
            variant="contained"
            disabled={loading}
            sx={{
              gridColumn: isMobile ? "span 1" : "span 2",
              backgroundColor: "#00b4d8",
              color: "white",
              fontSize: 14,
              "&:hover": {
                backgroundColor: "#90e0ef",
              },
              marginTop: isMobile ? 0 : 2,
              height: 40,
            }}
          >
            {loading ? "Saving..." : "Update"}
          </Button>

          {/* Delete stockTake */}
          <Button
            type="button"
            variant="contained"
            onClick={() => handleDeleteStockTake(stockTakeId)} // Make sure stockTakeId is defined
            sx={{
              gridColumn: isMobile ? "span 1" : "span 1",
              backgroundColor: "#ff4d6d",
              color: "white",
              fontSize: 14,
              "&:hover": {
                backgroundColor: "#ff758f",
              },
              marginTop: isMobile ? 0 : 2,
              height: 40,
            }}
          >
            Del
          </Button>

          {/* Clear button */}
          <Button
            type="button"
            variant="contained"
            onClick={() => {
              setStockTakeDate("");
              setStockTakeNote("");
              setInvItems([]);
              setStockTakeSelected(false);
            }}
            sx={{
              gridColumn: isMobile ? "span 1" : "span 1",
              backgroundColor: "#EAB308",
              "&:hover": {
                backgroundColor: "#facc15",
              },
              marginTop: isMobile ? 0 : 2,
              height: 40,
            }}
          >
            Clear
          </Button>
        </Box>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={3000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
            sx={{ width: "100%" }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </form>

      {/* stockTake List  */}
      <Box>
        <div className="p-4 bg-gray-100 text-[#444] my-2 ">
          <h2 className="text-xl mb-4">Saved Stock Take</h2>

          {loading ? (
            <p>Loading Stock Take...</p>
          ) : stockTake.length === 0 ? (
            <p>No Stock Take saved yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto hide-scrollbar">
              <table className="table-auto w-full text-sm">
                <thead className="bg-[#2a303a] sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                      Date
                    </th>
                    <th className="p-2 text-center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                      Item Qty
                    </th>
                    <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                      Total (€)
                    </th>
                    <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                      Note
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockTake.map((stockTake) => (
                    <tr
                      key={stockTake.id}
                      className="border-b border-gray-700 hover:bg-gray-200"
                      onClick={() => handleStockTakeSelect(stockTake.id)} // 👈 Add this line
                    >
                      <td className="p-2"> {formatDate(stockTake.date)}</td>
                      <td className="p-2 text-center">
                        {stockTake.total_items}
                      </td>
                      <td className="p-2 text-right">
                        €{stockTake.total_value?.toFixed(2)}
                      </td>
                      <td className="p-2">{stockTake.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default StockTakeForm;
