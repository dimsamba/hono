import EuroSymbolOutlinedIcon from "@mui/icons-material/EuroSymbolOutlined";
import { Box, Button, FormControl, GlobalStyles, TextField, useMediaQuery, useTheme } from "@mui/material";
import { DesktopDatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs"; // if not already imported
import { useEffect, useState } from "react";
import StatCard from "../common/StatCard";
import supabase from "../supabaseClient"; // update the path as needed

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
  const [otherRevenue, setOtherRevenue] = useState("");
  const [totalRevenue, setTotalRevenue] = useState("");
  const [reportId, setReportId] = useState(null); // Used to track update/delete target
  const [comment, setComment] = useState("");
  const [userId, setUserId] = useState(null); // Should be set from Supabase auth
  const [financialsData, setFinancialsData] = useState([]);
  const [netProfitFromDates, setNetProfit] = useState(0);
  const [, setCostSelected] = useState(false);

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
    const fetchData = async () => {
      // Log fromDate and toDate before processing
      console.log("From Date:", fromDate);
      console.log("To Date:", toDate);

      // Ensure fromDate and toDate are not null and fallback to defaults
      const validFromDate = fromDate
        ? dayjs(fromDate)
        : dayjs().startOf("month"); // Default to current month's start
      const validToDate = toDate ? dayjs(toDate) : dayjs().endOf("month"); // Default to current month's end

      // Log whether the dates are valid
      console.log("Is 'fromDate' valid:", validFromDate.isValid());
      console.log("Is 'toDate' valid:", validToDate.isValid());

      // If either date is invalid, log an error
      if (!validFromDate.isValid() || !validToDate.isValid()) {
        console.error("Invalid date value detected:", fromDate, toDate);
        return; // Exit if the dates are invalid
      }

      const start = validFromDate.startOf("day").toISOString();
      const end = validToDate.endOf("day").toISOString();

      const { data, error } = await supabase
        .from("invoices")
        .select("amount_ttc")
        .gte("invoice_date", start)
        .lte("invoice_date", end)
        .eq("paid", true);

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
      if (!fromDate || !toDate) return;

      const start = dayjs(fromDate).format("YYYY-MM-DD");
      const end = dayjs(toDate).format("YYYY-MM-DD");

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

  // TextField and InputLabel customizations
  const sharedStyles = {
    backgroundColor: "#ebf1fa",
    "& .MuiInputLabel-root": {
      color: "#007f5f",
      fontSize: 14,
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
    <div className="flex-1 overflow-hidden relative z-10 bg-primary-700">
      <main className="max-w-5xl mx-auto py-6 px-4 lg:px-8 scrollbar-hide">
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
                sx={{ color: "#38a3a5", fontSize: "26px" }}
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
              <span
                className={profitMarginBetwnDates < 0 ? "text-red-400" : ""}
              >
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
                sx={{ color: "#38a3a5", fontSize: "26px" }}
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
        <Box
          sx={{
            height: 1200,
            width: "100%",
            border: "2px solid lightGray",
            borderRadius: 2,
            padding: 1,
            mt: 2,
          }}
        >
          <form onSubmit={(e) => e.preventDefault()}>
            <h3 className="text-base mb-2 ml-1 mt-1 text-[#3FA89B] font-bold">
              COST CALCULATOR
            </h3>
            <Box
              display="grid"
              gap="15px"
              gridTemplateColumns={
                isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)"
              }
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 2" },
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
              <LocalizationProvider dateAdapter={AdapterDayjs}>
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
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      variant: "outlined",

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
                <DesktopDatePicker
                  label="Date To"
                  value={toDate}
                  onChange={(newValue) => setToDate(dayjs(newValue))}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                  format="DD-MM-YYYY"
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      // size: "small",
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
              </LocalizationProvider>

              <FormControl
                fullWidth
                variant="outlined"
                sx={{ gridColumn: "span 2" }}
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
                sx={{ gridColumn: "span 2" }}
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
                sx={{ gridColumn: "span 2" }}
              >
                <TextField
                  fullWidth
                  label="Revenue from Sales"
                  variant="outlined"
                  value={`€ ${formatCurrency(amountFromSales)}`}
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
                sx={{ gridColumn: "span 2" }}
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
                sx={{ gridColumn: "span 2" }}
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
            <div className="p-4 bg-gray-100 text-[#444] my-2 ">
              <h2 className="text-xl mb-4">Saved Financials</h2>

              <div className="overflow-x-auto max-h-[500px] overflow-y-auto hide-scrollbar">
                <table className="table-auto w-full text-sm">
                  <thead className="bg-[#2a303a] sticky top-0 z-10">
                    <tr>
                      <th className="p-2 text-center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        From
                      </th>
                      <th className="p-2 text-center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        To
                      </th>
                      <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Expenses (€)
                      </th>
                      <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Revenue (€)
                      </th>
                      <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Profit (€)
                      </th>
                      <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                        Comment
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {financialsData.map((item, index) => (
                      <tr
                        key={index}
                        className="border-b border-gray-700 hover:bg-gray-200"
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
