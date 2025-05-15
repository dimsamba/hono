import { Box, Button, TextField, useTheme, useMediaQuery } from "@mui/material";
import EuroSymbolOutlinedIcon from "@mui/icons-material/EuroSymbolOutlined";
import { motion } from "framer-motion";
import { tokens } from "../theme";
import StatCard from "../common/StatCard";
import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DesktopDatePicker } from "@mui/x-date-pickers";
import supabase from "../supabaseClient"; // update the path as needed
import dayjs from "dayjs"; // if not already imported

const CostForm = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [expensesFromInvoices, setExpensesFromInvoices] = useState(""); // already exists
  const [otherExpenses, setOtherExpenses] = useState("");
  const [totalExpenses, setTotalExpenses] = useState("");
  const [amountFromSales, setAmountFromSales] = useState(""); // already exists
  const [otherRevenue, setOtherRevenue] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [reportId, setReportId] = useState(null); // Used to track update/delete target
  const [comment, setComment] = useState("");
  const [userId, setUserId] = useState(null); // Should be set from Supabase auth
  const [financialsData, setFinancialsData] = useState([]);
  const [netProfitFromDates, setNetProfit] = useState(0);
  const [costSelected, setCostSelected] = useState(false);

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

  // Calculate Profit percentage between dates
  const profitMarginBetwnDates =
    totalRevenue > 0 ? (totalRevenue - totalExpenses) / totalRevenue : "0";

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
    if (!fromDate || !toDate) return; // ⛔️ Don't fetch if dates aren't ready

    const fetchInvoiceExpenses = async () => {
      if (!dayjs(fromDate).isValid() || !dayjs(toDate).isValid()) {
        console.error("Invalid date input", { fromDate, toDate });
        return;
      }

      const { data, error } = await supabase
        .from("invoices")
        .select("amount_ttc")
        .gte("invoice_date", dayjs(fromDate).format("YYYY-MM-DD"))
        .lte("invoice_date", dayjs(toDate).format("YYYY-MM-DD"))
        .eq("paid", true);

      if (error) {
        console.error("Error fetching invoices:", error);
        setExpensesFromInvoices("");
        return;
      }

      const total = data.reduce((sum, item) => sum + (item.amount_ttc || 0), 0);
      setExpensesFromInvoices(total.toFixed(2));
    };

    fetchInvoiceExpenses();
  }, [fromDate, toDate]);

  // Fetch Total sales amount between dates
  useEffect(() => {
    const fetchSalesAmount = async () => {
      if (!fromDate || !toDate) return;

      const { data, error } = await supabase
        .from("sales")
        .select("total_value_item")
        .gte("sale_date", dayjs(fromDate).format("YYYY-MM-DD"))
        .lte("sale_date", dayjs(toDate).format("YYYY-MM-DD"));

      if (error) {
        console.error("Error fetching sales:", error);
        fetchSalesAmount("");
        return;
      }

      const total = data.reduce(
        (sum, item) => sum + (item.total_value_item || 0),
        0
      );
      setAmountFromSales(total.toFixed(2)); // Format as string with 2 decimals
    };

    fetchSalesAmount();
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

  // Get Net Profict between date and show in StatCard
  useEffect(() => {
    setNetProfit(totalRevenue - totalExpenses);
  }, [totalRevenue, totalExpenses]);

  // ✅ Save Function
  const handleSave = async () => {
    if (!userId || !fromDate || !toDate) {
      alert("Missing required fields");
      return;
    }

    // Insert into Supabase
    const { data, error } = await supabase.from("financials").insert([
      {
        user_id: userId,
        date_from: dayjs(fromDate).format("YYYY-MM-DD"),
        date_to: dayjs(toDate).format("YYYY-MM-DD"),
        expenses_from_invoices: expensesFromInvoicesVal,
        other_expenses: otherExpensesVal,
        revenue_from_sales: amountFromSalesVal,
        other_revenues: otherRevenueVal,
        profit_margin: profitMargin,
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
    setOtherRevenue("");
    setTotalExpenses("");
    setTotalRevenue("");
    setComment("");
    setReportId(null);
    fetchFinancials();
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

  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-primary-700">
      <main className="max-w-5xl mx-auto py-6 px-4 lg:px-8 scrollbar-hide">
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Box
            display="grid"
            gap="15px"
            gridTemplateColumns="repeat(2, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            }}
          >
            {/* Grand Expenses & Grand Revenue */}
            <StatCard
              icon={
                <EuroSymbolOutlinedIcon
                  sx={{ color: colors.greenAccent[400], fontSize: "26px" }}
                />
              }
              title={"Sumary between dates"}
              value={
                <span className={netProfitFromDates < 0 ? "text-red-400" : ""}>
                  Net Profit: € {formatCurrency(netProfitFromDates)}
                </span>
              }
              subtitle={`Revenue: € ${formatCurrency(totalRevenue)}`}
              subtitle2={`Expenses: € ${formatCurrency(totalExpenses)}`}
              progress={profitMarginBetwnDates} // Ensures it's a valid number for the progress bar
              increase={
                <span className={profitMarginBetwnDates < 0 ? "text-red-400" : ""}>
                  {`${(profitMarginBetwnDates * 100).toFixed(2)} %`}
                </span>
              }
              sx={{
                gridColumn: "span 1",
              }}
            />

            {/* Grand Net Revenue */}
            <StatCard
              icon={
                <EuroSymbolOutlinedIcon
                  sx={{ color: colors.greenAccent[400], fontSize: "26px" }}
                />
              }
              title={"Latest Entry"}
              value={
                <span className={netProfit < 0 ? "text-red-400" : ""}>
                  Net Profit: € {formatCurrency(netProfit)}
                </span>
              }
              subtitle={`Revenue: € ${formatCurrency(revenue)}`}
              subtitle2={`Expenses: € ${formatCurrency(expenses)}`}
              progress={profitMargin} // Ensures it's a valid number for the progress bar
              increase={
                <span className={profitMargin < 0 ? "text-red-400" : ""}>
                  {`${(profitMargin * 100).toFixed(2)} %`}
                </span>
              }
              sx={{
                gridColumn: "span 1",
              }}
            />
          </Box>
        </motion.div>
        <Box>
          <form onSubmit={(e) => e.preventDefault()}>
            <h3 className="text-base mb-2 text-LightGray">Expenses System</h3>
            <Box
              display="grid"
              gap="10px"
              gridTemplateColumns={
                isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)"
              }
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 2" },
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DesktopDatePicker
                  label="Date From"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="DD-MM-YYYY"
                  sx={{
                    gridColumn: isMobile ? "span 2" : "span 1",
                    "& .MuiInputBase-root": {
                      backgroundColor: "#333D49",
                      "&.Mui-focused": { backgroundColor: "#454B55" },
                      ":hover": {
                        backgroundColor: "#3C4553",
                      },
                    },
                  }}
                />
                <DesktopDatePicker
                  label="Date To"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="DD-MM-YYYY"
                  sx={{
                    gridColumn: isMobile ? "span 2" : "span 1",
                    "& .MuiInputBase-root": {
                      backgroundColor: "#333D49",
                      "&.Mui-focused": { backgroundColor: "#454B55" },
                      ":hover": {
                        backgroundColor: "#3C4553",
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              <TextField
                fullWidth
                label="Expenses from Invoices"
                variant="filled"
                value={`€ ${formatCurrency(expensesFromInvoices)}`}
                slotProps={{ readOnly: true }}
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 1",
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: colors.greenAccent[100],
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Other Expenses"
                variant="filled"
                value={otherExpenses}
                onChange={handleOtherExpenses}
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 1",
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: colors.greenAccent[100],
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Revenue from Sales"
                variant="filled"
                value={`€ ${formatCurrency(amountFromSales)}`}
                slotProps={{ readOnly: true }}
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 1",
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: colors.greenAccent[100],
                    },
                  },
                }}
              />
              <TextField
                fullWidth
                label="Other Revenue"
                variant="filled"
                value={otherRevenue}
                onChange={handleOtherRevenueChange}
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 1",
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: colors.greenAccent[100],
                    },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Comment"
                variant="filled"
                multiline
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                sx={{
                  gridColumn: isMobile ? "span 2" : "span 2",
                  "& .MuiInputLabel-root": {
                    "&.Mui-focused": {
                      color: colors.greenAccent[100],
                    },
                  },
                }}
              />
            </Box>

            {/* Buttons */}
            <Box
              display="grid"
              gap="10px"
              gridTemplateColumns={
                isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)"
              }
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 2" },
              }}
            >
              <Button
                variant="contained"
                type="submit"
                onClick={handleSave}
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
                Save
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
          </form>

          {/* Saved Stock Takes */}
          <Box>
            <div className="p-4 bg-[#333D49] text-white rounded-lg shadow mt-5">
              <h2 className="text-xl mb-4">Saved Financials</h2>

              <div className="overflow-x-auto max-h-[400px] overflow-y-auto hide-scrollbar">
                <table className="table-auto w-full text-sm">
                  <thead className="bg-[#2a303a] sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-center">From</th>
                      <th className="p-2 text-center">To</th>
                      <th className="p-2 text-right">Expenses (€)</th>
                      <th className="p-2 text-right">Revenue (€)</th>
                      <th className="p-2 text-right">Profit (€)</th>
                      <th className="p-2 text-left">Comment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialsData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-700 hover:bg-gray-800"
                        onClick={() => handleCostSelect(item.id)} // 👈 Add this line
                      >
                        <td className="p-2 text-center">
                          {dayjs(item.date_from).format("DD-MM-YYYY")}
                        </td>
                        <td className="p-2 text-center">
                          {dayjs(item.date_to).format("DD-MM-YYYY")}
                        </td>
                        <td className="p-2 text-right">
                          {item.total_expenses.toFixed(2)}€
                        </td>
                        <td className="p-2 text-right">
                          {item.total_revenue.toFixed(2)}€
                        </td>
                        <td className="p-2 text-right">
                          {(item.total_revenue - item.total_expenses).toFixed(
                            2
                          )}
                          €
                        </td>
                        <td className="p-2 text-left">
                          {item.comment || "No comment"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Box>
        </Box>
      </main>
    </div>
  );
};

export default CostForm;
