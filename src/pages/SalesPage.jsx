import { motion } from "framer-motion";
import StatCard from "../components/common/StatCard";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import SalesTable from "../components/sales/SalesTable";
import { useState, useEffect } from "react";
import supabase from "../components/supabaseClient";
import { tokens } from "../components/theme";
import { useTheme, useMediaQuery, Box } from "@mui/material";

const SalesPage = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [sales, setSales] = useState([]);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Filter sales from last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const salesLastMonth = sales.filter((sale) => {
    const saleDate = new Date(sale.sale_date);

    // Debug log to verify filtering
    const isInLast30Days = saleDate >= thirtyDaysAgo && saleDate <= now;
    console.log(`Sale on ${saleDate.toISOString()} included?`, isInLast30Days);

    return isInLast30Days;
  });

  const totalSalesValue = sales.reduce(
    (sum, sale) => sum + parseFloat(sale.total_value_item || 0),
    0
  );

  const totalSalesValue30Days = salesLastMonth.reduce(
    (sum, sale) => sum + parseFloat(sale.total_value_item || 0),
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
        sale_date: row.sale_date ? new Date(row.sale_date) : new Date(),
      }));

      setSales(formattedData); // Update rows state with the fetched data
    };

    fetchData(); // Call the fetch function when the component mounts
  }, []); // Empty dependency array to only run once when the component mounts

  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-primary-700">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8 scrollbar-hide">
        {/* STATS */}
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
            <StatCard
              icon={
                <PointOfSaleIcon
                  sx={{ color: colors.greenAccent[400], fontSize: "26px" }}
                />
              }
              title={`${sales.length} Sales`}
              value={`€ ${totalSalesValue.toFixed(2)}`}
              subtitle={`${
                salesLastMonth.filter((sale) => {
                  const today = new Date();
                  const thirtyDaysAgo = new Date();
                  thirtyDaysAgo.setDate(today.getDate() - 30);

                  const saleDate = new Date(sale.sale_date); // or sale.sale_date
                  return saleDate >= thirtyDaysAgo && saleDate <= today;
                }).length
              } Sales in last 30 Days`}
              subtitle2={`€ ${totalSalesValue30Days.toFixed(2)}`}
            />
          </Box>
        </motion.div>

        <motion.div
          className="grid max-w-[800px] grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        ></motion.div>

        <motion.div
          className="grid max-w-[1400px] grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* <SalesTable/> */}
          <SalesTable sales={sales} />
        </motion.div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"></div>
      </main>
    </div>
  );
};
export default SalesPage;
