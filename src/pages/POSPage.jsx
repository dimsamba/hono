// ... (imports unchanged)
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import LoyaltyOutlinedIcon from "@mui/icons-material/LoyaltyOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { v4 as uuidv4 } from "uuid"; // NEW: for unique order item keys
import StatCardVend from "../components/common/StatCardVend";
// Add to the top of the file:
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LocalActivityOutlinedIcon from "@mui/icons-material/LocalActivityOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import Tooltip from "@mui/material/Tooltip";
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState, useRef } from "react";
import supabase from "../components/supabaseClient";
import { tokens } from "../components/theme";
import { Add, Print, Save } from "@mui/icons-material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BackspaceIcon from "@mui/icons-material/Backspace";

import {
  Box,
  Button,
  FormControl,
  Grid,
  Grid2,
  IconButton,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
  Popover,
} from "@mui/material";

const POSPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [order, setOrder] = useState([]);
  const [receivedAmount, setReceivedAmount] = useState("");
  const [sales, setSales] = useState([]);
  const today = new Date();
  const [comment, setComment] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const inputRef = useRef(null);
  const [resetFlag, setResetFlag] = useState(false);
  const [paymentType, setPaymentType] = useState("cash");
  const [sampleMenu, setSampleMenu] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const categories = ["Food", "Beverage", "Produces"];
  const currentCategory = categories[selectedTab];
  const formattedDate = `${today.getDate().toString().padStart(2, "0")}-${(
    today.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}-${today.getFullYear()}`;

  // Fetch Items list from Supabase
  useEffect(() => {
    const fetchMenuItems = async () => {
      const { data, error } = await supabase
        .from("itemsList")
        .select("*")
        .eq("category", currentCategory); // Only fetch active items

      if (error) {
        console.error("Error fetching itemsList:", error.message);
      } else {
        const formatted = data.map((item) => ({
          id: item.id,
          name: item.item_name,
          price: item.item_price,
          originalPrice: item.item_price,
          originalName: item.item_name,
          category: item.category, // ✅ Add this line
        }));

        setSampleMenu(formatted);
      }
    };

    fetchMenuItems();
  }, [currentCategory]); // ✅ Now it fetches each time the tab changes

  const addToOrder = (menuItem) => {
    const newItem = {
      id: uuidv4(), // unique key
      itemId: menuItem.id, // original menu item ID
      name: menuItem.name,
      price: parseFloat(menuItem.price),
      originalPrice: menuItem.originalPrice,
      quantity: 1,
    };

    setOrder((prev) => {
      // Check if an identical item (name + price) already exists
      const existing = prev.find(
        (i) => i.name === newItem.name && i.price === newItem.price
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      } else {
        return [...prev, newItem];
      }
    });
  };

  const removeFromOrder = (itemToRemove) => {
    setOrder((prev) =>
      prev.filter(
        (i) =>
          !(
            i.name === itemToRemove.name &&
            i.price === itemToRemove.price &&
            i.id === itemToRemove.id
          )
      )
    );
  };

  const handlePriceChange = (id, newPrice) => {
    const updated = sampleMenu.map((item) => {
      if (item.id === id) {
        const isDiscounted =
          parseFloat(newPrice) < item.originalPrice &&
          !isNaN(parseFloat(newPrice));
        return {
          ...item,
          price: newPrice, // Keep as string
          name: isDiscounted ? `${item.originalName} (Réd)` : item.originalName,
        };
      }
      return item;
    });

    setSampleMenu(updated);
  };

  const calculateTotal = () =>
    order.reduce((sum, i) => sum + i.quantity * i.price, 0);

  const calculateChange = () => {
    const total = calculateTotal();
    return receivedAmount
      ? (parseFloat(receivedAmount) - total).toFixed(2)
      : "0.00";
  };

  // Cleaned Items to save
  const cleanedItems = order.map((i) => {
    if (i.price !== i.originalPrice) {
      return {
        name: i.name,
        quantity: i.quantity,
        "disc-price": i.price,
        originalPrice: i.originalPrice,
        total: (i.quantity * i.price).toFixed(2),
      };
    } else {
      return {
        name: i.name,
        quantity: i.quantity,
        price: i.originalPrice,
        total: (i.quantity * i.originalPrice).toFixed(2),
      };
    }
  });

  // Reset All
  useEffect(() => {
    if (resetFlag) {
      setOrder([]);
      setReceivedAmount("");
      resetMenuPrices();
      setComment("");
      setResetFlag(false); // Reset flag
    }
  }, [resetFlag]);

  // Save Sales
  const saveSale = async (isPrint = false) => {
    if (order.length === 0) {
      alert("No items to save.");
      return;
    }

    const totalPrice = calculateTotal();
    if (totalPrice <= 0) {
      alert("Total is zero. Nothing to save.");
      return;
    }

    const fullPriceTotal = order.reduce(
      (sum, i) => sum + (i.originalPrice ?? i.price) * i.quantity,
      0
    );

    const discountTotal = order.reduce((sum, i) => {
      const diff = (i.originalPrice ?? i.price) - i.price;
      return sum + (diff > 0 ? diff * i.quantity : 0);
    }, 0);

    const discountPercentage =
      fullPriceTotal > 0
        ? parseFloat(((discountTotal / fullPriceTotal) * 100).toFixed(2))
        : 0;

    const saleData = {
      date: new Date().toISOString(),
      items: cleanedItems,
      total_items: order.reduce((sum, i) => sum + i.quantity, 0),
      sale_total_disc: totalPrice,
      sales_total: fullPriceTotal,
      discount_perc: discountPercentage,
      comment: comment,
      received_amount: parseFloat(receivedAmount) || 0,
      change_given: parseFloat(calculateChange()),
      payment_type: paymentType, // ← use the state here
      created_at: new Date().toISOString(),
    };

    // Ask for confirmation before saving and printing
    const userConfirmed = window.confirm(
      "Are you sure you want to save and/or print this sale?"
    );

    if (!userConfirmed) {
      return; // Abort the process if the user clicks "Cancel"
    }

    // Proceed to save the sale to Supabase
    const { error } = await supabase.from("sales").insert([saleData]).select();

    if (error) {
      alert("Error saving sale.");
      console.error(error);
    } else {
      // alert("Sale saved successfully.");

      setSales((prev) => [
        ...prev,
        { ...saleData, date: new Date(saleData.date) },
      ]);

      setPaymentType("cash");
      setResetFlag(true);

      if (isPrint) {
        const printSaleData = {
          ...saleData,
          items: saleData.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            price: item["disc-price"] ?? item.price, // Normalize price field
          })),
        };

        triggerPrint(printSaleData); // ✅ Print with normalized prices
      }

      return saleData;
    }
  };

  // Reset Original prices
  const resetMenuPrices = () => {
    const reset = sampleMenu.map((item) => ({
      ...item,
      price: item.originalPrice,
      name: item.originalName,
    }));
    setSampleMenu(reset);
  };

  // Get the latest sales ID to print as Sales Number
  const getLatestSaleId = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select("id")
      .order("id", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error("Error fetching latest sale ID:", error.message);
      return null;
    }

    return data.id;
  };

  // Print Layout
  const triggerPrint = async (saleData) => {
    const latestId = await getLatestSaleId(); // fetch the ID

    const formatDateEU = (isoString) => {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const seconds = String(date.getSeconds()).padStart(2, "0");
      return `${day}-${month}-${year}, ${hours}:${minutes}:${seconds}`;
    };

    if (typeof saleData.items === "string") {
      saleData.items = JSON.parse(saleData.items);
    }

    const itemsHtml = saleData.items
      .map((item) => {
        const hasDiscount =
          item.originalPrice != null && item.price !== item.originalPrice;
        const original =
          item.originalPrice != null
            ? item.originalPrice.toFixed(2)
            : item.price.toFixed(2);
        const discounted = item.price.toFixed(2);
        const total = (item.quantity * item.price).toFixed(2);
        const priceDisplay = hasDiscount
          ? `(€${original}) → €${discounted}`
          : `€${original}`;
        return `
      <tr>
        <td>${item.name}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${priceDisplay}</td>
        <td class="right">€${total}</td>
      </tr>`;
      })
      .join("");

    const htmlContent = `
  <html>
  <head>
    <title>Receipt</title>
    <style>
      body {
        font-family: 'Arial', sans-serif;
        padding: 20px;
        color: #000;
      }
      h2 {
        text-align: center;
        margin-bottom: 10px;
      }
      p {
        margin: 4px 0;
        font-size: 14px;
      }
      table {
        width: 100%;
        margin-top: 10px;
        border: none;
      }
      th, td {
        text-align: left;
        padding: 4px 0;
        font-size: 14px;
      }
      tr {
        border-bottom: 1px dashed #ccc;
      }
      .summary {
        margin-top: 15px;
        font-size: 14px;
      }
      .thankyou {
        margin-top: 20px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
      }
      .right {
        text-align: right;
      }
      .divider {
        border: none;
        border-top: 1px dashed #aaa;
        margin: 12px 0;
      }
    </style>
  </head>
  <body>

 <div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
  <h1 style="margin: 0;">Honō</h1>
  <h4 style="margin: 0; font-style: italic;">La flamme du savoir-faire</h4>
  <p> * * * * * </p>
   <p></p>
 </div>
    
    <p><strong>Date:</strong> ${formatDateEU(saleData.date)}</p>
    <p>Sales N.: 000${latestId ?? "N/A"}</p>
    <p><strong>Paiement:</strong> ${saleData.payment_type}</p>

    <hr class="divider" />
    <table>
      <thead>
        <tr>
         <th>Article</th>
         <th class="right">Qté</th>
         <th class="right">Prix</th>
         <th class="right">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <hr class="divider" />

    <div class="summary">
      <p><strong>Total:</strong> €${saleData.sales_total.toFixed(2)}</p>
      <h4><strong>Total avec réduction:</strong> €${saleData.sale_total_disc.toFixed(
        2
      )}</h4>
      <p><strong>Réduction:</strong> ${saleData.discount_perc}%</p>
      <p><strong>Montant reçu:</strong> €${saleData.received_amount.toFixed(
        2
      )}</p>
      <p><strong>Monnaie rendue:</strong> €${saleData.change_given.toFixed(
        2
      )}</p>
    </div>

    <div class="thankyou">
      Merci de soutenir les petits agriculteurs
    </div>
  </body>
  </html>
  `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };

  // Handle the click on an IconButton
  const handlePaymentTypeChange = (value) => {
    setPaymentType(value);
    // Here, you can handle saving the value (e.g., to the backend or state)
    console.log("Selected payment type:", value);
  };

  // TextField and InputLabel customizations
  const sharedStyles = {
    backgroundColor: "#ebf1fa",
    "& .MuiInputLabel-root": {
      color: "#364958",
      fontSize: 18,
      backgroundColor: "#ebf1fa",
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #45a29e",
      },
      "&:hover fieldset": {
        borderColor: "#45a29e",
      },
      "&.Mui-focused fieldset": {
        border: "3px solid #08bdbd",
      },
    },
  };

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("sale_total_disc, date, items");

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      const formattedData = data.map((row) => ({
        ...row,
        date: row.date ? new Date(row.date) : new Date(),
      }));

      setSales(formattedData); // Update rows state with the fetched data
    };

    fetchData(); // Call the fetch function when the component mounts
  }, []); // Empty dependency array to only run once when the component mounts

  // Filter Todays sales
  const todaysSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return sales.filter((sale) => {
      const saleDate = new Date(sale.date);
      return saleDate >= startOfToday && saleDate <= now;
    });
  }, [sales]);

  // Customization for decimals and thousands separators
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  // 🔁 Sum total sales today
  const totalSalesToday = useMemo(() => {
    return todaysSales.reduce((sum, s) => sum + (s.sale_total_disc || 0), 0);
  }, [todaysSales]);

  // 🔁 Sum total Items today
  const totalItemsToday = useMemo(() => {
    return todaysSales.reduce((sum, sale) => {
      if (Array.isArray(sale.items)) {
        const saleItemCount = sale.items.reduce(
          (itemSum, item) => itemSum + (item.quantity || 0),
          0
        );
        return sum + saleItemCount;
      }
      return sum;
    }, 0);
  }, [todaysSales]);

  // Change IconButtons color based on category type
  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case "beverage":
        return "#545e75"; // warm orange tone
      case "produces":
        return "#545e75 "; // rich green tone
      default:
        return "#545e75"; // default purple tone
    }
  };

  // Comment Function
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? "comment-popover" : undefined;

  // Focus the TextField when Popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      // Wait for the popover to fully open
      setTimeout(() => {
        inputRef.current.focus();
      }, 100); // Delay to ensure input is mounted
    }
  }, [open]);

  // Handle the KeyPad
  const handleKeypadInput = (key) => {
    setReceivedAmount((prev) => {
      // Prevent multiple decimals
      if (key === "." && prev.includes(".")) return prev;
      return prev + key;
    });
  };

  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-[#fcfeff] border-t-2">
      <main className="max-w-8xl mx-auto scrollbar-hide h-[1500px]">
        {/* Items buttons and Sale Summary */}
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Box
            display="grid"
            gap={0}
            gridTemplateColumns="repeat(13, minmax(0, 1fr))"
            sx={{
              "& > div": {
                gridColumn: isNonMobile ? undefined : "span 3",
              },
            }}
          >
            {/* 1st Column Items grid */}
            <Box
              sx={{
                gridColumn: "span 6", // Half of the 8 columns
                px: 0,
                pt: 1,
              }}
            >
              <Grid2 container spacing={0} sx={{ width: "100%" }}>
                {sampleMenu.map((item) => (
                  <Grid2
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={3}
                    key={item.id}
                    sx={{ flexGrow: 1 }}
                  >
                    <Paper
                      sx={{
                        // flexGrow: 1, // This makes Paper fill its parent Grid2
                        borderRadius: 0,
                        px: 1,
                        pt: 1,
                        backgroundColor: getCategoryColor(item.category),
                        mb: 0.5,
                        mr: 0.5,
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignContent={"center"}
                        gap={0}
                        sx={{
                          height: "100%",
                          width: "100%",
                          flexGrow: 1,
                        }}
                      >
                        {/* First Row: Full width Typography */}
                        <Box
                          width="100%"
                          display="flex"
                          justifyContent="center"
                        >
                          <Typography
                            sx={{
                              fontSize: 18,
                              fontWeight: 500,
                              color: "ehite",
                              flexGrow: 1,
                            }}
                          >
                            {item.name}
                          </Typography>
                        </Box>

                        {/* Second Row: IconButtons side by side */}
                        <Box display="flex" width="100%" alignItems="center">
                          <IconButton
                            onClick={() => addToOrder(item)}
                            sx={{
                              color: "white",
                              mb: "8px",
                              backgroundColor: "#1a9cb3",
                              width: "100%", // Square size
                              height: 50,
                              borderRadius: 0, // Rounded corners (theme spacing unit, or use '8px')
                              "&:hover": {
                                backgroundColor: "#007090", // Optional hover color
                              },
                            }}
                          >
                            <Add />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <TextField
                          type="number"
                          size="small"
                          value={item.price}
                          onChange={(e) =>
                            handlePriceChange(item.id, e.target.value)
                          }
                          onFocus={(e) => {
                            if (e.target.value !== "") {
                              handlePriceChange(item.id, "");
                            }
                          }}
                          inputProps={{ step: "0.05", min: "0.00" }}
                          onBlur={() => {
                            const num = parseFloat(item.price);
                            if (!isNaN(num)) {
                              handlePriceChange(item.id, num.toFixed(2));
                            }
                          }}
                          sx={{
                            ...sharedStyles,
                            flexGrow: 1,
                            "& .MuiInputBase-inputMultiline": {},
                            width: "100px",
                            height: "40px",
                            ml: "5px",
                            mb: "10px",
                            backgroundColor: "#e6f4f1",
                            border: "1px solid #1a7e96",
                            "& .MuiInputBase-input": {
                              color: "#111", // Replace "red" with any color you want
                              fontSize: 18,
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => resetMenuPrices()}
                          sx={{
                            color: "white",
                            mr: "8px",
                            backgroundColor: "#d97706",
                            mb: "10px",
                            "&:hover": {
                              backgroundColor: "#b45309", // Optional hover color
                            },
                          }} // Smaller button padding
                        >
                          <RestartAltOutlinedIcon />
                        </IconButton>
                      </Box>
                    </Paper>
                  </Grid2>
                ))}
              </Grid2>
            </Box>

            {/* 2 nd Column Tab menu */}
            <Box
              sx={{
                gridColumn: "span 3",
                width: "100%", // Narrow middle column
              }}
            >
              {/* StadCards */}
              <Box
                sx={{
                  backgroundColor: "#ebf1fa",
                  border: "1px solid #45a29e",
                  mt: 1,
                  height: "165px",
                }}
              >
                <StatCardVend
                  title2={`Today Sales`}
                  icon={
                    <PointOfSaleIcon
                      sx={{ color: colors.greenAccent[600], fontSize: "26px" }}
                    />
                  }
                  title={`€ ${formatCurrency(totalSalesToday)}`}
                  icon1={
                    <LoyaltyOutlinedIcon
                      sx={{ color: colors.orange[500], fontSize: "26px" }}
                    />
                  }
                  subtitle={`${todaysSales.length} Sales`}
                  icon2={
                    <CategoryOutlinedIcon
                      sx={{ color: colors.primary[200], fontSize: "26px" }}
                    />
                  }
                  subtitle2={`${totalItemsToday} Items`}
                />
              </Box>

              {/* Tab Menu */}
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "center", // Center horizontally
                }}
              >
                <Tabs
                  orientation="vertical"
                  value={selectedTab}
                  onChange={(_e, newValue) => setSelectedTab(newValue)}
                  variant="standard"
                  sx={{
                    height: "100%", // Full height
                    width: "100%", // Fixed width (optional)
                    mt: 0.5,
                    backgroundColor: "red",
                  }}
                >
                  {categories.map((cat, index) => (
                    <Tab
                      label={cat}
                      key={index}
                      sx={{
                        backgroundColor: "#545e75",
                        width: "100%",
                        maxWidth: "100%",
                        fontSize: 16,
                        fontWeight: 100,
                        color: "#cae9ff",
                        height: "50px",
                        justifyContent: "center",
                        borderBottom: "1px solid lightGray",
                        "&.Mui-selected": {
                          color: "#a7d7c5",
                          fontWeight: 700,
                          fontSize: 18,
                          backgroundColor: "#1a9cb3",
                        },
                        "&:hover": {
                          backgroundColor: "#007090",
                          fontWeight: 600,
                        },
                      }}
                    />
                  ))}
                </Tabs>
              </Box>

              {/* KeyPad Received Amount */}
              <Box className="flex-1 mt-1">
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 0.1,
                    mt: 0,
                    border: "1px solid #003049",
                  }}
                >
                  {[
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    ".",
                    "0",
                    "backspace",
                  ].map((key) =>
                    key === "backspace" ? (
                      <IconButton
                        key="backspace"
                        onClick={() =>
                          setReceivedAmount((prev) => prev.slice(0, -1))
                        }
                        sx={{
                          height: 50,
                          fontSize: 24,
                          width: "100%", // Makes it fill the grid column
                          minWidth: 0, // Crucial for responsiveness
                          border: "1px solid #003049",
                          borderRadius: 1,
                          color: "#003049",
                          "&:hover": {
                            backgroundColor: "#f0fff1",
                          },
                        }}
                      >
                        <BackspaceIcon />
                      </IconButton>
                    ) : (
                      <Button
                        key={key}
                        variant="outlined"
                        onClick={() => handleKeypadInput(key)}
                        sx={{
                          height: 50,
                          fontSize: 34,
                          border: "1px solid #003049",
                          color: "#003049",
                          width: "100%", // Ensures button fills grid cell
                          minWidth: 0, // Prevents default button minWidth from breaking layout
                          "&:hover": {
                            backgroundColor: "#f0fff1",
                          },
                        }}
                      >
                        {key}
                      </Button>
                    )
                  )}
                </Box>
              </Box>

              {/* Comment box */}
              <Box
                className="flex-1 mb-2 mt-1 w-full"
                display="flex"
                justifyContent="center"
                alignItems="center"
                sx={{
                  backgroundColor: "#white",
                  height: 50,
                }}
              >
                <IconButton
                  onClick={handleClick}
                  color="primary"
                  sx={{
                    borderRadius: 0,
                    width: "100%",
                    height: "100%",
                    border: "2px solid #003049",
                    "&:hover": {
                      backgroundColor: "#f0fff1",
                    },
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    sx={{
                      color: "#003049",
                      height: "100%",
                    }}
                  >
                    <ChatBubbleOutlineIcon />
                    <span>Comment</span>
                  </Box>
                </IconButton>

                <Popover
                  id={id}
                  open={open}
                  anchorEl={anchorEl}
                  onClose={handleClose}
                  onEntered={() => {
                    if (inputRef.current) {
                      inputRef.current.focus();
                    }
                  }}
                  anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left",
                  }}
                >
                  <Box sx={{ width: 250, position: "relative", p: 0 }}>
                    {/* Close Button */}
                    <IconButton
                      size="small"
                      onClick={handleClose}
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        zIndex: 1,
                        color: "#006ba6",
                      }}
                    >
                      <CancelOutlinedIcon fontSize="small" />
                    </IconButton>

                    {/* Comment Input */}
                    <FormControl fullWidth>
                      <TextField
                        fullWidth
                        variant="outlined"
                        multiline
                        minRows={2}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        inputRef={inputRef}
                        sx={{
                          backgroundColor: "#ebf1fa",
                          border: "2px solid #006ba6",
                          borderRadius: 1,
                          "& .MuiInputBase-inputMultiline": {
                            color: "#333",
                            fontSize: 16,
                            minHeight: "40px",
                            backgroundColor: "#ebf1fa",
                          },
                        }}
                      />
                    </FormControl>
                  </Box>
                </Popover>
              </Box>
            </Box>

            {/* 3rd Column: Sales Summary */}
            <Box
              sx={{
                gridColumn: "span 4", // Remaining 3 columns
                p: 0.5,
                mt: 0.5,
              }}
            >
              <Box
                className="w-full"
                display="flex"
                flexDirection="column"
                alignItems="center"
              >
                {/* Icon buttons in one row */}
                <Grid
                  container
                  sx={{ width: "100%", flexGrow: 1 }} // Optional: constrain width
                >
                  {[
                    {
                      value: "Cash",
                      icon: <AttachMoneyIcon />,
                      bgColor: "#545e75",
                      color: "#35ff69",
                    },
                    {
                      value: "CB",
                      icon: <CreditCardIcon />,
                      bgColor: "#545e75",
                      color: "#54defd",
                    },
                    {
                      value: "Voucher",
                      icon: <LocalActivityOutlinedIcon />,
                      bgColor: "#545e75",
                      color: "#ff3cc7",
                    },
                    {
                      value: "Other",
                      icon: <PaymentsOutlinedIcon />,
                      bgColor: "#545e75",
                      color: "#fed811",
                    },
                  ].map(({ value, icon, bgColor, color }) => (
                    <Grid item xs={3} key={value}>
                      <Tooltip
                        title={value}
                        arrow
                        placement="top"
                        slotProps={{
                          tooltip: {
                            sx: {
                              fontSize: 14,
                              fontWeight: 600,
                              backgroundColor: "#233d4d",
                              color: "white",
                            },
                          },
                        }}
                      >
                        <IconButton
                          value={value}
                          onClick={() => handlePaymentTypeChange(value)}
                          sx={{
                            color: paymentType === value ? "#ccdbdc" : "#777",
                            transition: "0.2s",
                            "&:hover": {
                              color: "#3FA89B",
                              backgroundColor: "#007090",
                            },
                            backgroundColor:
                              paymentType === value ? "#1a9cb3" : bgColor,
                            borderColor:
                              paymentType === value ? "#005ae0" : "#008083",
                            borderRadius: 0,
                            height: "60px",
                            width: "100%",
                            border: "1px solid white",
                          }}
                        >
                          {React.cloneElement(icon, {
                            sx: { fontSize: 32, color: color },
                          })}
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  ))}
                </Grid>

                {/* Save buttons below */}
                <Box display="flex" gap={0.4} my={0.5} width="100%">
                  <Button
                    variant="outlined"
                    startIcon={<Save />}
                    onClick={() => saveSale(false)}
                    sx={{
                      backgroundColor: "#26A889",
                      color: "white",
                      "&:hover": {
                        backgroundColor: "#62CDB4",
                      },
                      border: 0,
                      borderRadius: 0,
                      height: "100px",
                      width: "100%",
                      minWidth: 0, // Prevents default button minWidth from breaking layout
                    }}
                  >
                    Save
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => saveSale(true)}
                    sx={{
                      backgroundColor: "#00b4d8",
                      color: "white",
                      fontSize: 14,
                      "&:hover": {
                        backgroundColor: "#90e0ef",
                      },
                      border: 0,
                      borderRadius: 0,
                      height: "100px",
                      width: "100%",
                      minWidth: 0, // Prevents default button minWidth from breaking layout
                    }}
                  >
                    Print
                  </Button>
                </Box>
              </Box>

              {/* Sales Sumary */}
              <Box
                flex={2}
                width="100%"
                p={2}
                sx={{
                  flexGrow: 1,
                  backgroundColor: "#ebf1fa",
                  border: "1px solid #45a29e",
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="baseline"
                  mb={5}
                  mt={3}
                  sx={{
                    width: "100%",
                    minWidth: "0", // Ensure it doesn't shrink too much
                  }}
                >
                  <Box>
                    <Typography
                      sx={{ fontSize: 22, fontWeight: 500, color: "#3FA89B" }}
                    >
                      Honō
                    </Typography>
                    <Typography variant="h8">Order Summary</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {formattedDate}
                  </Typography>
                </Box>

                {order.map((item) => (
                  <Box
                    key={item.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={0} // Reduced vertical spacing
                  >
                    <Typography sx={{ fontSize: "0.875rem", lineHeight: 1.2 }}>
                      {item.quantity} {item.name} (€
                      {item.originalPrice?.toFixed(2)})
                      {item.price !== item.originalPrice &&
                        ` → €${item.price.toFixed(2)}`}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography>
                        €{(item.quantity * item.price).toFixed(2)}
                      </Typography>
                      <IconButton
                        onClick={() => removeFromOrder(item)}
                        sx={{ color: "#af3800", p: "4px" }} // Smaller button padding
                      >
                        <CancelOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}

                <Box
                  mt={2}
                  mb={3}
                  sx={{ width: "100%", minWidth: "0" }}
                >
                  <Typography sx={{ color: "#777", fontSize: 20 }}>
                    Received: €{formatCurrency(receivedAmount)}
                  </Typography>
                  <Typography sx={{ fontSize: 22 }}>
                    Total: €{formatCurrency(calculateTotal())}
                  </Typography>
                  <Typography sx={{ color: "#af3800", fontSize: 25 }}>
                    Change: €{formatCurrency(calculateChange())}
                  </Typography>
                </Box>

                <Box textAlign="center" mb={2}>
                  <Typography sx={{ fontSize: 16 }}>
                    Merci de soutenir les petits agriculteurs
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </motion.div>
      </main>
    </div>
  );
};

export default POSPage;
