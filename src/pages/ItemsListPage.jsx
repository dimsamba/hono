import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import { Box, useMediaQuery } from "@mui/material";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import StatCard from "../components/common/StatCard";
import FullFeaturedCrudGrid from "../components/sales/ItemsData"; // ✅ Import SupplierData component
import supabase from "../components/supabaseClient";

// ✅ Import Supabase
const ItemsListPage = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [itemsListData, setItemsListDataData] = useState([]); // ✅ Define state
  const [itemslatestEntryDate, setLatestEntryDateItems] = useState(null); // Declare the state
  const [refreshKey, setRefreshKey] = useState(); // used to force re-render

  // Function to fetch suppliers data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("itemsList").select("*");
    if (error) {
      console.error("Error fetching Items List:", error);
    } else {
      setItemsListDataData(data); // ✅ Update state
    }
  };

  useEffect(() => {
    fetchData(); // ✅ Fetch suppliers data when the page loads
  }, []);

  const handleitemsChange = () => {
    fetchData();
    setRefreshKey(Date.now()); // update with new timestamp to force StatCard re-render
  };

  // Fetch data from supplier table
  const fetchDataItemsLE = async () => {
    const { data, error } = await supabase
      .from("itemsList")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching items List data:", error);
    } else {
      const date = data[0] ? data[0].created_at : null;
      setLatestEntryDateItems(date); // Set the latest entry date in state
    }
  };

  useEffect(() => {
    fetchDataItemsLE(); // Fetch latest inventory entry date on page load
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3"
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
                <FactCheckOutlinedIcon
                  sx={{ color: "#38a3a5", fontSize: "26px" }}
                />
              }
              key={refreshKey} // 👈 triggers re-render when key changes
              title={"Items Summary"}
              value={`${itemsListData.length} Items in database`}
              subtitle={
                itemslatestEntryDate
                  ? `Last Entry: ${format(
                      new Date(itemslatestEntryDate),
                      "dd-MM-yyyy"
                    )}`
                  : "No data available"
              }
            />
          </Box>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0"
        >
          {/* ✅ Pass inventory data to the table */}
          <FullFeaturedCrudGrid
            ItemsData={itemsListData}
            onItemsChange={handleitemsChange}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default ItemsListPage;
