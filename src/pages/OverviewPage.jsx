import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import PriceCheckOutlinedIcon from "@mui/icons-material/PriceCheckOutlined";
import { useTheme } from "@mui/material";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import StatCard from "../components/common/StatCard";
import RevenueSumary from "../components/overview/RevenueSumary";
import SalesCategory from "../components/overview/SalesCategory";
import SalesOverviewChart from "../components/sales/SalesOverviewChart";
import supabase from "../components/supabaseClient";
import { tokens } from "../components/theme";

const OverviewPage = () => {
  const [inventoryData, setInventoryData] = useState([]);
  const [, setInvoiceData] = useState([]);
  const [financialsData, setFinancialsData] = useState([]);
  const [sales, setSales] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [latestEntryDate, setLatestEntryDate] = useState(null);
  const [latestRecipeDate, setLatestRecipeDate] = useState(null);

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const expensesFromInvoices = ""; // Placeholder
  const otherExpenses = "";
  const [, setTotalExpenses] = useState("");

  const netProfit =
    financialsData.length > 0 ? financialsData[0].net_profit : 0;
  const revenue =
    financialsData.length > 0 ? financialsData[0].total_revenue : 0;
  const expenses =
    financialsData.length > 0 ? financialsData[0].total_expenses : 0;

  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  useEffect(() => {
    const invoiceVal = parseFloat(expensesFromInvoices) || 0;
    const otherVal = parseFloat(otherExpenses) || 0;
    setTotalExpenses(invoiceVal + otherVal);
  }, [expensesFromInvoices, otherExpenses]);

  // Filter sales from last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const salesLastMonth = sales.filter((sale) => {
    const saleDate = new Date(sale.date);

    // Debug log to verify filtering
    const isInLast30Days = saleDate >= thirtyDaysAgo && saleDate <= now;
    console.log(`Sale on ${saleDate.toISOString()} included?`, isInLast30Days);

    return isInLast30Days;
  });

  const totalSalesValue = sales.reduce(
    (sum, sale) => sum + parseFloat(sale.sale_total_disc || 0),
    0
  );

  const totalSalesValue30Days = salesLastMonth.reduce(
    (sum, sale) => sum + parseFloat(sale.sale_total_disc || 0),
    0
  );

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("sales").select("*");

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

  // Fetch Financials
  const fetchFinancials = async () => {
    const { data, error } = await supabase.from("financials").select("*");
    if (error) {
      console.error("Fetch error:", error);
    } else {
      setFinancialsData(data);
    }
  };

  useEffect(() => {
    fetchFinancials();
  }, []);

  // Fetch Recipes
  const fetchRecipes = async () => {
    const { data, error } = await supabase.from("recipes").select("*");
    if (error) {
      console.error("Fetch error:", error);
    } else {
      setRecipes(data);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  // Fetch Inventory
  const fetchDataInventory = async () => {
    const { data, error } = await supabase.from("inventory").select("*");
    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setInventoryData(data);
    }
  };

  useEffect(() => {
    fetchDataInventory();
  }, []);

  // Fetch Invoices
  const fetchDatainvoice = async () => {
    const { data, error } = await supabase.from("invoices").select("*");
    if (error) {
      console.error("Error fetching invoices:", error);
    } else {
      setInvoiceData(data);
    }
  };

  useEffect(() => {
    fetchDatainvoice();
  }, []);

  // Get latest entry date among sales, recipes, financials, inventory
  useEffect(() => {
    const allDates = [
      ...sales.map((s) => new Date(s.created_at)),
      ...recipes.map((r) => new Date(r.created_at)),
      ...inventoryData.map((i) => new Date(i.created_at || i.date_added)),
      ...financialsData.map((f) => new Date(f.created_at || f.date_to)),
    ];
    if (allDates.length > 0) {
      const latest = allDates.reduce((a, b) => (a > b ? a : b));
      setLatestEntryDate(latest.toISOString());
    }
  }, [sales, recipes, inventoryData, financialsData]);

  useEffect(() => {
    if (recipes.length > 0) {
      const latest = recipes
        .map((r) => new Date(r.created_at))
        .reduce((a, b) => (a > b ? a : b));
      setLatestRecipeDate(latest.toISOString());
    }
  }, [recipes]);

  return (
    <div
      className="flex-1 overflow-auto relative z-10"
      style={{ backgroundColor: colors.background }}
    >
      <main className="max-w-9xl mx-auto py-6 px-1 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 mb-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Financials */}
          <StatCard
            icon={
              <PriceCheckOutlinedIcon
                sx={{ color: "#38a3a5", fontSize: "26px" }}
              />
            }
            title={`30 days Financial Summary`}
            value={
              <>
                <span className={netProfit < 0 ? "text-red-400" : ""}>
                  Net profit: € {formatCurrency(netProfit)}
                </span>
              </>
            }
            subtitle={`Revenue € ${formatCurrency(revenue)}`}
            subtitleRed2={`Expenses € ${formatCurrency(expenses)}`}
          />

          {/* Sales */}
          <StatCard
            icon={
              <PointOfSaleIcon sx={{ color: "#38a3a5", fontSize: "26px" }} />
            }
            title={`Sales Summary`}
            value={`Total: € ${formatCurrency(totalSalesValue)}`}
            subtitle={`Last 30 Days: € ${formatCurrency(
              totalSalesValue30Days
            )}`}
            subtitle2={`N. Sales: ${sales.length} / ${
              salesLastMonth.filter((sale) => {
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);

                const saleDate = new Date(sale.date); // or sale.date
                return saleDate >= thirtyDaysAgo && saleDate <= today;
              }).length
            } in 30 Days`}
          />
          {/* Inventory */}
          <StatCard
            icon={
              <InventoryOutlinedIcon
                sx={{ color: "#38a3a5", fontSize: "26px" }}
              />
            }
            title={"Inventory Summary"}
            value={`${inventoryData.length} Items in Database`}
            subtitle={
              latestEntryDate
                ? `Last Entry:  ${format(
                    new Date(latestEntryDate),
                    "dd-MM-yyyy"
                  )}`
                : "No data available"
            }
          />
          <StatCard
            icon={
              <InventoryOutlinedIcon
                sx={{ color: "#38a3a5", fontSize: "26px" }}
              />
            }
            title={"Recipes Sumary"}
            value={`${recipes.length} Saved Recipes`}
            subtitle={
              latestRecipeDate
                ? `Last Recipe: ${format(
                    new Date(latestRecipeDate),
                    "dd-MM-yyyy"
                  )}`
                : "No recipes available"
            }
          />
        </motion.div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <motion.div
            className="bg-gray-100 border-2 p-1 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-lg border-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <SalesOverviewChart />
          </motion.div>
          <motion.div
            className="bg-gray-100 border-2 p-6 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-lg border-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <RevenueSumary />
          </motion.div>
          <motion.div
            className="col-span-1 lg:col-span-2 bg-gray-100 border-2 p-1 bg-opacity-80 backdrop-blur-md overflow-hidden rounded-lg border-gray-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <SalesCategory />
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default OverviewPage;
