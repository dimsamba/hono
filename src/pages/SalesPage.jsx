import { motion } from "framer-motion";
import StatCard from "../components/common/StatCard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import FullFeaturedCrudGrid from "../components/sales/SalesTable";
import { useState, useEffect } from "react";
import supabase from "../components/supabaseClient";

const SalesPage = () => {
  const [sales, setSales] = useState([]);
  const [refreshKey, setRefreshKey] = useState(); // used to force re-render

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
  // Place this function **outside** of useEffect
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

    setSales(formattedData);
  };

  // Inside the component
  useEffect(() => {
    fetchData(); // ✅ call it here
  }, []);

  const handleSalesChange = () => {
    fetchData();
    setRefreshKey(Date.now()); // update with new timestamp to force StatCard re-render
  };

  // Customization for decimals and thousands separators
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-10xl py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            icon={
              <PointOfSaleIcon sx={{ color: "#38a3a5", fontSize: "26px" }} />
            }
            key={refreshKey} // 👈 triggers re-render when key changes
            title={`${sales.length} Sales`}
            value={`€ ${formatCurrency(totalSalesValue)}`}
            subtitle={`${
              salesLastMonth.filter((sale) => {
                const today = new Date();
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(today.getDate() - 30);

                const saleDate = new Date(sale.date); // or sale.date
                return saleDate >= thirtyDaysAgo && saleDate <= today;
              }).length
            } Sales in last 30 Days`}
            subtitle2={`€ ${formatCurrency(totalSalesValue30Days)}`}
          />
          {/* </Box> */}
        </motion.div>
        <motion.div
          className="grid grid-cols-1 h-[1200px] gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* <SalesTable/> */}
          <FullFeaturedCrudGrid
            sales={sales}
            onSalesChange={handleSalesChange}
          />
        </motion.div>
      </main>
    </div>
  );
};
export default SalesPage;
