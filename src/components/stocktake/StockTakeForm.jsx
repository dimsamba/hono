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
import { motion } from "framer-motion";
import StatCardRecipe from "../common/StatCardRecipe";
import PriceCheckOutlinedIcon from "@mui/icons-material/PriceCheckOutlined";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import supabase from "../supabaseClient"; // Import Supabase client
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

  // Format Curency
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  return (
    <main>
      <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 mb-3">
        <StatCardRecipe
          icon={
            <InventoryOutlinedIcon
              sx={{ color: "#38a3a5", fontSize: "26px" }}
            />
          }
          title={"Stock Take Summary"}
          value={
            <span style={{ verticalAlign: "middle" }}>
              N. of Entries:{" "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                {stockTake.length}
              </span>{" "}
            </span>
          }
          value2={
            <span style={{ verticalAlign: "middle" }}>
              Last Entry:{" "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                {latestEntryDate
                  ? ` ${format(new Date(latestEntryDate), "dd-MM-yyyy")}`
                  : "No data available"}
              </span>{" "}
            </span>
          }
        />
        <StatCardRecipe
          icon={
            <PriceCheckOutlinedIcon
              sx={{ color: "#38a3a5", fontSize: "26px" }}
            />
          }
          title={`Cost Calculations`}
          value={
            <span style={{ verticalAlign: "middle" }}>
              Items Count:{" "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                {totalItems}
              </span>{" "}
            </span>
          }
          value2={
            <span style={{ verticalAlign: "middle" }}>
              Total Value:{" "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                €{formatCurrency(totalValue)}
              </span>{" "}
            </span>
          }
        />
      </motion.div>

      <Box
        className="Main Box"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: { xs: "auto", md: "100%" }, // ← KEY LINE!
          width: "100%",
          border: "2px solid lightGray",
          borderRadius: 2,
          p: 2,
        }}
      >
        {/* Left Box: Recipe Calculator */}
        <Box
          className="Recipe Calculator"
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            height: "auto", // Make sure not to force height
            maxWidth: "900px",
          }}
        >
          <form onSubmit={handleSubmit} className="p-2 bg-gray-100 text-[#444]">
            <h3 className="text-base mb-4 text-[#3FA89B] font-bold">
              STOCK TAKE CALCULATOR
            </h3>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box
                display="grid"
                gap="15px"
                gridTemplateColumns="repeat(1, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 1" },
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

                {/* stockTake Date */}
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" }, // column on small, row on medium+
                    alignItems: "stretch", // important to let children expand vertically
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: "70%",
                      flexGrow: 1,
                      display: "flex",
                      alignItems: "stretch", // ensures child fills height
                    }}
                  >
                    <DesktopDatePicker
                      value={dayjs(stockTakeDate)}
                      onChange={(newValue) => setStockTakeDate(dayjs(newValue))}
                      format="DD-MM-YYYY"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          sx: {
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
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
                  </Box>

                  {/* Note */}
                  <Box
                    sx={{
                      width: "140%",
                      flexGrow: 1,
                      maxWidth: "100%",
                    }}
                  >
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ gridColumn: "span 2", flexGrow: 1 }}
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
                          flexGrow: 1,
                          ...sharedStyles,
                          "& .MuiInputBase-inputMultiline": {
                            color: "#333", // ✅ text color for textarea
                            fontSize: 16,
                          },
                        }}
                      />
                    </FormControl>
                  </Box>
                </Box>
              </Box>
            </LocalizationProvider>

            {/* IngredientsTable */}
            <Box
              sx={{
                flex: 1,
                height: "100%",
                mt: 2,
                fontSize: 14,
                minWidth: 0,
                minHeight: 0,
                border: "1px solid #60d394",
                "& .text-white": {
                  color: "#007f5f",
                },
              }}
            >
              <table className="table-auto w-full text-sm text-[#333] rounded shadow">
                <thead>
                  <tr
                    className="bg-gray-200"
                    style={{ borderBottom: "1px solid #60d394" }}
                  >
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Select an Item
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Qty Used
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Unit type
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Unit p/ Item
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Price/Unit
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Value
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Del
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-200">
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
                            .sort((a, b) =>
                              a.item_name.localeCompare(b.item_name)
                            )
                            .map((item) => (
                              <option
                                key={item.item_name}
                                value={item.item_name}
                              >
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
                            handleItemsChange(
                              index,
                              "counted_qty",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2">{item.unit_type}</td>
                      <td className="p-2">{item.unit_per_itm}</td>
                      <td className="p-2">
                        €{item.price_per_unit?.toFixed(5)}
                      </td>
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
              gap="8px"
              gridTemplateColumns={
                isMobile ? "repeat(2, 1fr)" : "repeat(8, 1fr)"
              }
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
                  setStockTakeDate(null);
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
        </Box>

        {/* Saved StockTake List  */}
        <Box
          className="Saved Stock Take List"
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: "auto",
            height: "auto", // Make sure not to force height
            minHeight: 0, // Allow shrinking if needed
          }}
        >
          <div className="p-2 bg-gray-100 text-[#444]">
            <h2 className="text-base mb-4 text-[#3FA89B] font-bold">
              Saved Stock Take
            </h2>
            <Box
              className="Saved Stock Take List"
              sx={{
                borderRadius: 0,
                border: "1px solid #60d394",
              }}
            >
              {loading ? (
                <p>Loading Stock Take...</p>
              ) : stockTake.length === 0 ? (
                <p>No Stock Take saved yet.</p>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto hide-scrollbar">
                  <table className="table-auto w-full text-sm">
                    <thead
                      className="bg-[#2a303a] sticky top-0 z-10"
                      style={{ borderBottom: "1px solid #60d394" }}
                    >
                      <tr>
                        <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Date
                        </th>
                        <th className="p-2 text-center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Item Qty
                        </th>
                        <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Total
                        </th>
                        <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Note
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...stockTake]
                        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, descending
                        .map((stockTake) => (
                          <tr
                            key={stockTake.id}
                            className="border-b hover:bg-gray-200"
                            onClick={() => handleStockTakeSelect(stockTake.id)} // 👈 Add this line
                          >
                            <td className="p-2">
                              {" "}
                              {formatDate(stockTake.date)}
                            </td>
                            <td className="p-2 text-center">
                              {stockTake.total_items}
                            </td>
                            <td className="p-2 text-right">
                              € {formatCurrency(stockTake.total_value)}
                            </td>
                            <td className="p-2">{stockTake.note}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Box>
          </div>
        </Box>
      </Box>
    </main>
  );
};

export default StockTakeForm;
