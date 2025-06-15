import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import StockTakeForm from "../components/stocktake/StockTakeForm";
import supabase from "../components/supabaseClient";

const StockTakePage = () => {
  const [, setStockTake] = useState([]);
  const [, setLatestEntryDate] = useState(null);
  const [totalValue] = useState(0); // 🔄 comes from IngredientTable
  const [refreshTrigger, setRefreshTrigger] = useState(false); // optional
  const [invItems, setInvItems] = useState([]);

  // Function to handle total cost changes
  const handleTotalValueChange = (total) => {
    console.log("Total Value: €" + total.toFixed(2));
  };
  const handleRefresh = () => {
    // optional: can be used to trigger reloading the ingredient table or recipe list
    setRefreshTrigger(!refreshTrigger);
  };

  // Function to fetch stockTake data from Supabase
  const fetchStockTake = async () => {
    const { data, error } = await supabase.from("stockTake").select("*");

    console.log("stockTake raw fetch:", data);

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setStockTake(data);
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
    fetchStockTake();
  }, []);

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-5xl mx-auto py-6 px-4 lg:px-8">
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <StockTakeForm
            onRecipeSaved={handleRefresh}
            totalValueFromIngredients={totalValue}
            invItems={invItems}
            setInvItems={setInvItems}
            onTotalValueChange={handleTotalValueChange}
          />
        </motion.div>

        {/* ✅ Pass fetchData to the form so it refreshes after insert */}
        <motion.div
          className="grid grid-cols-1 gap-0 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        ></motion.div>
      </main>
    </div>
  );
};

export default StockTakePage;
