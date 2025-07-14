import { motion } from "framer-motion";
import StatCard from "../components/common/StatCard";
import StatCardBg from "../components/common/StatCardBg";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import EventRepeatOutlinedIcon from "@mui/icons-material/EventRepeatOutlined";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import FullFeaturedCrudGrid from "../components/sales/SalesTable";
import { useState, useEffect } from "react";
import supabase from "../components/supabaseClient";
import { Box, useMediaQuery } from "@mui/material";

const SalesPage = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [sales, setSales] = useState([]);
  const [refreshKey, setRefreshKey] = useState(); // used to force re-render
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [selectedItem, setSelectedItem] = useState("");

  const [metrics, setMetrics] = useState({
    totalSalesAmount: 0,
    totalEntries: 0,
    totalItems: 0,
    filteredItemCount: 0,
    filteredRows: [],
  });
  const [itemCounts, setItemCounts] = useState([]);

  // Fetch sales data from Supabase (Sales table)
  useEffect(() => {
    const fetchSalesData = async () => {
      const { data, error } = await supabase.from("sales").select("*");

      if (error) {
        console.error("Error fetching sales data:", error.message);
        return;
      }

      setSales(data);
    };

    fetchSalesData();
  }, []);

  // Handle item counts updates from SalesTable
  const handleItemCountChange = (counts) => {
    setItemCounts(counts);
  };

  const filteredItemCount = itemCounts.reduce((sum, item) => {
    // Apply filter for selectedItem here (if applicable)
    if (selectedItem && item.name === selectedItem) {
      return sum + item.value;
    }
    return sum;
  }, 0);

  // Filter sales from the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const salesLastMonth = sales.filter((sale) => {
    const saleDate = new Date(sale.date);
    return saleDate >= thirtyDaysAgo && saleDate <= now;
  });

  const totalSalesValue = sales.reduce(
    (sum, sale) => sum + parseFloat(sale.sale_total_disc || 0),
    0
  );

  const totalSalesValue30Days = salesLastMonth.reduce(
    (sum, sale) => sum + parseFloat(sale.sale_total_disc || 0),
    0
  );

  // Customization for decimals and thousands separators
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  useEffect(() => {
    console.log("Metrics (from SalesTable):", metrics);
  }, [metrics]);

  console.log("Selected Item:", selectedItem);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-9xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3">
          <Box
            display="grid"
            gap="15px"
            gridTemplateColumns="repeat(3, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 3" },
            }}
          >
            <StatCard
              icon={
                <PointOfSaleIcon sx={{ color: "#38a3a5", fontSize: "26px" }} />
              }
              key={refreshKey} // 👈 triggers re-render when key changes
              title={`Sales Summary`}
              value={`€ ${formatCurrency(totalSalesValue)}`}
              subtitle={`${sales.length} Sales`}
            />
            <StatCard
              icon={
                <EventRepeatOutlinedIcon
                  sx={{ color: "#38a3a5", fontSize: "26px" }}
                />
              }
              key={refreshKey} // 👈 triggers re-render when key changes
              title={`Last 30 Days`}
              value={`€ ${formatCurrency(totalSalesValue30Days)}`}
              subtitle={`${salesLastMonth.length} Sales`} // Simplified filter logic here
            />
            <StatCardBg
              icon={
                <CalendarMonthOutlinedIcon
                  sx={{ color: "#38a3a5", fontSize: "26px" }}
                />
              }
              title={`Filtered`}
              value={`€ ${formatCurrency(metrics.totalSalesAmount)}`}
              subtitle={`${metrics.totalEntries} Sales / ${metrics.totalItems} Items`}
              subtitle2={`${metrics.filteredItemCount} Selected item`}
            />
          </Box>
        </motion.div>
        <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0">
          {/* Sales Table */}
          <FullFeaturedCrudGrid
            sales={sales}
            onSalesChange={() => fetchSalesData()} // Re-fetch sales data on change
            fromDate={fromDate}
            toDate={toDate}
            setFromDate={setFromDate}
            setToDate={setToDate}
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            onMetricsChange={setMetrics}
            onItemCountChange={handleItemCountChange}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default SalesPage;
