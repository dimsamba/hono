import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import CostForm from "../components/costCalculator/CostForm";
import supabase from "../components/supabaseClient";

// ✅ Import Supabase
const CostCalculatorPage = () => {
  const [totalValue] = useState(0); // 🔄 comes from IngredientTable
  const [refreshTrigger, setRefreshTrigger] = useState(false); // optional
  const [, setItems] = useState([]); // Initialize ingredients state

  // Define state for the fetched cost data
  const [costData, setCost] = useState([]); // This will store your fetched data

  // Define state for the latest entry date
  const [latestEntryDate, setLatestEntryDate] = useState(null); // Initialize state for latest entry date

  // Function to handle total cost changes
  const handleTotalValueChange = (total) => {
    console.log("Total Value: €" + total.toFixed(2));
  };
  const handleRefresh = () => {
    // optional: can be used to trigger reloading the ingredient table or recipe list
    setRefreshTrigger(!refreshTrigger);
  };

  // Function to fetch Cost data from Supabase
  const fetchCost = async () => {
    const { data, error } = await supabase.from("cost").select("*");

    console.log("Cost raw fetch:", data);

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setCost(data); // Now `setCost` will correctly update the state with fetched data
      if (data.length > 0) {
        // fallback: get latest by checking max date manually
        const latest = data.reduce((a, b) =>
          new Date(a.created_at) > new Date(b.created_at) ? a : b
        );
        setLatestEntryDate(latest.created_at); // Now this will work since we defined the `setLatestEntryDate` state
      }
    }
  };

  useEffect(() => {
    fetchCost();
  }, []);

  return (
    <div className="flex-1 overflow-hidden relative z-10 bg-primary-700">
      <main className="max-w-9xl mx-auto py-6 px-4 lg:px-8 scrollbar-hide">
        <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8">
          {/* Pass CostData to FullFeaturedCrudGrid */}
          <CostForm
            onRecipeSaved={handleRefresh}
            totalValueFromIngredients={totalValue}
            setItems={setItems}
            onTotalValueChange={handleTotalValueChange}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default CostCalculatorPage;
