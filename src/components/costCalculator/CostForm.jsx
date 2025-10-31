import CreditScoreOutlinedIcon from "@mui/icons-material/CreditScoreOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import {
  Box,
  Button,
  FormControl,
  GlobalStyles,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs"; // if not already imported
import { useEffect, useState } from "react";
import StatCard from "../common/StatCard";
import supabase from "../supabaseClient"; // update the path as needed
import { motion } from "framer-motion";

const CostForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [expensesFromInvoices, setExpensesFromInvoices] = useState(0); // already exists
  const [otherExpenses, setOtherExpenses] = useState("");
  const [totalExpenses, setTotalExpenses] = useState("");
  const [amountFromSales, setAmountFromSales] = useState(""); // already exists
  const [amountFromStockTake, setAmountFromStockTake] = useState(0);
  const [previousMonthTotal, setPreviousMonthTotal] = useState(0);
  const [otherRevenue, setOtherRevenue] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [reportId, setReportId] = useState(null); // Used to track update/delete target
  const [comment, setComment] = useState("");
  const [userId, setUserId] = useState(null); // Should be set from Supabase auth
  const [financialsData, setFinancialsData] = useState([]);
  const [netProfitFromDates, setNetProfit] = useState(0);
  const [loading] = useState(false);
  const [costSelected, setCostSelected] = useState(false);
  const [foodCostPercentage, setFoodCostPercentage] = useState(0);

  // Extract the last "NET profit" value
  const netProfit =
    financialsData.length > 0 ? financialsData[0].net_profit : 0;
  const revenue =
    financialsData.length > 0 ? financialsData[0].total_revenue : 0;
  const expenses =
    financialsData.length > 0 ? financialsData[0].total_expenses : 0;

  const profitMargin = revenue > 0 ? (revenue - expenses) / revenue : "0";

  // Initialize all variables before usage
  const expensesFromInvoicesVal = parseFloat(expensesFromInvoices) || 0;
  const otherExpensesVal = parseFloat(otherExpenses) || 0;

  const amountFromSalesVal = parseFloat(amountFromSales) || 0;
  const otherRevenueVal = parseFloat(otherRevenue) || 0;

  // Fetch current user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Fetch "Paid "invoices between dates
  useEffect(() => {
    const fetchData = async () => {
      // // Log fromDate and toDate before processing
      console.log("From Date:", fromDate);
      console.log("To Date:", toDate);

      // // Ensure fromDate and toDate are not null and fallback to defaults
      const validFromDate = fromDate
        ? dayjs(fromDate)
        : dayjs().startOf("month"); // Default to current month's start
      const validToDate = toDate ? dayjs(toDate) : dayjs().endOf("month"); // Default to current month's end

      // // Log whether the dates are valid
      console.log("Is 'fromDate' valid:", validFromDate.isValid());
      console.log("Is 'toDate' valid:", validToDate.isValid());

      // // If either date is invalid, log an error
      if (!validFromDate.isValid() || !validToDate.isValid()) {
        console.error("Invalid date value detected:", fromDate, toDate);
        return; // Exit if the dates are invalid
      }

      if (!fromDate || !toDate) return;

      const start = validFromDate.startOf("day").toISOString();
      const end = validToDate.endOf("day").toISOString();

      const { data, error } = await supabase
        .from("invoices")
        .select("amount_ttc")
        .gte("invoice_date", start)
        .lte("invoice_date", end);
      //.eq("paid", true);

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }

      console.log("Fetching invoices between", start, "and", end);

      const total = data.reduce((acc, curr) => acc + (curr.amount_ttc || 0), 0);
      setExpensesFromInvoices(total);
    };

    fetchData();
  }, [fromDate, toDate]);

  // Fetch Total sales Sales amount between dates
  useEffect(() => {
    const fetchData = async () => {
      // // Log fromDate and toDate before processing
      console.log("From Date:", fromDate);
      console.log("To Date:", toDate);

      // // Ensure fromDate and toDate are not null and fallback to defaults
      const validFromDate = fromDate
        ? dayjs(fromDate)
        : dayjs().startOf("month"); // Default to current month's start
      const validToDate = toDate ? dayjs(toDate) : dayjs().endOf("month"); // Default to current month's end

      // // Log whether the dates are valid
      console.log("Is 'fromDate' valid:", validFromDate.isValid());
      console.log("Is 'toDate' valid:", validToDate.isValid());

      // // If either date is invalid, log an error
      if (!validFromDate.isValid() || !validToDate.isValid()) {
        console.error("Invalid date value detected:", fromDate, toDate);
        return; // Exit if the dates are invalid
      }

      if (!fromDate || !toDate) return;

      const start = validFromDate.startOf("day").toISOString();
      const end = validToDate.endOf("day").toISOString();

      const { data, error } = await supabase
        .from("sales")
        .select("sale_total_disc")
        .gte("date", start)
        .lte("date", end);

      if (error) {
        console.error("Supabase SELECT error:", error.message);
        return;
      }
      console.log("Fetching sales between", start, "and", end);

      const total = data.reduce(
        (acc, curr) => acc + (curr.sale_total_disc || 0),
        0
      );
      setAmountFromSales(total);
    };

    fetchData();
  }, [fromDate, toDate]);

  // Fetch Total StockTake amount between dates and Previous month
  useEffect(() => {
    const fetchData = async () => {
      if (!fromDate || !toDate) return;

      const start = dayjs(fromDate).format("YYYY-MM-DD");
      const end = dayjs(toDate).endOf("day").format("YYYY-MM-DD HH:mm:ss");

      // Fix: use the same month for both start and end of previous month
      const previousMonth = dayjs(fromDate).subtract(1, "month");
      const prevMonthStart = previousMonth
        .startOf("month")
        .format("YYYY-MM-DD");
      const prevMonthEnd = previousMonth.endOf("month").format("YYYY-MM-DD");

      console.log("📅 Current Range:", start, "to", end);
      console.log(
        "📆 Previous Month Range:",
        prevMonthStart,
        "to",
        prevMonthEnd
      );

      try {
        // Fetch current month data
        const { data: currentData, error: currentError } = await supabase
          .from("stockTake")
          .select("date, total_value") // fetch date too for debugging
          .gte("date", start)
          .lte("date", end);

        if (currentError) {
          console.error(
            "❌ Error fetching current month:",
            currentError.message
          );
          return;
        }

        console.log("✅ Current Month Raw Data:", currentData);

        const currentTotal = currentData.reduce(
          (acc, curr) => acc + (curr.total_value || 0),
          0
        );

        // Fetch previous month data
        const { data: prevData, error: prevError } = await supabase
          .from("stockTake")
          .select("date, total_value") // fetch date too for debugging
          .gte("date", `${prevMonthStart} 00:00:00`)
          .lte("date", `${prevMonthEnd} 23:59:59`);

        if (prevError) {
          console.error("❌ Error fetching previous month:", prevError.message);
          return;
        }

        console.log("📊 Previous Month Raw Data:", prevData);

        const prevTotal = prevData.reduce(
          (acc, curr) => acc + (curr.total_value || 0),
          0
        );

        console.log("💰 Current Total:", currentTotal);
        console.log("📉 Previous Total:", prevTotal);

        setAmountFromStockTake(currentTotal);
        setPreviousMonthTotal(prevTotal);
      } catch (err) {
        console.error("❗ Unexpected error:", err);
      }
    };

    fetchData();
  }, [fromDate, toDate]);

  // Fetch Financials
  const fetchFinancials = async () => {
    const { data, error } = await supabase
      .from("financials")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching financials:", error);
    } else {
      setFinancialsData(data); // Save the financials data in the state
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  // Customization for decimals and thousands separators
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  // Sum Expenses and show in StatCard
  useEffect(() => {
    const invoiceVal = parseFloat(expensesFromInvoices) || 0;
    const otherVal = parseFloat(otherExpenses) || 0;
    setTotalExpenses(invoiceVal + otherVal);
  }, [expensesFromInvoices, otherExpenses]); // runs when either value changes

  // Handle change for otherExpenses
  const handleOtherExpenses = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, ""); // Clean string
    setOtherExpenses(raw); // Update otherExpenses
  };

  // Sum Revenues and show in StatCard
  useEffect(() => {
    const amountVal = parseFloat(amountFromSales) || 0;
    const otherRev = parseFloat(otherRevenue) || 0;
    setTotalRevenue(amountVal + otherRev);
  }, [amountFromSales, otherRevenue]); // runs when either value changes

  const handleOtherRevenueChange = (e) => {
    const raw = e.target.value.replace(/[^\d.]/g, ""); // Clean string
    setOtherRevenue(raw);
  };

  // Get Net Profit between date and show in StatCard
  useEffect(() => {
    setNetProfit(totalRevenue - totalExpenses);
  }, [totalRevenue, totalExpenses]);

  // Food Cost Percentage Calculation
  useEffect(() => {
    if (
      totalRevenue > 0 &&
      amountFromStockTake >= 0 &&
      previousMonthTotal >= 0 &&
      totalExpenses >= 0
    ) {
      const cost = totalExpenses + previousMonthTotal - amountFromStockTake;
      const fcPercent = (cost / totalRevenue) * 100;
      setFoodCostPercentage(fcPercent);
      console.log("💹 Food Cost %:", fcPercent.toFixed(2));
    } else {
      setFoodCostPercentage(0);
    }
  }, [totalRevenue, amountFromStockTake, previousMonthTotal, totalExpenses]);

  // ✅ Save Function
  const handleSave = async () => {
    if (!userId || !fromDate || !toDate) {
      alert("Missing required fields");
      return;
    }

    // Insert into Supabase
    const { error } = await supabase.from("financials").insert([
      {
        user_id: userId,
        date_from: dayjs(fromDate).format("YYYY-MM-DD"),
        date_to: dayjs(toDate).format("YYYY-MM-DD"),
        expenses_from_invoices: expensesFromInvoicesVal,
        other_expenses: otherExpensesVal,
        revenue_from_sales: amountFromSalesVal,
        other_revenues: otherRevenueVal,
        profit_margin: profitMargin,
        cost_perc: foodCostPercentage,
        comment: comment,
      },
    ]);

    if (error) {
      console.error("Save error:", error);
      alert("Failed to save.");
    } else {
      alert("Saved successfully.");
      setReportId(null); // Reset state
    }

    handleClear();
    fetchFinancials();
  };

  // 📝 Update Function
  const handleUpdate = async () => {
    if (!reportId) {
      alert("No report selected for update.");
      return;
    }

    const { error } = await supabase
      .from("financials")
      .update({
        date_from: dayjs(fromDate).format("YYYY-MM-DD"),
        date_to: dayjs(toDate).format("YYYY-MM-DD"),
        expenses_from_invoices: parseFloat(expensesFromInvoices) || 0,
        other_expenses: parseFloat(otherExpenses) || 0,
        revenue_from_sales: parseFloat(amountFromSales) || 0,
        other_revenues: parseFloat(otherRevenue) || 0,
        profit_margin: parseFloat(profitMargin) || 0,
        cost_perc: parseFloat(foodCostPercentage) || 0,
        comment: comment,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reportId);

    if (error) {
      console.error("Update error:", error);
      alert("Update failed.");
    } else {
      alert("Updated successfully.");
    }
    fetchFinancials();
    handleClear();
  };

  //❌ Delete Function with Confirmation
  const handleDelete = async () => {
    if (!reportId) {
      alert("No report selected to delete.");
      return;
    }

    const confirmed = window.confirm(
      "Do you really want to delete this entry?"
    );
    if (!confirmed) return; // User cancelled

    const { error } = await supabase
      .from("financials")
      .delete()
      .eq("id", reportId);

    if (error) {
      console.error("Delete error:", error);
      alert("Delete failed.");
    } else {
      alert("Deleted successfully.");
      setReportId(null); // Reset state
    }

    handleClear();
    fetchFinancials();
  };

  const handleClear = () => {
    setFromDate(null);
    setToDate(null);
    setExpensesFromInvoices("");
    setOtherExpenses("");
    setAmountFromSales("");
    setAmountFromStockTake("");
    setPreviousMonthTotal("");
    setOtherRevenue("");
    setTotalExpenses("");
    setTotalRevenue("");
    setComment("");
    setReportId(null);
    fetchFinancials();
    // reset flags so Save button becomes active again
    setCostSelected(false);
    setLoading(false);
  };

  // Fetch financials
  const handleCostSelect = async (reportId) => {
    setCostSelected(true); // Set costSelected to true
    try {
      // Fetch financials from "financials" table
      const { data: financials, error: financialsError } = await supabase
        .from("financials")
        .select("*")
        .eq("id", reportId)
        .single();

      if (financialsError) throw financialsError;

      // Set the current financials ID
      setReportId(reportId);

      // Set financials data in form fields
      setFromDate(financials.date_from ? dayjs(financials.date_from) : null);
      setToDate(financials.date_to ? dayjs(financials.date_to) : null);
      setExpensesFromInvoices(financials.expenses_from_invoices);
      setOtherExpenses(financials.other_expenses);
      setAmountFromSales(financials.revenue_from_sales);
      setOtherRevenue(financials.other_revenues);
      setComment(financials.comment);
    } catch (error) {
      console.error("Error loading financials:", error.message);
    }
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

  return (
    <main>
      <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 mb-3">
        {/* Grand Expenses & Grand Revenue */}
        <StatCard
          icon={
            <EventRepeatOutlinedIcon
              sx={{ color: "#38a3a5", fontSize: "26px" }}
            />
          }
          title={
            <span className={netProfit < 0 ? "text-red-400" : ""}>
              Net Profit:{"  "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "22px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                €{formatCurrency(netProfitFromDates)}
              </span>
            </span>
          }
          value={
            <span style={{ verticalAlign: "middle" }}>
              Cost:{"  "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                {formatCurrency(foodCostPercentage)}%
              </span>
            </span>
          }
          subtitle={
            <span style={{ verticalAlign: "middle" }}>
              Revenue:{"  "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                €{formatCurrency(totalRevenue)}
              </span>
            </span>
          }
          subtitle2={
            <span style={{ verticalAlign: "middle" }}>
              Expenses:{"  "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                €{formatCurrency(totalExpenses)}
              </span>
            </span>
          }
        />

        {/* Grand Net Revenue */}
        <StatCard
          icon={
            <CreditScoreOutlinedIcon
              sx={{ color: "#38a3a5", fontSize: "26px" }}
            />
          }
          title={"Latest Entry"}
          value={
            <span className={netProfit < 0 ? "text-red-400" : ""}>
              Net Profit: {"  "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                € {formatCurrency(netProfit)}
              </span>
            </span>
          }
          subtitle={
            <span style={{ verticalAlign: "middle" }}>
              Revenue:{"  "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                €{formatCurrency(revenue)}
              </span>
            </span>
          }
          subtitle2={
            <span style={{ verticalAlign: "middle" }}>
              Expenses:{"  "}
              <span
                style={{
                  color: "#00747c",
                  fontSize: "18px",
                  fontWeight: 500,
                  verticalAlign: "middle",
                }}
              >
                €{formatCurrency(expenses)}
              </span>
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
            p: 0.5,
            maxWidth: "700px",
          }}
        >
          <form
            onSubmit={(e) => e.preventDefault()}
            className="p-0 bg-gray-100 text-[#444]"
          >
            <h3 className="text-base mb-4 text-[#3FA89B] font-bold">
              GRAND TOTAL COST CALCULATOR
            </h3>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box
                display="grid"
                gap="15px"
                gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                sx={{
                  "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
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

                {/* Cost Date */}
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <DesktopDatePicker
                    label="Date From"
                    value={fromDate}
                    onChange={(newValue) => {
                      const selectedDate = dayjs(newValue);
                      setFromDate(selectedDate);
                      // If toDate is empty or equal to old fromDate, update it too
                      if (!toDate || toDate.isSame(fromDate, "day")) {
                        setToDate(selectedDate);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        sx: {
                          width: "100%",
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
                </FormControl>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <DesktopDatePicker
                    label="Date To"
                    value={toDate}
                    onChange={(newValue) => setToDate(dayjs(newValue))}
                    renderInput={(params) => (
                      <TextField {...params} fullWidth />
                    )}
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        sx: {
                          width: "100%",
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
                </FormControl>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Expenses from Invoices"
                    variant="outlined"
                    value={`€ ${formatCurrency(expensesFromInvoices)}`}
                    InputProps={{ readOnly: true }}
                    sx={{
                      ...sharedStyles,
                      input: { color: "#333", fontSize: 16 },
                    }}
                  />
                </FormControl>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Other Expenses"
                    variant="outlined"
                    value={otherExpenses}
                    onChange={handleOtherExpenses}
                    sx={{
                      ...sharedStyles,
                      input: { color: "#333", fontSize: 16 },
                    }}
                  />
                </FormControl>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Revenue from Sales"
                    variant="outlined"
                    value={
                      amountFromSales
                        ? `€ ${formatCurrency(amountFromSales)}`
                        : "€ 0.00"
                    }
                    slotProps={{ readOnly: true }}
                    sx={{
                      ...sharedStyles,
                      input: { color: "#333", fontSize: 16 },
                    }}
                  />
                </FormControl>

                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Other Revenue"
                    variant="outlined"
                    value={otherRevenue}
                    onChange={handleOtherRevenueChange}
                    sx={{
                      ...sharedStyles,
                      input: { color: "#333", fontSize: 16 },
                    }}
                  />
                </FormControl>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Prev. Stock Take"
                    variant="outlined"
                    value={`€ ${formatCurrency(previousMonthTotal)}`}
                    InputProps={{ readOnly: true }}
                    sx={{
                      ...sharedStyles,
                      input: { color: "#333", fontSize: 16 },
                    }}
                  />
                </FormControl>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 2", flexGrow: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Last Stock Take"
                    variant="outlined"
                    value={`€ ${formatCurrency(amountFromStockTake)}`}
                    InputProps={{ readOnly: true }}
                    sx={{
                      ...sharedStyles,
                      input: { color: "#333", fontSize: 16 },
                    }}
                  />
                </FormControl>
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ gridColumn: "span 4", flexGrow: 1 }}
                >
                  <TextField
                    fullWidth
                    label="Comment"
                    variant="outlined"
                    multiline
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    minRows={2}
                    sx={{
                      ...sharedStyles,
                      gridColumn: isMobile ? "span 2" : "span 2",

                      "& .MuiInputBase-inputMultiline": {
                        color: "#333", // ✅ text color for textarea
                        fontSize: 16,
                      },
                    }}
                  />
                </FormControl>
              </Box>
            </LocalizationProvider>
          </form>

          {/* Buttons */}
          <Box
            display="grid"
            gap="10px"
            gridTemplateColumns={isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)"}
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 2" },
              // backgroundColor: "orange",
              pb: 1,
            }}
          >
            <Button
              variant="contained"
              type="submit"
              onClick={handleSave}
              disabled={loading || costSelected} // <- add this
              sx={{
                gridColumn: isMobile ? "span 1" : "span 1",
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
              {loading ? "Saving..." : "Save"}
            </Button>

            <Button
              variant="contained"
              type="submit"
              onClick={handleUpdate}
              sx={{
                gridColumn: isMobile ? "span 1" : "span 1",
                backgroundColor: "#00b4d8",
                color: "white",
                fontSize: 14,
                "&:hover": {
                  backgroundColor: "#90e0ef",
                },
                marginTop: isMobile ? 2 : 2,
                height: 40,
              }}
            >
              Update
            </Button>

            <Button
              variant="contained"
              onClick={handleDelete}
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

            <Button
              variant="contained"
              onClick={handleClear}
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
              Clr
            </Button>
          </Box>
        </Box>

        {/* Saved Stock Takes */}
        <Box
          className="Saved Recipe List"
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: "auto",
            height: "auto", // Make sure not to force height
            minHeight: 0, // Allow shrinking if needed
            p: 0.5,
          }}
        >
          <div className="p-0 bg-gray-100 text-[#444]">
            <h2 className="text-base mb-4 text-[#3FA89B] font-bold">
              SAVED FINANCIALS
            </h2>

            <Box
              className="Saved Stock Take List"
              sx={{
                borderRadius: 0,
                border: "1px solid #60d394",
              }}
            >
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto hide-scrollbar">
                <table className="table-auto w-full text-sm">
                  <thead
                    className="bg-[#2a303a] sticky top-0 z-10"
                    style={{ borderBottom: "1px solid #60d394" }}
                  >
                    <tr>
                      <th className="p-2 text-center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        From
                      </th>
                      <th className="p-2 text-center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        To
                      </th>
                      <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Expenses
                      </th>
                      <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Revenue
                      </th>
                      <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Profit
                      </th>
                      <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Cost %
                      </th>
                      <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...financialsData]
                      .sort(
                        (a, b) => new Date(b.date_from) - new Date(a.date_from)
                      ) // descending order
                      .map((item, index) => (
                        <tr
                          key={index}
                          className="border-b hover:bg-gray-200"
                          onClick={() => handleCostSelect(item.id)} // 👈 Add this line
                        >
                          <td className="p-2 text-center">
                            {dayjs(item.date_from).format("DD-MM-YYYY")}
                          </td>
                          <td className="p-2 text-center">
                            {dayjs(item.date_to).format("DD-MM-YYYY")}
                          </td>
                          <td className="p-2 text-right">
                            € {formatCurrency(item.total_expenses)}
                          </td>
                          <td className="p-2 text-right">
                            € {formatCurrency(item.total_revenue)}
                          </td>
                          <td className="p-2 text-right">
                            €{" "}
                            {formatCurrency(
                              item.total_revenue - item.total_expenses
                            )}
                          </td>
                          <td className="p-2 text-right">
                            {formatCurrency(item.cost_perc)}%
                          </td>
                          <td className="p-2 text-left">
                            {item.comment || "No comment"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Box>
          </div>
        </Box>
      </Box>
    </main>
  );
};

export default CostForm;
