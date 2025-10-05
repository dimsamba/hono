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
import { Print, Save } from "@mui/icons-material";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import RestartAltOutlinedIcon from "@mui/icons-material/RestartAltOutlined";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import BackspaceIcon from "@mui/icons-material/Backspace";
import LunchDiningOutlinedIcon from "@mui/icons-material/LunchDiningOutlined";
import LocalDrinkOutlinedIcon from "@mui/icons-material/LocalDrinkOutlined";
import AgricultureOutlinedIcon from "@mui/icons-material/AgricultureOutlined";

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
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
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
  const [paymentType, setPaymentType] = useState("Espèces");
  const [sampleMenu, setSampleMenu] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  //const categories = ["Food", "Beverage", "Produces"];
  const categories = [
    { label: "Food", icon: <LunchDiningOutlinedIcon /> },
    { label: "Beverage", icon: <LocalDrinkOutlinedIcon /> },
    { label: "Produces", icon: <AgricultureOutlinedIcon /> },
  ];
  const currentCategory = categories[selectedTab]?.label;
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
        .eq("category", currentCategory) // Only fetch active items
        .eq("active", true); // ✅ Only fetch active items

      if (error) {
        console.error("Error fetching itemsList:", error.message);
      } else {
        const formatted = data.map((item) => ({
          id: item.id,
          name: item.item_name,
          price: item.item_price,
          originalPrice: item.item_price,
          originalName: item.item_name,
          category: item.category,
          imageUrl: item.image
            ? item.image.startsWith("http")
              ? item.image
              : `/images/${item.image}`
            : null,
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

    // ✅ Get the next order number from Supabase
    const { data: orderNum, error: numError } = await supabase.rpc(
      "get_next_order_number"
    );
    if (numError) {
      console.error("Error generating order number:", numError);
      alert("Error generating order number.");
      return;
    }

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
      orderNumber: orderNum, // ✅ Now from Supabase
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

      setPaymentType("Espèces");
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

        triggerPrint(saleData);
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
    const logoUrl = `data:image/png;base64,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`;

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
    <link href="https://fonts.googleapis.com/css2?family=Dancing+Script&display=swap" rel="stylesheet">

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
        margin-top: 50px;
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
      .summary-row {
        display: flex;
        justify-content: space-between;
        width: 100%;
      }
      .summary-row p {
        margin: 0; /* optional: removes extra spacing */
      }
    </style>
  </head>
  <body>

<div style="display: flex; flex-direction: column; align-items: center; text-align: center;">
 <img src="${logoUrl}" alt="Honō Logo" style="height: 60px; margin-bottom: 4px;" />
 <h4 style="margin: 0; font-family: 'Dancing Script', cursive; font-size: 20px;">La flamme du savoir-faire</h4>
<p style="font-size: 16px; margin: 0;">✽ ✽ ✽</p>
  <p style="margin: 0; font-size: 14px;">12 Rue des Lilas, 75000 Paris</p>
  <p style="margin: 0; font-size: 14px;">SIRET: 123 456 789 00010</p>
  <p style="margin: 0; font-size: 14px;">Tel: 06 37 65 87 95</p>
</div>
<div>
 <p style="text-align: center; font-weight: bold; font-size: 28px;">
  <strong></strong> ${saleData.orderNumber}
 </p>
 <p style="text-align: center; margin-bottom: 25px;">N. de Commande</p>
</div>
    <p><strong>Date:</strong> ${formatDateEU(saleData.date)}</p>

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
     <div class="summary-row">
      <p>Référence:<strong> 000${latestId ?? "N/A"}</strong></p>
      <p style="text-align: right;">Sous-total:<strong> €${saleData.sales_total.toFixed(
        2
      )}</strong></p>
     </div>

      <div class="summary-row">
      <p>Payé par/en:<strong> ${saleData.payment_type}</strong></p>
     <p style="text-align: right;">Réduction:<strong> ${
       saleData.discount_perc
     }%</strong></p>
     </div>


     <h2 style="text-align: right;">À payer:<strong> €${saleData.sale_total_disc.toFixed(
       2
     )}</strong></h2>


     <p style="text-align: right;">Montant reçu:<strong> €${saleData.received_amount.toFixed(
       2
     )}</strong></p>
     <p style="text-align: right; margin-bottom: 25px;">Rendue:<strong> €${saleData.change_given.toFixed(
       2
     )}</strong></p>

       <hr class="divider" />

      <div class="summary-row">
      <p>Taux TVA</p>
      <p style="text-align: right;">Total HT</p>
      <p style="text-align: right;">dont TVA</p>
     </div>
      <div class="summary-row">
      <p><strong>20%</strong></p>
      <p style="text-align: center;"><strong> €${(
        saleData.sales_total / 1.2
      ).toFixed(2)}</strong></p>
      <p style="text-align: center;"><strong> €${(
        saleData.sales_total -
        saleData.sales_total / 1.2
      ).toFixed(2)}</strong></p>
     </div>

  </div>

    <div class="thankyou">
      <h4 style="margin: 20px 0 0; font-family: 'Dancing Script', cursive; font-size: 20px;">
    Merci de soutenir les petits agriculteurs
  </h4>
    </div>
  </body>
  </html>
  `;

    const printWindow = window.open("", "_blank", "width=800,height=600");
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for the content to load before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
    };
  };

  // Handle the click on an IconButton
  const handlePaymentTypeChange = (value) => {
    setPaymentType(value);
    // Here, you can handle saving the value (e.g., to the backend or state)
    console.log("Selected payment type:", value);
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
        return "#fad2e1"; // warm orange tone
      case "produces":
        return "#bee1e6 "; // rich green tone
      default:
        return "#dfe7fd"; // default purple tone
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

  const disableActionButtons =
    order.length === 0 || !receivedAmount || receivedAmount < calculateTotal();

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
  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-[#fcfeff]">
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          width: "100%",
          bgcolor: "#fcfeff",
        }}
      >
        <Grid
          container
          sx={{
            mb: 0.5,
            maxWidth: "1280px",
            width: "100%",
            mx: "auto",
          }}
        >
          {/* StatCard Box */}
          <Grid item xs={12}>
            <Box
              sx={{ 
                backgroundColor: "#264653",
                height: "45px",
                borderBottom: "1px solid #45a29e",
                width: "100%",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center", // vertically center StatCardVend
              }}
            >
              <StatCardVend
                title2="Today Sales"
                icon={
                  <PointOfSaleIcon
                    sx={{
                      color: "#118ab2",
                      fontSize: "20px",
                    }}
                  />
                }
                title={`€ ${formatCurrency(totalSalesToday)}`}
                icon1={
                  <LoyaltyOutlinedIcon
                    sx={{ color: "#118ab2", fontSize: "26px" }}
                  />
                }
                subtitle={`${todaysSales.length} Sales`}
                icon2={
                  <CategoryOutlinedIcon
                    sx={{ color: "#118ab2", fontSize: "26px" }}
                  />
                }
                subtitle2={`${totalItemsToday} Items`}
              />
            </Box>
            <Box
              sx={{
                backgroundColor: "#264653",
                height: "40px",
                width: "100%",
                textAlign: "center",
                display: "flex",
                justifyContent: "center",
                alignItems: "center", // vertically center StatCardVend
              }}
            >
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center", // vertically center StatCardVend
                }}
              >
                <Typography sx={{ color: "#cae9ff", fontSize: 18 }}>
                  Total:
                </Typography>
                <Typography sx={{ color: "#cae9ff", fontSize: 22, ml: 1 }}>
                  €{formatCurrency(calculateTotal())}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: "100%",
                }}
              >
                <IconButton
                  onClick={handleClick}
                  variant="contained"
                  color="primary"
                  sx={{
                    color: "white",
                    backgroundColor: "#e36414",
                    borderRadius: 0,
                    width: "100%",
                    height: "40px",
                    "&:hover": {
                      backgroundColor: "#9a031e", // Optional hover color
                    },
                  }}
                >
                  Check out
                </IconButton>
              </Box>
            </Box>
          </Grid>

          {/* Tabs Box */}
          <Grid
            container
            spacing={0}
            sx={{
              mx: 0,
              width: "100%",
              mt: 0.3,
              justifyContent: "center",
            }}
          >
            <Box
              sx={{
                display: "flex",
                width: "100%",
              }}
            >
              <Tabs
                value={selectedTab}
                onChange={(_e, newValue) => setSelectedTab(newValue)}
                variant="fullWidth"
                sx={{
                  width: "100%",
                  "& .MuiTabs-flexContainer": {
                    gap: "2px",
                    flexDirection: "row", // always row
                  },
                  "& .MuiTab-root": {
                    flex: 1, // 👈 equal width
                    minWidth: 0, // 👈 prevents overflow on small screens
                    minHeight: "45px",
                    backgroundColor: "#4f6d7a",
                    fontSize: "20px",
                    fontWeight: 100,
                    color: "#cae9ff",
                    "&.Mui-selected": {
                      color: "#1e6091",
                      fontWeight: 700,
                      fontSize: "28px !important",
                      backgroundColor: "#4cc9f0",
                    },
                    "&:hover": {
                      backgroundColor: "#4cc9f0",
                      fontWeight: 600,
                      color: "#1e6091",
                    },
                  },
                  "& .MuiTab-wrapper": {
                    width: "100%",
                  },
                  "& .MuiTabs-indicator": {
                    bottom: 0,
                    height: "4px",
                    backgroundColor: "#9ef01a",
                  },
                }}
              >
                {categories.map((cat, index) => (
                  <Tab
                    key={index}
                    icon={
                      React.isValidElement(cat.icon)
                        ? React.cloneElement(cat.icon, {
                            sx: {
                              fontSize: { xs: 30, sm: 30, md: 30 },
                            }, // responsive sizes
                          })
                        : null
                    }
                    aria-label={cat.label}
                  />
                ))}
              </Tabs>
            </Box>
          </Grid>
        </Grid>
      </Box>
      <main
        className="max-w-7xl mx-auto scrollbar-hide h-[700px] overflow-y-auto md:overflow-y-hidden bg-[#fcfeff]"
        style={{
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Items buttons and Sale Summary */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-6 gap-1 mb-0 bg-slate-100"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* pop Over with Keypad, paiment type */}
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={handleClose}
            anchorReference="anchorPosition"
            onEntered={() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }}
            anchorPosition={{
              top: window.innerHeight / 2,
              left: window.innerWidth / 2,
            }}
            transformOrigin={{
              vertical: "center",
              horizontal: "center",
            }}
            sx={{
              "& .MuiPaper-root": {
                backgroundColor: "#edf2fb",
                border: "2px solid green",
                p: 0.5,
                width: "330px",
              },
            }}
          >
            {/* Display Total */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between", // keep left & right separation
                alignItems: "flex-end", // 👈 push text to bottom
                borderTop: "1px solid #3FA89B",
                px: 0.5,
                height: "50px", // 👈 give it a fixed or relative height
              }}
            >
              <Typography sx={{ color: "#007ea7", fontSize: 28 }}>
                Sale Total:
              </Typography>
              <Typography sx={{ color: "#007ea7", fontSize: 28 }}>
                €{formatCurrency(calculateTotal())}
              </Typography>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between", // keep left & right separation
                alignItems: "flex-end", // 👈 push text to bottom
                px: 0.5,
                height: "20px", // 👈 give it a fixed or relative height
              }}
            >
              <Typography sx={{ color: "#1b4965", fontSize: 18 }}>
                Received:
              </Typography>
              <Typography sx={{ color: "#1b4965", fontSize: 20 }}>
                €{formatCurrency(receivedAmount)}
              </Typography>
            </Box>
            {/* Icon buttons in one row */}
            <Box
              className="w-full"
              display="flex"
              flexDirection="column"
              alignItems="center"
            >
              <Grid
                container
                sx={{ width: "100%", flexGrow: 1 }} // Optional: constrain width
              >
                {[
                  {
                    value: "Espèces",
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
                    value: "Bon d'achat",
                    icon: <LocalActivityOutlinedIcon />,
                    bgColor: "#545e75",
                    color: "#ff3cc7",
                  },
                  {
                    value: "Autres",
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
                  onClick={() => {
                    saveSale(false);
                    handleClose(); // 👈 close after saving
                  }}
                  disabled={disableActionButtons}
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
                    minWidth: 0,
                    opacity: disableActionButtons ? 0.5 : 1, // Optional: visual feedback
                    pointerEvents: disableActionButtons ? "none" : "auto", // Optional: make fully inactive
                  }}
                >
                  Pay & Save
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => {
                    saveSale(true);
                    handleClose(); // 👈 close after saving
                  }}
                  disabled={disableActionButtons}
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
                    minWidth: 0,
                    opacity: disableActionButtons ? 0.5 : 1,
                    pointerEvents: disableActionButtons ? "none" : "auto",
                  }}
                >
                  Pay & Print
                </Button>
              </Box>
            </Box>

            {/* KeyPad Received Amount */}
            <Box className="flex-1 mt-1">
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 0.1,
                  mb: 1,
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

            {/* Comment Input */}
            <Box sx={{ width: "100%", position: "relative" }}>
              <FormControl
                sx={{
                  width: "100%",
                  flexGrow: 1,
                  minWidth: 0,
                }}
              >
                <TextField
                  variant="outlined"
                  multiline
                  label={"Comment"}
                  minRows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  inputRef={inputRef}
                  sx={{
                    ...sharedStyles,
                    mt: 0.5,
                    flexGrow: 1,
                    minWidth: 0,
                    "& .MuiInputBase-inputMultiline": {
                      color: "#555",
                      fontSize: 18,
                      minHeight: "40px",
                    },
                  }}
                />
              </FormControl>
            </Box>

            {/* Clear comment and Close Buttons */}
            <Box display="flex" gap={0.4} my={0.5} width="100%">
              <Button
                variant="outlined"
                onClick={() => setComment("")}
                sx={{
                  backgroundColor: "#f0c808",
                  color: "white",
                  fontSize: 14,
                  "&:hover": {
                    backgroundColor: "#ff8600",
                  },
                  border: 0,
                  borderRadius: 0.5,
                  height: "50px",
                  width: "100%",
                  minWidth: 0, // Prevents default button minWidth from breaking layout
                  minWidth: 0,
                }}
              >
                Clear
              </Button>
              <Button
                variant="outlined"
                onClick={handleClose}
                sx={{
                  backgroundColor: "#d00000",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#ba324f",
                  },
                  border: 0,
                  borderRadius: 0.5,
                  height: "50px",
                  width: "30%",
                  minWidth: 0, // Prevents default button minWidth from breaking layout
                  minWidth: 0,
                }}
              >
                Close
              </Button>
            </Box>
          </Popover>

          {/* 1st Column Items grid */}
          <div className="md:col-span-4">
            <Box
              sx={{
                border: "1px solid #45a29e",
                height: { xs: "auto", md: 630 },
                overflowX: "hidden", // 👈 stop horizontal scroll
                backgroundColor: "#ebf1fa",
              }}
            >
              {/* Items Grid */}
              <Grid2
                container
                spacing={0.5}
                sx={{
                  mx: 0,
                  width: "100%",
                  p: 0,
                  alignContent: "flex-start",
                }}
              >
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
                        backgroundColor: getCategoryColor(item.category),
                        borderRadius: 0,
                      }}
                    >
                      <IconButton
                        key={item.id}
                        onClick={() => addToOrder(item)}
                        disabled={!item.price || item.price === ""}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          width: "100%",
                          height: "120px",
                          borderRadius: 0,
                          flexDirection: "column",
                          textAlign: "center",
                          backgroundImage: item.imageUrl
                            ? `url(${item.imageUrl})`
                            : "none",
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                          backgroundRepeat: "no-repeat",
                          position: "relative",
                          "&:hover": {
                            filter: "brightness(0.75)", // darken on hover
                          },
                          opacity: !item.price || item.price === "" ? 0.5 : 1,
                        }}
                      >
                        <Typography
                          sx={{
                            position: "absolute",
                            top: 1,
                            left: 3,
                            fontSize: 20,
                            fontWeight: 900,
                            color: "#fff",
                            textShadow: "0px 0px 5px #000814",
                            textAlign: "left",
                            width: "100%",
                            height: "3em", // Fixed height to accommodate 2 lines
                          }}
                        >
                          {item.name}
                        </Typography>
                      </IconButton>

                      <Box display="flex" alignItems="center">
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
                            flexGrow: 1,
                            width: "100px",
                            height: "43px",
                            backgroundColor: "#073b4c",
                            color: "white",
                            "& .MuiInputBase-input": {
                              fontSize: 18,
                              "&::-webkit-inner-spin-button": {
                                WebkitAppearance: "none",
                              },
                            },
                          }}
                        />
                        <IconButton
                          onClick={() => resetMenuPrices()}
                          variant="contained"
                          sx={{
                            color: "white",
                            backgroundColor: "#ef476f",
                            borderRadius: 0,
                            width: "40px",
                            height: "43px",
                            "&:hover": {
                              backgroundColor: "#ea7317", // Optional hover color
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
          </div>

          {/* 2rd Column: Sales Summary */}
          <div className="md:col-span-2">
            <Box
              flex={2}
              width="100%"
              sx={{
                flexGrow: 1,
                backgroundColor: "#ebf1fa",
                border: "1px solid #45a29e",
                height: "630px",
              }}
            >
              <Box
                mb={3}
                sx={{
                  width: "100%",
                  minWidth: "0", // Ensure it doesn't shrink too much
                  textAlign: "center", // Center all text inside
                  borderBottom: "1px solid #3FA89B",
                  paddingBottom: 1,
                  paddingTop: 1,
                  backgroundColor: "#264653",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center", // vertically center StatCardVend
                }}
              >
                <Typography sx={{ color: "#cae9ff", fontSize: 18 }}>
                  Order Summary
                </Typography>
              </Box>

              {/* Order Items */}
              <Box
                sx={{
                  maxHeight: "205px",
                  overflowY: "auto",
                  px: 0.5,
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                }}
              >
                {order.map((item) => (
                  <Box
                    key={item.id}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      maxHeight: "200px !important",
                      overflowY: "auto",
                      scrollbarWidth: "none", // Firefox
                      "&::-webkit-scrollbar": {
                        display: "none", // Chrome, Safari, Edge
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: "0.875rem",
                        lineHeight: 1.2,
                        color: "#1b4965",
                      }}
                    >
                      {item.quantity} {item.name} (€
                      {item.originalPrice?.toFixed(2)})
                      {item.price !== item.originalPrice &&
                        ` → €${item.price.toFixed(2)}`}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          lineHeight: 1.2,
                          color: "#1b4965",
                        }}
                      >
                        €{(item.quantity * item.price).toFixed(2)}
                      </Typography>
                      <IconButton
                        onClick={() => removeFromOrder(item)}
                        sx={{ color: "#1b4965", p: "4px" }} // Smaller button padding
                      >
                        <CancelOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Footer */}
              <Box mt={1} sx={{ width: "100%", minWidth: 0 }}>
                {/* Row 1 */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid #3FA89B",
                    px: 0.5,
                    height: "60px",
                  }}
                >
                  <Typography sx={{ color: "#007ea7", fontSize: 30 }}>
                    Total:
                  </Typography>
                  <Typography sx={{ color: "#007ea7", fontSize: 30 }}>
                    €{formatCurrency(calculateTotal())}
                  </Typography>
                </Box>

                {/* Row 2 */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 0.5,
                    height: "20px",
                  }}
                >
                  <Typography sx={{ color: "#1b4965", fontSize: 20 }}>
                    Received:
                  </Typography>
                  <Typography sx={{ color: "#1b4965", fontSize: 25 }}>
                    €{formatCurrency(receivedAmount)}
                  </Typography>
                </Box>

                {/* Row 3 */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 0.5,
                  }}
                >
                  <Typography sx={{ color: "#d90368", fontSize: 20 }}>
                    Change:
                  </Typography>
                  <Typography sx={{ color: "#d90368", fontSize: 25 }}>
                    €{formatCurrency(calculateChange())}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default POSPage;
