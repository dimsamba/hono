import { motion } from "framer-motion";
import { useTheme, useMediaQuery, Box } from "@mui/material";
import { format } from "date-fns";
import ContactPhoneOutlinedIcon from "@mui/icons-material/ContactPhoneOutlined";
import { tokens } from "../components/theme";
import StatCard from "../components/common/StatCard";
import supabase from "../components/supabaseClient";
import React, { useState, useEffect } from "react";
import SupplierData from "../components/supplier/SupplierData"; // ✅ Import SupplierData component


// ✅ Import Supabase
const SupplierPage = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [supplierData, setSupplierData] = useState([]); // ✅ Define state
  const [supplierlatestEntryDate, setLatestEntryDateSupplier] = useState(null); // Declare the state
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

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
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8"
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
                <ContactPhoneOutlinedIcon
                  sx={{ color: colors.greenAccent[400], fontSize: "26px" }}
                />
              }
              title={"N. of Suppliers"}
              value={supplierData.length}
              subtitle={
                supplierlatestEntryDate
                  ? `Last Entry: ${format(
                      new Date(supplierlatestEntryDate),
                      "dd-MM-yyyy"
                    )}`
                  : "No data available"
              }
              progress={"none"}
              sx={{
                gridColumn: "span 1",
              }}
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
          <SupplierData />
        </motion.div>

        {/* ✅ Pass fetchData to the form so it refreshes after insert */}
        <motion.div
          className="grid grid-cols-1 gap-0 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* <InventoryForm fetchData={fetchData} /> */}
        </motion.div>
      </main>
    </div>
  );
};

export default SupplierPage;
