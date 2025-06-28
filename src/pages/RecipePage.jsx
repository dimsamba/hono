import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import RecipeForm from "../components/recipe/RecipeForm";
import supabase from "../components/supabaseClient";

const RecipePage = () => {
  const [, setRecipes] = useState([]);
  const [, setLatestEntryDate] = useState(null);
  const [totalCost] = useState(0); // 🔄 comes from IngredientTable
  const [refreshTrigger, setRefreshTrigger] = useState(false); // optional
  const [ingredients, setIngredients] = useState([]); // Initialize ingredients state

  // Function to handle total cost changes
  const handleTotalCostChange = (total) => {
    console.log("Total Cost: €" + total.toFixed(2));
  };
  const handleRefresh = () => {
    // optional: can be used to trigger reloading the ingredient table or recipe list
    setRefreshTrigger(!refreshTrigger);
  };

  // Function to fetch Recipes data from Supabase
  const fetchRecipes = async () => {
    const { data, error } = await supabase.from("recipes").select("*");

    console.log("Recipes raw fetch:", data);

    if (error) {
      console.error("Fetch error:", error);
    } else {
      setRecipes(data);
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
    <div className="flex-1 overflow-hidden relative z-10 bg-primary-700">
      <main className="max-w-5xl mx-auto py-6 px-4 lg:px-8 scrollbar-hide">
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-8"
          // initial={{ opacity: 0, y: 20 }}
          // animate={{ opacity: 1, y: 0 }}
          // transition={{ duration: 1 }}
        >
          <RecipeForm
            onRecipeSaved={handleRefresh}
            totalCostFromIngredients={totalCost}
            ingredients={ingredients}
            setIngredients={setIngredients}
            onTotalCostChange={handleTotalCostChange}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default RecipePage;
