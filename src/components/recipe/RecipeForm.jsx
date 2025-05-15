import {
  Box,
  Button,
  TextField,
  useMediaQuery,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import supabase from "../supabaseClient"; // Import Supabase client
import { tokens } from "../theme";

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
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [inventoryItems, setInventoryItems] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipeId, setRecipeId] = useState(""); // Initialize as an empty string
  const [numItems, setNumItems] = useState();

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

  // Handle ingredient changes
  const handleIngredientChange = (index, field, value) => {
    const updated = [...ingredients];

    if (field === "item_id") {
      const item = inventoryItems.find((item) => item.item_name === value);
      if (item) {
        updated[index] = {
          ...updated[index],
          item_id: item.item_name,
          item_name: item.item_name,
          price_per_unit: item.price_per_unit,
          unit_type: item.unit_type,
          quantity_used: "",
          cost: item.price_per_unit,
        };
      }
    } else if (field === "quantity_used") {
      const quantity = parseFloat(value) || 0;
      const price = updated[index].price_per_unit || 0;
      updated[index].quantity_used = quantity;
      updated[index].cost = quantity * price;
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
    } else {
      alert("Recipe and Ingredients saved successfully!");
      // ✅ Continue with ingredient saving
    }

    const recipeId = data.id;

    // 🔐 Get the logged-in user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
      console.error("User not authenticated:", userError?.message);
      alert("Authentication error. Please log in again.");
      setLoading(false);
      return;
    }

    const userId = userData.user.id;

    // ✅ Now build the ingredients array with user_id and recipe_id
    const ingredientsToInsert = ingredients.map((ingredient) => ({
      user_id: userId,
      recipe_id: recipeId,
      ingredient_id: ingredient.id, // this is the inventory item's ID
      ingredient_name: ingredient.item_name,
      quantity_used: ingredient.quantity_used,
      unit_type: ingredient.unit_type,
      price_per_unit: ingredient.price_per_unit,
      ingredient_cost: ingredient.cost,
      created_at: new Date().toISOString(), // optional
    }));

    // Insert ingredients
    const { error: insertError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert);

    if (insertError) {
      console.error("Error saving ingredients:", insertError.message);
    } else {
      console.log("Ingredients saved successfully.");
      // alert("Ingredients saved successfully");
    }

    // Reset state
    setRecipeName("");
    setRecipeType("");
    setNumberOfPortions("");
    setActualSalePrice("");
    setRecipeNote("");
    setIngredients([]);

    // ✅ Refresh the table
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

    // ✅ Step 3: Insert updated ingredient list
    const ingredientsToInsert = ingredients.map((ingredient) => ({
      user_id: userId,
      recipe_id: parseInt(recipeId),
      ingredient_id: ingredient.id,
      ingredient_name: ingredient.ingredient_name || "Unnamed Ingredient",
      quantity_used: ingredient.quantity_used,
      unit_type: ingredient.unit_type,
      price_per_unit: ingredient.price_per_unit,
      ingredient_cost: ingredient.cost,
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

    alert("Recipe and ingredients updated successfully!");
    // Reset state
    setRecipeName("");
    setRecipeType("");
    setNumberOfPortions("");
    setActualSalePrice("");
    setRecipeNote("");
    setIngredients([]);

    // ✅ Refresh the table
    fetchRecipes();

    onRecipeSaved && onRecipeSaved();
    setLoading(false);
  };

  // Recipe Type
  const recipeTypes = [
    { value: "amuse-bouche", label: "Amuse-bouche" },
    { value: "bakery", label: "Bakery" },
    { value: "breakfast", label: "Breakfast" },
    { value: "canape", label: "Canapé" },
    { value: "complement", label: "Complement" },
    { value: "cocktail", label: "Cocktail" },
    { value: "dessert", label: "Dessert" },
    { value: "glace", label: "Glace" },
    { value: "gougères", label: "Gougères" },
    { value: "main", label: "Main" },
    { value: "mise-en-place", label: "Mise-en-place" },
    { value: "sauce", label: "Sauce" },
    { value: "side", label: "Side" },
    { value: "starter", label: "Starter" },
  ];

  // make sure the form is filled before add new ingredient
  const formFilled =
    recipeName !== "" &&
    recipeType !== "" &&
    numberOfPortions !== "" &&
    actualSalePrice !== "";

  // Fetch Recipe and Ingredients from both tables "recipes" and "recipe_ingredients"
  const handleRecipeSelect = async (recipeId) => {
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
        item_id: ing.ingredient_name,
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

    const { error } = await supabase
      .from("recipes")
      .delete()
      .eq("id", recipeId); // Use the actual column for identifying the recipe

    if (error) {
      console.error("Error deleting recipe:", error.message);
      alert("Failed to delete recipe.");
    } else {
      alert("Recipe deleted successfully.");
      // Optionally, reset form or refresh the recipe list
      setRecipeName("");
      setRecipeType("");
      setNumberOfPortions("");
      setActualSalePrice("");
      setRecipeNote("");
      setIngredients([]);

      // ✅ Refresh the table
      fetchRecipes();
    }
  };

  return (
    <Box m="5px 0px">
      <form onSubmit={handleSubmit}>
        <h3 className="text-base mb-2 text-LightGray">Recipe Calculator</h3>
        <Box
          display="grid"
          gap="15px"
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
          }}
        >
          {/* Recipe Name */}
          <TextField
            fullWidth
            variant="filled"
            label="Recipe Name"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            required
            sx={{
              gridColumn: isMobile ? "span 1" : "span 2",
              "& .MuiInputLabel-root": {
                "&.Mui-focused": {
                  color: colors.greenAccent[100],
                },
              },
            }}
          />

          {/* Recipe Type */}
          <FormControl variant="filled" sx={{ gridColumn: "span 2" }}>
            <InputLabel
              sx={{
                color: "white", // default color
                "&.Mui-focused": {
                  color: colors.greenAccent[100], // color when focused
                },
              }}
            >
              Recipe Type
            </InputLabel>
            <Select
              value={recipeType}
              onChange={(e) => setRecipeType(e.target.value)}
              required
              sx={{
                gridColumn: isMobile ? "span 1" : "span 2",
                "& .MuiInputLabel-root": {
                  "&.Mui-focused": {
                    color: colors.greenAccent[100],
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

          {/* Number of Portions */}
          <TextField
            fullWidth
            variant="filled"
            label="Number of Portions"
            type="number"
            value={numberOfPortions}
            onChange={(e) => setNumberOfPortions(Number(e.target.value))}
            slotProps={{ min: 1 }}
            required
            sx={{
              gridColumn: isMobile ? "span 1" : "span 2",
              "& .MuiInputLabel-root": {
                "&.Mui-focused": {
                  color: colors.greenAccent[100],
                },
              },
            }}
          />

          {/* Actual Sale Price */}
          <TextField
            fullWidth
            variant="filled"
            label="Actual Sale Price (€)"
            type="number"
            value={actualSalePrice}
            onChange={(e) => setActualSalePrice(Number(e.target.value))}
            slotProps={{ min: 0, step: "0.01" }}
            required
            sx={{
              gridColumn: isMobile ? "span 1" : "span 2",
              "& .MuiInputLabel-root": {
                "&.Mui-focused": {
                  color: colors.greenAccent[100],
                },
              },
            }}
          />

          {/* Note */}
          <TextField
            fullWidth
            variant="filled"
            label="Note"
            value={recipeNote}
            onChange={(e) => setRecipeNote(e.target.value)}
            required
            multiline
            minRows={4} // or rows={4} if you want a fixed height
            sx={{
              gridColumn: isMobile ? "span 1" : "span 4",
              "& .MuiInputLabel-root": {
                "&.Mui-focused": {
                  color: colors.greenAccent[100],
                },
              },
            }}
          />
        </Box>

        {/* 🧠 Calculated Fields */}
        <Box
          display="grid"
          gap="10px"
          alignContent={"center"}
          gridTemplateColumns="repeat(4, minmax(0, 1fr))"
          sx={{
            fontSize: "16px",
            color: colors.grey[200],
            textAlign: "center",
            backgroundColor: "#333D49",
            mt: 2,
            height: "60px",
          }}
        >
          <Box gridColumn="span 1">
            <strong>€ Portion:</strong> €{costPerPortion.toFixed(2)}
          </Box>
          <Box gridColumn="span 1">
            <strong>Recipe Cost:</strong> €{totalCost.toFixed(2)}
          </Box>
          <Box gridColumn="span 1">
            <strong>Min Sale €:</strong> €{minSalePrice.toFixed(2)}
          </Box>
          <Box gridColumn="span 1">
            <strong>Food Cost:</strong> {actualFoodCostPct.toFixed(1)}%
          </Box>
        </Box>

        {/* IngredientsTable */}
        <Box>
          <Box className="mt-4">
            <table className="table-auto w-full text-sm bg-gray-500 text-white rounded shadow">
              <thead>
                <tr className="bg-[#4B5360]">
                  <th className="p-2 font-semibold text-white text-left">
                    Select an Ingredient
                  </th>
                  <th className="p-2 font-semibold text-white text-left">
                    Qty Used
                  </th>
                  <th className="p-2 font-semibold text-white text-left">
                    Unit type
                  </th>
                  <th className="p-2 font-semibold text-white text-left">
                    Price/Unit
                  </th>
                  <th className="p-2 font-semibold text-white text-left">
                    Cost
                  </th>
                  <th className="p-2">Del</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((ingredient, index) => (
                  <tr key={index} className="border-b border-gray-600">
                    <td className="p-2">
                      <select
                        className="bg-gray-500 p-1 rounded w-full"
                        value={ingredient.item_id}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "item_id",
                            e.target.value
                          )
                        }
                      >
                        <option value="">Select</option>
                        {inventoryItems.map((item) => (
                          <option key={item.item_name} value={item.item_name}>
                            {item.item_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        min="0"
                        className="bg-gray-500 p-1 rounded w-20"
                        value={ingredient.quantity_used}
                        onChange={(e) =>
                          handleIngredientChange(
                            index,
                            "quantity_used",
                            e.target.value
                          )
                        }
                      />
                    </td>
                    <td className="p-2">{ingredient.unit_type}</td>
                    <td className="p-2">
                      €{ingredient.price_per_unit?.toFixed(5)}
                    </td>
                    <td className="p-2">€{ingredient.cost?.toFixed(4)}</td>
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
          </Box>

          {/* Finish Ingredient Table */}
        </Box>

        <Box
          display="grid"
          gap="10px"
          gridTemplateColumns={isMobile ? "repeat(2, 1fr)" : "repeat(8, 1fr)"}
          sx={{
            "& > div": { gridColumn: isNonMobile ? undefined : "span 1" },
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
            disabled={loading}
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
            {loading ? "Saving..." : "Save Recipe"}
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
            {loading ? "Saving..." : "Update Recipe"}
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

      {/* Recipe List  */}
      <Box>
        <div className="p-4 bg-[#333D49] text-white rounded-lg shadow mt-6">
          <h2 className="text-xl mb-4">Saved Recipes</h2>

          {loading ? (
            <p>Loading recipes...</p>
          ) : recipes.length === 0 ? (
            <p>No recipes saved yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto hide-scrollbar">
              <table className="table-auto w-full text-sm">
              <thead className="bg-[#2a303a] sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-Center">N. Items</th>
                    <th className="p-2 text-left">Type</th>
                    <th className="p-2 text-right">Cost (€)</th>
                    <th className="p-2 text-Center"># Portions</th>
                    <th className="p-2 text-right">Price (€)</th>
                    <th className="p-2 text-right">Food Cost %</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.map((recipe) => (
                    <tr
                      key={recipe.id}
                      className="border-b border-gray-700 hover:bg-gray-800"
                      onClick={() => handleRecipeSelect(recipe.id)} // 👈 Add this line
                    >
                      <td className="p-2">{recipe.recipe_name}</td>
                      <td className="p-2 text-center">{recipe.num_items}</td>
                      <td className="p-2 capitalize">{recipe.recipe_type}</td>
                      <td className="p-2 text-right">
                        €{recipe.total_cost?.toFixed(2)}
                      </td>
                      <td className="p-2 text-center">
                        {recipe.number_of_portions}
                      </td>
                      <td className="p-2 text-right">
                        €{recipe.actual_sale_price?.toFixed(2)}
                      </td>
                      <td className="p-2 text-right">
                        {recipe.actual_food_cost_pct?.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Box>
    </Box>
  );
};

export default RecipeForm;
