import { motion } from "framer-motion";
import StatCard from "../components/common/StatCard";
import supabase from "../components/supabaseClient";
import { ShoppingBasket } from "lucide-react";
import { useState, useEffect } from "react";
import InventoryData from "../components/inventory/InventoryData"; // Note the capital "I"
import { tokens } from "../components/theme";
import { useTheme } from "@mui/material";
import { format } from "date-fns";

// ✅ Import Supabase
const InventoryPage = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [inventory, setInventory] = useState([]);
  const [latestEntryDate, setLatestEntryDate] = useState(null);

  // Function to fetch inventory data from Supabase
  const fetchRecipes = async () => {
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
    fetchRecipes();
  }, []);

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
              <ShoppingBasket
              sx={{ color: "#38a3a5", fontSize: "26px" }}
              />
            }
            title={"Inventory in Database"}
            value={`${inventory.length} Items`}
            subtitle={
              latestEntryDate
                ? `Last Entry: ${format(
                    new Date(latestEntryDate),
                    "dd-MM-yyyy"
                  )}`
                : "No data available"
            }
            progress={"none"}
            sx={{
              gridColumn: "span 1",
            }}
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
          <InventoryData />
        </motion.div>
      </main>
    </div>
  );
};

export default InventoryPage;
