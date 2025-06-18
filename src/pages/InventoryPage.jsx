import { format } from "date-fns";
import { motion } from "framer-motion";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import { useEffect, useState } from "react";
import StatCard from "../components/common/StatCard";
import FullFeaturedCrudGrid from "../components/inventory/InventoryData"; // Note the capital "I"
import supabase from "../components/supabaseClient";

// ✅ Import Supabase
const InventoryPage = () => {
  const [inventory, setInventory] = useState([]);
  const [latestEntryDate, setLatestEntryDate] = useState(null);
  const [refreshKey, setRefreshKey] = useState(); // used to force re-render

  // Function to fetch inventory data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("inventory").select("*");

    console.log("Inventory raw fetch:", data);

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setInventory(data);
      if (data.length > 0) {
        // fallback: get latest by checking max date manually
        const latest = data.reduce((a, b) =>
          new Date(a.created_at) > new Date(b.created_at) ? a : b
        );
        setLatestEntryDate(latest.created_at);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleinventoryChanges = () => {
    fetchData();
    setRefreshKey(Date.now()); // update with new timestamp to force StatCard re-render
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-10xl py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            icon={
              <InventoryOutlinedIcon
                sx={{ color: "#38a3a5", fontSize: "26px" }}
              />
            }
            key={refreshKey} // 👈 triggers re-render when key changes
            title={"Inventory Sumary"}
            value={`${inventory.length} Items`}
            subtitle={
              latestEntryDate
                ? `Last Entry: ${format(
                    new Date(latestEntryDate),
                    "dd-MM-yyyy"
                  )}`
                : "No data available"
            }
          />
        </motion.div>

        {/* Inventory Data grid */}
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Pass InventoryData to FullFeaturedCrudGrid */}
          <FullFeaturedCrudGrid
            inventory={inventory}
            onInventoryChanges={handleinventoryChanges}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default InventoryPage;
