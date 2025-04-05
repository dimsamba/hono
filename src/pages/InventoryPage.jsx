import { motion } from "framer-motion";
import StatCard from "../components/common/StatCard";
import supabase from "../components/supabaseClient";
import { ShoppingBasket, UserSearch } from "lucide-react";
import React, { useState, useEffect } from "react";
import FullFeaturedCrudGrid from "../components/inventory/inventoryData";
// import InventoryForm from "../components/inventory/InventoryForm";

// ✅ Import Supabase
const InventoryPage = () => {
  const [inventoryData, setInventoryData] = useState([]); // ✅ Define state

  // Function to fetch inventory data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("inventory").select("*");
    if (error) {
      console.error("Error fetching inventory:", error);
    } else {
      setInventoryData(data); // ✅ Update state
    }
  };

  useEffect(() => {
    fetchData(); // ✅ Fetch inventory data when the page loads
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StatCard
            name="Total Items"
            icon={ShoppingBasket}
            value={inventoryData.length}
            color="#6366F1"
          />
          <StatCard
            name="Total Suppliers"
            icon={UserSearch}
            value={89}
            color="#10B981"
          />
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* Pass inventoryData to FullFeaturedCrudGrid */}
          <FullFeaturedCrudGrid inventoryData={inventoryData} />
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

export default InventoryPage;
