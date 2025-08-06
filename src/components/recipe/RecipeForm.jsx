import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import supabase from "../supabaseClient"; // Import Supabase client
import StatCardRecipe from "../common/StatCardRecipe";
import RamenDiningOutlinedIcon from "@mui/icons-material/RamenDiningOutlined";
import LoyaltyOutlinedIcon from "@mui/icons-material/LoyaltyOutlined";
import PriceChangeOutlinedIcon from "@mui/icons-material/PriceChangeOutlined";
import { format } from "date-fns";

const RecipeForm = ({
  onRecipeSaved,
  ingredients,
  setIngredients,
  onTotalCostChange = 0,
}) => {
  // Accept fetchData as a prop
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage] = useState("");
  const [snackbarSeverity] = useState("success"); // success, error, warning
  const [recipeName, setRecipeName] = useState("");
  const [recipeNote, setRecipeNote] = useState("");
  const [recipeType, setRecipeType] = useState("");
  const [numberOfPortions, setNumberOfPortions] = useState("");
  const [actualSalePrice, setActualSalePrice] = useState("");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState(""); // Initialize as an empty string
  const [numItems, setNumItems] = useState();
  const [latestEntryDate, setLatestEntryDate] = useState(null);
  const [recipeSelected, setRecipeSelected] = useState(false);

  // Automatically set recipeId when recipe prop is available
  useEffect(() => {
    if (!recipeId) {
      // Only warn in dev, or just return silently
      console.log("RecipeForm mounted without a recipeId. Waiting for one...");
      return;
    }

    // Fetch the recipe data from Supabase here...
  }, [recipeId]);

  useEffect(() => {
    setNumItems(ingredients.length) - 1;
  }, [ingredients]);

  const fetchRecipes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recipes:", error.message);
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
    setLoading(false);
  }; // Ensure this is part of a valid block or remove if unnecessary

  useEffect(() => {
    fetchRecipes();
  }, []);

  // ✅ Fetch inventory ONCE on mount
  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase.from("inventory").select("*");
      if (error) {
        console.error("Error fetching inventory:", error.message);
      } else {
        setInventoryItems(data || []);
      }
    };
    fetchInventory();
  }, []);

  // Calculatios
  useEffect(() => {
    const total = ingredients.reduce((sum, i) => sum + (i.cost || 0), 0);
    setTotalCost(total);

    const cpp = numberOfPortions > 0 ? total / numberOfPortions : 0;
    const minPrice = cpp * 4;
    const pct = actualSalePrice > 0 ? (cpp / actualSalePrice) * 100 : 0;

    setCostPerPortion(cpp);
    setMinSalePrice(minPrice);
    setActualFoodCostPct(pct);
    setActualRecipeCost(total);

    if (onTotalCostChange) onTotalCostChange(total);
  }, [ingredients, numberOfPortions, actualSalePrice]);

  // Handle item changes
  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];

    if (field === "item_id") {
      const item = inventoryItems.find((item) => item.item_name === value);
      if (item) {
        updated[index] = {
          ...updated[index],
          item_id: item.item_name,
          item_name: item.item_name, // Ensure item_name is updated
          price_per_unit: item.effective_price_per_unit,
          unit_type: item.unit_type,
          quantity_used: "",
          cost: item.price_per_unit,
        };
      }
    } else if (field === "quantity_used") {
      if (value === "") {
        updated[index].quantity_used = ""; // allow empty string for typing
        updated[index].cost = 0; // or leave unchanged if you prefer
      } else {
        const quantity = parseFloat(value);
        const price = updated[index].price_per_unit || 0;
        updated[index].quantity_used = quantity;
        updated[index].cost = quantity * price;
      }
    }

    setIngredients(updated);
  };

  const addIngredientRow = () => {
    setIngredients([
      ...ingredients,
      {
        item_id: "",
        item_name: "",
        quantity_used: "",
        unit_type: "",
        price_per_unit: 0,
        cost: 0,
      },
    ]);
  };

  const removeIngredientRow = (index) => {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
  };

  // 🧠 Calculated fields
  const [costPerPortion, setCostPerPortion] = useState(0);
  const [minSalePrice, setMinSalePrice] = useState(0);
  const [actualFoodCostPct, setActualFoodCostPct] = useState(0);
  const [, setActualRecipeCost] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const cost = numberOfPortions > 0 ? totalCost / numberOfPortions : 0;
    const minPrice = cost * 4;
    const foodPct = actualSalePrice > 0 ? (cost / actualSalePrice) * 100 : 0;
    const total = ingredients.reduce((sum, i) => sum + (i.cost || 0), 0);

    setCostPerPortion(cost);
    setMinSalePrice(minPrice);
    setActualFoodCostPct(foodPct);
    setTotalCost(total);
  }, [numberOfPortions, totalCost, actualSalePrice]); // 👈 make sure dependencies are correct

  // Save recipe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (totalCost <= 0 || numberOfPortions <= 0) {
      alert(
        "Please ensure total cost and number of portions are greater than 0."
      );
      setLoading(false);
      return;
    }

    const cpp = parseFloat(totalCost) / parseFloat(numberOfPortions);
    const salePrice = parseFloat(actualSalePrice);

    // Insert recipe
    const { data, error } = await supabase
      .from("recipes")
      .insert([
        {
          recipe_name: recipeName,
          recipe_type: recipeType,
          total_cost: totalCost,
          cost_per_portion: cpp,
          num_items: numItems,
          number_of_portions: numberOfPortions,
          min_sale_price: minSalePrice,
          actual_sale_price: salePrice,
          actual_food_cost_pct: actualFoodCostPct,
          note: recipeNote,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error saving recipe:", error.message);
      alert("Error saving recipe");
      setLoading(false);
      return;
    }

    const recipeId = data.id;

    // 🔐 Get the logged-in user's ID (must come before inventory insert)
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("User not authenticated:", userError?.message);
      alert("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    // ✅ Save to inventory if category is "ingrédients"
    if (recipeType.toLowerCase() === "ingrédients") {
      const inventoryItem = {
        user_id: userId,
        item_name: recipeName,
        category: "Ingrédients",
        pack_type: "n/a",
        qnty_item_pack: 1,
        unit_type: "unit",
        unit_per_itm: 1,
        total_units_per_pack: numberOfPortions,
        price_per_pack: cpp,
        price_per_item: cpp,
        price_per_unit: cpp,
        yield_pct: 100,
        effective_price_per_unit: cpp,
        supplier: "Kitchen",
        note: null,
      };

      const { error: inventoryError } = await supabase
        .from("inventory")
        .insert([inventoryItem]);

      if (inventoryError) {
        console.error("Error saving to inventory:", inventoryError.message);
        alert("Error saving to inventory.");
      } else {
        console.log("Recipe also saved to inventory.");
      }
    }

    // ✅ Insert ingredients
    const ingredientsToInsert = ingredients.map((item) => ({
      user_id: userId,
      recipe_id: parseInt(recipeId),
      ingredient_id: item.id,
      item_name: item.item_name,
      quantity_used: item.quantity_used,
      unit_type: item.unit_type,
      price_per_unit: item.price_per_unit,
      ingredient_cost: item.cost,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert);

    if (insertError) {
      console.error("Error saving ingredients:", insertError.message);
    } else {
      console.log("Ingredients saved successfully.");
    }

    // ✅ Reset state
    setRecipeName("");
    setRecipeType("");
    setNumberOfPortions("");
    setActualSalePrice("");
    setRecipeNote("");
    setIngredients([]);
    setRecipeSelected(false);

    fetchRecipes();
    onRecipeSaved && onRecipeSaved();
    setLoading(false);
  };

  // Update recipe
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (totalCost <= 0 || numberOfPortions <= 0) {
      alert(
        "Please ensure total cost and number of portions are greater than 0."
      );
      setLoading(false);
      return;
    }

    const parsedRecipeId = parseInt(recipeId);
    if (!Number.isInteger(parsedRecipeId)) {
      console.warn("Invalid recipeId during update:", recipeId);
      alert("Invalid recipe ID. Cannot update.");
      setLoading(false);
      return;
    }

    const cpp = parseFloat(totalCost) / parseFloat(numberOfPortions);
    const salePrice = parseFloat(actualSalePrice);

    // 🔐 Get the logged-in user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("User not authenticated:", userError?.message);
      alert("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    // ✅ Step 1: Update recipe
    const { error: updateError } = await supabase
      .from("recipes")
      .update({
        recipe_name: recipeName,
        note: recipeNote,
        recipe_type: recipeType,
        total_cost: totalCost,
        num_items: numItems,
        cost_per_portion: cpp,
        number_of_portions: numberOfPortions,
        min_sale_price: minSalePrice,
        actual_sale_price: salePrice,
        actual_food_cost_pct: actualFoodCostPct,
      })
      .eq("id", parseInt(recipeId));

    if (updateError) {
      console.error("Error updating recipe:", updateError.message);
      alert("Failed to update recipe.");
      setLoading(false);
      return;
    }

    if (recipeType.toLowerCase() === "ingrédients") {
      const inventoryItem = {
        user_id: userId,
        item_name: recipeName,
        category: "Ingrédients",
        pack_type: "n/a",
        qnty_item_pack: 1,
        unit_type: "unit",
        unit_per_itm: 1,
        total_units_per_pack: numberOfPortions,
        price_per_pack: cpp,
        price_per_item: cpp,
        price_per_unit: cpp,
        yield_pct: 100,
        effective_price_per_unit: cpp,
        supplier: "Kitchen",
        note: null,
      };

      // Upsert (insert if not exists, update if exists)
      const { error: upsertError } = await supabase
        .from("inventory")
        .upsert([inventoryItem], { onConflict: ["user_id", "item_name"] });

      if (upsertError) {
        console.error("Error upserting inventory item:", upsertError.message);
        alert("Error saving to inventory.");
      } else {
        console.log("Recipe also updated in inventory.");
      }
    }

    // ✅ Step 2: Delete old ingredients
    const { error: deleteError } = await supabase
      .from("recipe_ingredients")
      .delete()
      .eq("recipe_id", parseInt(recipeId));

    if (deleteError) {
      console.error("Error deleting old ingredients:", deleteError.message);
      alert("Failed to delete old ingredients.");
      setLoading(false);
      return;
    }

    // ✅ Step 3: Insert updated item list
    const ingredientsToInsert = ingredients.map((item) => ({
      user_id: userId,
      recipe_id: parseInt(recipeId),
      ingredient_id: item.id,
      item_name: item.item_name || "Unnamed item",
      quantity_used: item.quantity_used,
      unit_type: item.unit_type,
      price_per_unit: item.price_per_unit,
      ingredient_cost: item.cost,
      created_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert);

    if (insertError) {
      console.error("Error saving updated ingredients:", insertError.message);
      alert("Failed to insert updated ingredients.");
      setLoading(false);
      return;
    }

    console.log("ingredientsToInsert:", ingredientsToInsert);
    // Reset state
    setRecipeName("");
    setRecipeType("");
    setNumberOfPortions("");
    setActualSalePrice("");
    setRecipeNote("");
    setIngredients([]);
    setRecipeSelected(false);

    // ✅ Refresh the table
    fetchRecipes();

    onRecipeSaved && onRecipeSaved();
    setLoading(false);
  };

  // Recipe Type
  const recipeTypes = [
    { value: "ingrédients", label: "Ingrédients" },
    { value: "amuse-bouche", label: "Amuse-bouche" },
    { value: "appetizer", label: "Appetizer" },
    { value: "bakery", label: "Bakery" },
    { value: "beverage", label: "Beverage" },
    { value: "bread", label: "Bread" },
    { value: "breakfast", label: "Breakfast" },
    { value: "brunch", label: "Brunch" },
    { value: "casserole", label: "Casserole" },
    { value: "canape", label: "Canapé" },
    { value: "condiment", label: "Condiment" },
    { value: "confit", label: "Confit" },
    { value: "complement", label: "Complement" },
    { value: "cocktail", label: "Cocktail" },
    { value: "dessert", label: "Dessert" },
    { value: "dip", label: "Dip" },
    { value: "glace", label: "Glace" },
    { value: "garnish", label: "Garnish" },
    { value: "gougères", label: "Gougères" },
    { value: "jam", label: "Jam" },
    { value: "main-course", label: "Main Course" },
    { value: "marinade", label: "Marinade" },
    { value: "marmalade", label: "Marmalade" },
    { value: "mousse", label: "Mousse" },
    { value: "pâtisserie", label: "Pâtisserie" },
    { value: "pâté", label: "Pâté" },
    { value: "pasta", label: "Pasta" },
    { value: "pastry", label: "Pastry" },
    { value: "pickles", label: "Pickles" },
    { value: "pizza", label: "Pizza" },
    { value: "main", label: "Main" },
    { value: "salad", label: "Salad" },
    { value: "mise-en-place", label: "Mise-en-place" },
    { value: "pâté-en-croûte", label: "Pâté en Croûte" },
    { value: "prep", label: "Prep" },
    { value: "preserve", label: "Preserve" },
    { value: "sauce", label: "Sauce" },
    { value: "side", label: "Side" },
    { value: "sorbet", label: "Sorbet" },
    { value: "soup", label: "Soup" },
    { value: "starter", label: "Starter" },
    { value: "sweets", label: "Sweets" },
    { value: "tart", label: "Tart" },
    { value: "tartare", label: "Tartare" },
    { value: "terrine", label: "Terrine" },
    { value: "vegetable", label: "Vegetable" },
    { value: "other", label: "Other" },
  ];

  // make sure the form is filled before add new item
  const formFilled =
    recipeName !== "" &&
    recipeType !== "" &&
    numberOfPortions !== "" &&
    actualSalePrice !== "";

  // Fetch Recipe and Ingredients from both tables "recipes" and "recipe_ingredients"
  const handleRecipeSelect = async (recipeId) => {
    setRecipeSelected(true); // Set recipeSelect to true
    try {
      // Fetch recipe from "recipes" table
      const { data: recipe, error: recipeError } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", recipeId)
        .single();

      if (recipeError) throw recipeError;

      // Set the current recipe ID correctly 👇
      setRecipeId(recipeId); // ✅ <--- THIS LINE WAS MISSING

      // Set recipe data in form fields
      setRecipeName(recipe.recipe_name);
      setRecipeNote(recipe.note);
      setRecipeType(recipe.recipe_type);
      setNumberOfPortions(recipe.number_of_portions);
      setActualSalePrice(recipe.actual_sale_price);

      // Fetch ingredients from "recipe_ingredients" table
      const { data: ingredients, error: ingredientsError } = await supabase
        .from("recipe_ingredients")
        .select("*")
        .eq("recipe_id", recipeId);

      if (ingredientsError) throw ingredientsError;

      const enrichedIngredients = ingredients.map((ing) => ({
        ...ing,
        item_id: ing.item_name,
        price_per_unit: ing.price_per_unit,
        unit_type: ing.unit_type,
        cost: ing.ingredient_cost,
      }));

      setIngredients(enrichedIngredients);
    } catch (error) {
      console.error("Error loading recipe:", error.message);
    }
  };

  // Delete Recipe
  const handleDeleteRecipe = async (recipeId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this recipe?"
    );
    if (!confirmDelete) return;

    // ✅ Step 1: Get the logged-in user ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.error("User not authenticated:", userError?.message);
      alert("Authentication error. Please log in again.");
      return;
    }
    const userId = userData.user.id;

    // ✅ Step 2: Fetch the recipe to get the name and type
    const { data: recipeData, error: fetchError } = await supabase
      .from("recipes")
      .select("recipe_name, recipe_type")
      .eq("id", recipeId)
      .single();

    if (fetchError || !recipeData) {
      console.error(
        "Error fetching recipe before delete:",
        fetchError?.message
      );
      alert("Failed to retrieve recipe details.");
      return;
    }

    const { recipe_name, recipe_type } = recipeData;

    // ✅ Step 3: If recipe is "ingrédients", delete it from inventory first
    if (recipe_type.toLowerCase() === "ingrédients") {
      const { error: inventoryDeleteError } = await supabase
        .from("inventory")
        .delete()
        .eq("user_id", userId)
        .eq("item_name", recipe_name);

      if (inventoryDeleteError) {
        console.error(
          "Error deleting from inventory:",
          inventoryDeleteError.message
        );
        alert("Failed to delete item from inventory.");
        return;
      } else {
        console.log("Inventory item deleted.");
      }
    }

    // ✅ Step 4: Delete the recipe
    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId);

    if (error) {
      console.error("Error deleting recipe:", error.message);
      alert("Failed to delete recipe.");
    } else {
      alert("Recipe deleted successfully.");

      // ✅ Clear form state
      setRecipeName("");
      setRecipeType("");
      setNumberOfPortions("");
      setActualSalePrice("");
      setRecipeNote("");
      setIngredients([]);
      setRecipeSelected(false);

      // ✅ Refresh the recipe list
      fetchRecipes();
    }
  };

  // TextField and InputLabel customizations
  const sharedStyles = {
    "& .MuiInputLabel-root": {
      color: "#38a3a5",
      fontSize: 14,
    },
    "& .MuiOutlinedInput-root": {
      "& fieldset": {
        border: "1px solid #38a3a5",
      },
      "&:hover fieldset": {
        borderColor: "darkGreen",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#25a18e",
      },
    },
  };

  // Format Curency
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  return (
    <main>
      <motion.div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 mb-3">
        <StatCardRecipe
          icon={
            <RamenDiningOutlinedIcon
              sx={{ color: "#38a3a5", fontSize: "26px" }}
            />
          }
          title={"Recipes Sumary"}
          value={`${recipes.length} Saved Recipes`}
          value2={
            latestEntryDate
              ? `Last Entry: ${format(new Date(latestEntryDate), "dd-MM-yyyy")}`
              : "No data available"
          }
        />

        <StatCardRecipe
          icon={
            <LoyaltyOutlinedIcon sx={{ color: "#38a3a5", fontSize: "26px" }} />
          }
          title={`Selling Info`}
          value={`Price per portion: € ${formatCurrency(costPerPortion)}`}
          value2={`MSP: € ${formatCurrency(minSalePrice)}`}
        />
        <StatCardRecipe
          icon={
            <PriceChangeOutlinedIcon
              sx={{ color: "#38a3a5", fontSize: "26px" }}
            />
          }
          title={`Cost Info`}
          value={`Recipe Cost: € ${formatCurrency(totalCost)}`}
          value2={
            <span
              style={{ color: actualFoodCostPct > 28 ? "#f78154" : "inherit" }}
            >
              Actual FC: {formatCurrency(actualFoodCostPct)}%
            </span>
          }
        />
      </motion.div>

      <Box
        className="Main Box"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: { xs: "auto", md: "100%" }, // ← KEY LINE!
          width: "100%",
          border: "2px solid lightGray",
          borderRadius: 2,
          p: 2,
        }}
      >
        {/* Left Box: Recipe Calculator */}
        <Box
          className="Recipe Calculator"
          sx={{
            flex: "1 1 auto",
            minHeight: 0,
            height: "auto", // Make sure not to force height
          }}
        >
          <form onSubmit={handleSubmit} className="p-2 bg-gray-100 text-[#444]">
            <h3 className="text-base mb-4 text-[#3FA89B] font-bold">
              ADD / UPDATE RECIPE
            </h3>
            <Box
              display="grid"
              gap="15px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
              }}
            >
              <FormControl
                fullWidth
                variant="outlined"
                sx={{ gridColumn: "span 2" }}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Recipe Name"
                  value={recipeName}
                  onChange={(e) => setRecipeName(e.target.value)}
                  required
                  sx={{
                    ...sharedStyles,
                    input: { color: "#333", fontSize: 16 },
                  }}
                />
              </FormControl>

              {/* Recipe Type */}
              <FormControl
                sx={{
                  gridColumn: "span 2",
                  ...sharedStyles,
                  width: "100%",
                  // Selected value text
                  "& .MuiSelect-select": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500, // semibold
                  },
                  // Dropdown icon (arrow)
                  "& .MuiSvgIcon-root": {
                    fontSize: "2.2rem",
                    color: "#38a3a5", // customize icon color
                  },
                  "& .MuiFormLabel-root": {
                    color: "#38a3a5 !important",
                  },
                }}
              >
                <InputLabel>Recipe Type</InputLabel>
                <Select
                  value={recipeType}
                  label="Recipe Type"
                  onChange={(e) => setRecipeType(e.target.value)}
                  required
                  sx={{
                    ...sharedStyles,
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        ...sharedStyles,
                        backgroundColor: "#f5f5f5", // ✅ gray background for dropdown
                        color: "#777",
                      },
                    },
                    MenuListProps: {
                      sx: {
                        ...sharedStyles,
                        "& .MuiMenuItem-root": {
                          fontSize: 16,
                        },
                      },
                    },
                  }}
                >
                  {recipeTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl
                sx={{
                  gridColumn: "span 2",
                  ...sharedStyles,
                  width: "100%",
                  // Selected value text
                  "& .MuiSelect-select": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500, // semibold
                  },
                  // Dropdown icon (arrow)
                  "& .MuiSvgIcon-root": {
                    fontSize: "2.2rem",
                    color: "#38a3a5", // customize icon color
                  },
                  "& .MuiFormLabel-root": {
                    color: "#38a3a5 !important",
                  },
                }}
              >
                {/* Number of Portions */}
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Number of Portions"
                  type="number"
                  value={numberOfPortions}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty string to let the user delete and type freely
                    if (val === "") {
                      setNumberOfPortions("");
                    } else {
                      setNumberOfPortions(Number(val));
                    }
                  }}
                  slotProps={{ min: 1 }}
                  required
                  sx={{
                    ...sharedStyles,
                    input: { color: "#333", fontSize: 16 },
                  }}
                />
              </FormControl>

              <FormControl
                sx={{
                  gridColumn: "span 2",
                  ...sharedStyles,
                  width: "100%",
                  // Selected value text
                  "& .MuiSelect-select": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500, // semibold
                  },
                  // Dropdown icon (arrow)
                  "& .MuiSvgIcon-root": {
                    fontSize: "2.2rem",
                    color: "#38a3a5", // customize icon color
                  },
                  "& .MuiFormLabel-root": {
                    color: "#38a3a5 !important",
                  },
                }}
              >
                {/* Actual Sale Price */}
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Actual Sale Price (€)"
                  type="number"
                  value={actualSalePrice}
                  onChange={(e) => {
                    const val = e.target.value;
                    // Allow empty string to let the user delete and type freely
                    if (val === "") {
                      setActualSalePrice("");
                    } else {
                      setActualSalePrice(Number(val));
                    }
                  }}
                  slotProps={{ min: 0, step: "0.01" }}
                  required
                  sx={{
                    ...sharedStyles,
                    input: { color: "#333", fontSize: 16 },
                  }}
                />
              </FormControl>

              <FormControl
                sx={{
                  gridColumn: "span 4",
                  ...sharedStyles,
                  width: "100%",
                  // Selected value text
                  "& .MuiSelect-select": {
                    color: "dimGray !important",
                    fontSize: "16px",
                    fontWeight: 500, // semibold
                  },
                  // Dropdown icon (arrow)
                  "& .MuiSvgIcon-root": {
                    fontSize: "2.2rem",
                    color: "#38a3a5", // customize icon color
                  },
                  "& .MuiFormLabel-root": {
                    color: "#38a3a5 !important",
                  },
                }}
              >
                {/* Note */}
                <TextField
                  fullWidth
                  variant="outlined"
                  label="Note"
                  value={recipeNote}
                  onChange={(e) => setRecipeNote(e.target.value)}
                  multiline
                  minRows={2} // or rows={4} if you want a fixed height
                  sx={{
                    ...sharedStyles,
                    "& .MuiInputBase-inputMultiline": {
                      color: "#333", // ✅ text color for textarea
                      fontSize: 16,
                    },
                  }}
                />
              </FormControl>
            </Box>

            {/* IngredientsTable */}
            <Box
              sx={{
                flex: 1,
                height: "100%",
                mt: 2,
                fontSize: 14,
                minWidth: 0,
                minHeight: 0,
                border: "1px solid #60d394",
                "& .text-white": {
                  color: "#007f5f",
                },
              }}
            >
              <table className="table-auto w-full text-sm text-[#333] rounded shadow">
                <thead>
                  <tr
                    className="bg-gray-200"
                    style={{ borderBottom: "1px solid #60d394" }}
                  >
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Select an Ingredient
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Qty Used
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Unit type
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Price/Unit
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Cost
                    </th>
                    <th className="p-2 font-semibold text-white bg-[#ebf1fa] text-left">
                      Del
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ingredients.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-200">
                      <td className="p-2">
                        <select
                          className="bg-gray-100 p-1 rounded w-full"
                          value={item.item_id || ""}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "item_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select Ingredeient</option>
                          {[...inventoryItems]
                            .sort((a, b) =>
                              a.item_name.localeCompare(b.item_name)
                            )
                            .map((item) => (
                              <option
                                key={item.item_name}
                                value={item.item_name}
                              >
                                {item.item_name}
                              </option>
                            ))}
                        </select>
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          className="bg-gray-100 p-1 rounded w-20"
                          value={item.quantity_used}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "quantity_used",
                              e.target.value
                            )
                          }
                        />
                      </td>
                      <td className="p-2">{item.unit_type}</td>
                      <td className="p-2">
                        €{item.price_per_unit?.toFixed(5)}
                      </td>
                      <td className="p-2">€{item.cost?.toFixed(4)}</td>
                      <td className="p-2 text-right">
                        <button
                          type="button" // <<<<< THIS is critical
                          onClick={() => removeIngredientRow(index)}
                          className="hover:text-red-400 text-lightGray font-semibold px-2 py-1 rounded"
                        >
                          𝘅
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {/* Finish item Table */}
            </Box>

            {/* Buttons */}
            <Box
              display="grid"
              gap="5px"
              gridTemplateColumns={
                isMobile ? "repeat(2, 1fr)" : "repeat(8, 1fr)"
              }
              sx={{
                "& > div": { gridColumn: isNonMobile ? undefined : "span 1" },
                pb: 1,
              }}
            >
              {/* Add Ingredients button */}
              <Button
                onClick={addIngredientRow}
                variant="contained"
                disabled={!formFilled}
                sx={{
                  gridColumn: isMobile ? "span 2" : "span 2",
                  backgroundColor: "#26A889",
                  color: "white",
                  fontSize: 14,
                  "&:hover": {
                    backgroundColor: "#62CDB4",
                  },
                  marginTop: isMobile ? 2 : 2,
                  height: 40,
                }}
              >
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "bold",
                    marginRight: "0.5rem",
                  }}
                >
                  +{" "}
                </span>
                Ingredients
              </Button>

              {/* Save Recipe Button */}
              <Button
                type="submit"
                variant="contained"
                disabled={loading || recipeSelected}
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 2",
                  backgroundColor: "#26A889",
                  color: "white",
                  fontSize: 14,
                  "&:hover": {
                    backgroundColor: "#62CDB4",
                  },
                  marginTop: isMobile ? 0 : 2,
                  height: 40,
                }}
              >
                {loading ? "Saving..." : "Save"}
              </Button>

              {/* Update Recipe Button */}
              <Button
                type="button"
                onClick={handleUpdate}
                variant="contained"
                disabled={loading}
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 2",
                  backgroundColor: "#00b4d8",
                  color: "white",
                  fontSize: 14,
                  "&:hover": {
                    backgroundColor: "#90e0ef",
                  },
                  marginTop: isMobile ? 0 : 2,
                  height: 40,
                }}
              >
                {loading ? "Saving..." : "Update"}
              </Button>

              {/* Delete Recipe */}
              <Button
                type="button"
                variant="contained"
                onClick={() => handleDeleteRecipe(recipeId)} // Make sure recipeId is defined
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 1",
                  backgroundColor: "#ff4d6d",
                  color: "white",
                  fontSize: 14,
                  "&:hover": {
                    backgroundColor: "#ff758f",
                  },
                  marginTop: isMobile ? 0 : 2,
                  height: 40,
                }}
              >
                Del
              </Button>

              {/* Clear button */}
              <Button
                type="button"
                variant="contained"
                onClick={() => {
                  setRecipeName("");
                  setRecipeType("");
                  setNumberOfPortions("");
                  setActualSalePrice("");
                  setRecipeNote("");
                  setIngredients([]);
                  setRecipeSelected(false);
                }}
                sx={{
                  gridColumn: isMobile ? "span 1" : "span 1",
                  backgroundColor: "#EAB308",
                  "&:hover": {
                    backgroundColor: "#facc15",
                  },
                  marginTop: isMobile ? 0 : 2,
                  height: 40,
                }}
              >
                Clear
              </Button>
            </Box>

            <Snackbar
              open={openSnackbar}
              autoHideDuration={3000}
              onClose={() => setOpenSnackbar(false)}
            >
              <Alert
                onClose={() => setOpenSnackbar(false)}
                severity={snackbarSeverity}
                sx={{ width: "100%" }}
              >
                {snackbarMessage}
              </Alert>
            </Snackbar>
          </form>
        </Box>

        {/* Saved Recipe List  */}
        <Box
          className="Saved Recipe List"
          sx={{
            flexGrow: 1,
            flexShrink: 1,
            flexBasis: "auto",
            height: "auto", // Make sure not to force height
            minHeight: 0, // Allow shrinking if needed
          }}
        >
          <div className="p-2 bg-gray-100 text-[#444]">
            <h2 className="text-base mb-4 text-[#3FA89B] font-bold">
              SAVED RECIPES
            </h2>
            <Box
              className="Saved Recipe List"
              sx={{
                widows: "100%",
                minWidth: 0,
                borderRadius: 0,
                border: "1px solid #60d394",
              }}
            >
              {loading ? (
                <p>Loading recipes...</p>
              ) : recipes.length === 0 ? (
                <p>No recipes saved yet.</p>
              ) : (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto hide-scrollbar">
                  <table className="table-auto w-full text-sm min-w-0">
                    <thead
                      className="bg-[#2a303a] sticky top-0 z-10"
                      style={{ borderBottom: "1px solid #60d394" }}
                    >
                      <tr>
                        <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Name
                        </th>
                        <th className="p-2 text-Center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          N. Items
                        </th>
                        <th className="p-2 text-left text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Type
                        </th>
                        <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Cost
                        </th>
                        <th className="p-2 text-Center text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          N. Ports
                        </th>
                        <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Price
                        </th>
                        <th className="p-2 text-right text-[#007f5f] bg-[#ebf1fa] font-semibold">
                          Food Cost %
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...recipes]
                        .sort((a, b) =>
                          a.recipe_name.localeCompare(b.recipe_name)
                        ) // Alphabetical by recipe_name
                        .map((recipe) => (
                          <tr
                            key={recipe.id}
                            className="border-b hover:bg-gray-200 w-full min-w-0"
                            onClick={() => handleRecipeSelect(recipe.id)} // 👈 Add this line
                          >
                            <td className="p-2">{recipe.recipe_name}</td>
                            <td className="p-2 text-center">
                              {recipe.num_items}
                            </td>
                            <td className="p-2 capitalize">
                              {recipe.recipe_type}
                            </td>
                            <td className="p-2 text-right">
                              € {formatCurrency(recipe.total_cost)}
                            </td>
                            <td className="p-2 text-center">
                              {recipe.number_of_portions}
                            </td>
                            <td className="p-2 text-right">
                              € {formatCurrency(recipe.actual_sale_price)}
                            </td>
                            <td className="p-2 text-right">
                              {recipe.actual_food_cost_pct?.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Box>
          </div>
        </Box>
      </Box>
    </main>
  );
};

export default RecipeForm;
