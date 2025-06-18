import HailOutlinedIcon from '@mui/icons-material/HailOutlined';
import { Box, useMediaQuery } from "@mui/material";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import StatCard from "../components/common/StatCard";
import supabase from "../components/supabaseClient";
import FullFeaturedCrudGrid from "../components/supplier/SupplierData"; // ✅ Import SupplierData component

// ✅ Import Supabase
const SupplierPage = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [supplierData, setSupplierData] = useState([]); // ✅ Define state
  const [supplierlatestEntryDate, setLatestEntryDateSupplier] = useState(null); // Declare the state
  const [refreshKey, setRefreshKey] = useState(); // used to force re-render

  // Function to fetch suppliers data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("suppliers").select("*");
    if (error) {
      console.error("Error fetching suppliers:", error);
    } else {
      setSupplierData(data); // ✅ Update state
    }
  };

  useEffect(() => {
    fetchData(); // ✅ Fetch suppliers data when the page loads
  }, []);

  const handSupplierChange = () => {
    fetchData(); // ✅ Correct function name
    setRefreshKey(Date.now()); // update with new timestamp to force StatCard re-render
  };

  // Fetch data from supplier table
  const fetchDataSupplierLE = async () => {
    const { data, error } = await supabase
      .from("suppliers")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching suppliers data:", error);
    } else {
      const date = data[0] ? data[0].created_at : null;
      setLatestEntryDateSupplier(date); // Set the latest entry date in state
    }
  };

  useEffect(() => {
    fetchDataSupplierLE(); // Fetch latest inventory entry date on page load
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Box
            display="grid"
            gap="15px"
            gridTemplateColumns="repeat(1, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            }}
          >
            <StatCard
              icon={
                <HailOutlinedIcon
                  sx={{ color: "#38a3a5", fontSize: "26px" }}
                />
              }
              key={refreshKey} // 👈 triggers re-render when key changes
              title={"Suppliers Summary"}
              value={`${supplierData.length} Entries`}
              subtitle={
                supplierlatestEntryDate
                  ? `Last Entry: ${format(
                      new Date(supplierlatestEntryDate),
                      "dd-MM-yyyy"
                    )}`
                  : "No data available"
              }
            />
          </Box>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* ✅ Pass inventory data to the table */}
          <FullFeaturedCrudGrid
            SupplierData={supplierData}
            onSupplierChange={handSupplierChange}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default SupplierPage;
