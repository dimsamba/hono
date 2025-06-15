// ... (imports unchanged)
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import LoyaltyOutlinedIcon from "@mui/icons-material/LoyaltyOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { v4 as uuidv4 } from "uuid"; // NEW: for unique order item keys
import StatCard from "../components/common/StatCard";
import StatCardVend from "../components/common/StatCardVend";
// Add to the top of the file:
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import LocalActivityOutlinedIcon from "@mui/icons-material/LocalActivityOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import Tooltip from "@mui/material/Tooltip";
import { motion } from "framer-motion";
import React, { useEffect, useMemo, useState } from "react";
import supabase from "../components/supabaseClient";
import { tokens } from "../components/theme";
import { Add, Print, Save } from "@mui/icons-material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
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
      alert("Sale saved successfully.");

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

  // Print Layout
  const triggerPrint = (saleData) => {
    // Format date to European format (dd-mm-yyyy HH:MM:SS)
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

    // Parse items if they're stored as a string (in case it wasn't parsed earlier)
    if (typeof saleData.items === "string") {
      saleData.items = JSON.parse(saleData.items);
    }

    const itemsHtml = saleData.items
      .map((item) => {
        const hasDiscount =
          item.originalPrice != null && item.price !== item.originalPrice;

        const original =
          item.originalPrice != null
            ? item.originalPrice.toFixed(2) // If originalPrice is available, format it
            : item.price.toFixed(2); // Otherwise, use the current price
        const discounted = item.price.toFixed(2); // The discounted price
        const total = (item.quantity * item.price).toFixed(2); // The total for the item

        // Display the price with discount if applicable
        const priceDisplay = hasDiscount
          ? `(€${original}) → €${discounted}` // If there's a discount, show both
          : `€${original}`; // If no discount, show the original price only

        // Return the HTML structure for this item
        return `
      <tr>
        <td>${item.name}</td>
        <td class="right">${item.quantity}</td>
        <td class="right">${priceDisplay}</td>
        <td class="right">€${total}</td>
      </tr>`;
      })
      .join(""); // Join all the rows together to make a full HTML table body

    // Now the HTML content
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
    <h2>Honō</h2>
    <p><strong>Date:</strong> ${formatDateEU(saleData.date)}</p>
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

    // Open the print window and add the HTML content
    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Trigger print
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
      color: "#287271",
      fontSize: 16,
      backgroundColor: "#ebf1fa",
      px: 1,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #45a29e",
      },
      "&:hover fieldset": {
        borderColor: "#45a29e",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#1e7f74",
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

  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-[#18435a] ">
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
            gridTemplateColumns="repeat(12, minmax(0, 1fr))"
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
                borderRight: "1px solid #3a6c77",
                px: 0.5,
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
                gridColumn: "span 2", // Narrow middle column
                borderRight: "1px solid #3a6c77",
              }}
            >
              {/* StadCards */}
              <Box>
                <StatCardVend
                  title2={`Today Sales`}
                  icon={
                    <PointOfSaleIcon
                      sx={{ color: colors.greenAccent[400], fontSize: "26px" }}
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
                      sx={{ color: colors.primary[100], fontSize: "26px" }}
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
                    width: "100%", // Fixed width (optional)
                    mt: 1,
                    p: 0,
                  }}
                >
                  {categories.map((cat, index) => (
                    <Tab
                      label={cat}
                      key={index}
                      sx={{
                        backgroundColor: "#545e75",
                        width: "100%",
                        fontSize: 16,
                        fontWeight: 100,
                        color: "#cae9ff",
                        height: "70px",
                        justifyContent: "center",
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

              {/* TextField Received Amount and Comments */}
              <Box className="flex-1 mt-1">
                <FormControl fullWidth>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Cash Amount"
                    value={receivedAmount}
                    onChange={(e) => setReceivedAmount(e.target.value)}
                    type="number"
                    sx={{
                      ...sharedStyles,
                      "& .MuiInputBase-input": {
                        color: "#222",
                        fontSize: 28,
                        height: "60px",
                      },
                    }}
                  />
                </FormControl>
              </Box>
              <Box className="flex-1 mb-2 mt-1">
                <FormControl fullWidth>
                  <TextField
                    fullWidth
                    variant="outlined"
                    label="Comment"
                    multiline
                    minRows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    sx={{
                      ...sharedStyles,
                      "& .MuiInputBase-inputMultiline": {
                        color: "#333",
                        fontSize: 14,
                        minHeight: "60px",
                      },
                    }}
                  />
                </FormControl>
              </Box>
            </Box>

            {/* 3rd Column: Sales Summary */}
            <Box
              sx={{
                gridColumn: "span 4", // Remaining 3 columns
                p: 1,
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
                      bgColor: "#eafaf7",
                      color: "#287271",
                    },
                    {
                      value: "CB",
                      icon: <CreditCardIcon />,
                      bgColor: "#eafaf7",
                      color: "#72369d",
                    },
                    {
                      value: "Voucher",
                      icon: <LocalActivityOutlinedIcon />,
                      bgColor: "#eafaf7",
                      color: "#f50062",
                    },
                    {
                      value: "Other",
                      icon: <PaymentsOutlinedIcon />,
                      bgColor: "#eafaf7",
                      color: "#0e1428",
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
                              backgroundColor: "#aaf683",
                            },
                            backgroundColor:
                              paymentType === value ? "#b2ff9e" : bgColor,
                            borderColor:
                              paymentType === value ? "#005ae0" : "#008083",
                            borderRadius: 0,
                            height: "60px",
                            width: "100%",
                            border: 2,
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
                <Box display="flex" gap={0.4} my={0.5} width="100%" px={0.1}>
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
                      height: "80px",
                      width: "100%",
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
                      height: "80px",
                      width: "100%",
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
                sx={{ flexGrow: 1, backgroundColor: "#e1eff6" }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="baseline"
                  mb={5}
                  mt={3}
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

                <Box mt={2} mb={3}>
                  <Typography sx={{ color: "#777", fontSize: 20 }}>
                    Received: €{parseFloat(receivedAmount || 0).toFixed(2)}
                  </Typography>
                  <Typography sx={{ fontSize: 22 }}>
                    Total: €{calculateTotal().toFixed(2)}
                  </Typography>
                  <Typography sx={{ color: "#af3800", fontSize: 25 }}>
                    Change: €{calculateChange()}
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
