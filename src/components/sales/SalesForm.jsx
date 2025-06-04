// import { useState, useEffect } from "react";
// import supabase from "../supabaseClient";
// import {
//   TextField,
//   Button,
//   MenuItem,
//   Box,
//   useMediaQuery,
//   useTheme,
// } from "@mui/material";
// import { tokens } from "../theme";

// export function SalesForm({ selectedRow  }) {
//   const theme = useTheme();
//   const colors = tokens(theme.palette.mode);
//   const isNonMobile = useMediaQuery("(min-width:600px)");
//   const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
//   const [recipes, setRecipes] = useState([]);
//   const [selectedRecipe, setSelectedRecipe] = useState(null);
//   const [salePrice, setSalePrice] = useState("");
//   const [quantity, setQuantity] = useState(1);
//   const [notes, setNotes] = useState("");

//   useEffect(() => {
//     if (selectedRow) {
//       setSalePrice(selectedRow.sale_price || "");
//       setQuantity(selectedRow.quantity_sold || "");
//       setNotes(selectedRow.notes || "");
//       setSelectedRecipe({ id: selectedRow.recipe_id }); // assuming `recipe_id`
//     }
//   }, [selectedRow]);


//   // Fetch date from Supabase
//   useEffect(() => {
//     async function fetchRecipes() {
//       try {
//         const { data, error } = await supabase
//           .from("recipes")
//           .select("id, user_id, recipe_name, recipe_type, actual_sale_price");

//         if (error) {
//           console.error("Error fetching recipes:", error);
//           return;
//         }

//         setRecipes(data);
//         console.log("Recipes fetched successfully:", data);
//       } catch (err) {
//         console.error("Unexpected error fetching recipes:", err);
//       }
//     }

//     fetchRecipes();
//   }, []);

//   const handleRecipeChange = (e) => {
//     const recipe = recipes.find((r) => r.id === Number(e.target.value));
//     setSelectedRecipe(recipe);
//     setSalePrice(recipe.actual_sale_price);
//   };

//   // Save Sales Record in database
//   const handleSubmit = async () => {
//     if (!selectedRecipe) {
//       console.log("No recipe selected, aborting submit.");
//       return;
//     }

//     const saleRecord = {
//       user_id: selectedRecipe.user_id,
//       item_id: selectedRecipe.id,
//       item_name: selectedRecipe.recipe_name,
//       item_type: selectedRecipe.recipe_type,
//       sale_price: salePrice,
//       quantity_sold: quantity,
//       sale_date: new Date().toISOString().split("T")[0],
//       notes,
//     };

//     console.log("Attempting to insert sale record:", saleRecord);

//     const { data, error } = await supabase.from("sales").insert([saleRecord]);

//     if (error) {
//       console.error("Error inserting sale:", error);
//     } else {
//       console.log("Sale inserted successfully:", data);
//       alert("Sale recorded!");
//       setRefreshFlag(prev => !prev);
//     }
//     setSalePrice("");
//     setQuantity(0); 
//     setNotes("");
//     setSelectedRecipe(null);
//   };
  
//   return (
//     <Box m="5px 20px">
//       <form>
//         <h3 className="text-base mb-2 text-LightGray">Daily Sales Record</h3>
//         <Box
//           display="grid"
//           gap="15px"
//           gridTemplateColumns="repeat(3, minmax(0, 1fr))"
//           sx={{
//             "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
//             mb: 1,
//           }}
//         >
//           {/* Select items */}
//           <TextField
//             select
//             fullWidth
//             variant="filled"
//             label="Select Item"
//             value={selectedRecipe?.id || ""}
//             onChange={handleRecipeChange}
//             sx={{
//               gridColumn: "span 1",
//               "& .MuiInputBase-input": {
//                 fontSize: "20px",
//               },
//               "& .MuiInputBase-root": {
//                 backgroundColor: "#4B5360",
//                 "&.Mui-focused": { backgroundColor: "#7A8392" },
//               },
//               "& .MuiInputLabel-root": {
//                 color: "white",
//                 "&.Mui-focused": {
//                   color: colors.greenAccent[100],
//                   fontSize: 16,
//                 },
//               },
//             }}
//           >
//             {recipes.map((r) => (
//               <MenuItem key={r.id} value={r.id}>
//                 {r.recipe_name}
//               </MenuItem>
//             ))}
//           </TextField>

//           {/* Items Price */}
//           <TextField
//             label="Item Price (€)"
//             fullWidth
//             variant="filled"
//             type="number"
//             value={salePrice}
//             onChange={(e) => setSalePrice(e.target.value)}
//             sx={{
//               gridColumn: "span 1",
//               "& .MuiInputBase-input": {
//                 fontSize: "20px",
//               },
//               "& .MuiInputBase-root": {
//                 backgroundColor: "#4B5360",
//                 "&.Mui-focused": { backgroundColor: "#7A8392" },
//               },
//               "& .MuiInputLabel-root": {
//                 color: "white",
//                 "&.Mui-focused": {
//                   color: colors.greenAccent[100],
//                   fontSize: 16,
//                 },
//               },
//             }}
//           />

//           {/* Items Quantity */}
//           <TextField
//             label="Quantity Sold"
//             fullWidth
//             variant="filled"
//             type="number"
//             value={quantity}
//             onChange={(e) => setQuantity(e.target.value)}
//             sx={{
//               gridColumn: "span 1",
//               "& .MuiInputBase-input": {
//                 fontSize: "20px",
//               },
//               "& .MuiInputBase-root": {
//                 backgroundColor: "#4B5360",
//                 "&.Mui-focused": { backgroundColor: "#7A8392" },
//               },
//               "& .MuiInputLabel-root": {
//                 color: "white",
//                 "&.Mui-focused": {
//                   color: colors.greenAccent[100],
//                   fontSize: 16,
//                 },
//               },
//             }}
//           />

//           {/* Notes */}
//           <TextField
//             label="Notes"
//             fullWidth
//             variant="filled"
//             multiline
//             value={notes}
//             onChange={(e) => setNotes(e.target.value)}
//             sx={{
//               gridColumn: "span 3",
//               "& .MuiInputBase-input": {
//                 fontSize: "20px",
//               },
//               "& .MuiInputBase-root": {
//                 backgroundColor: "#4B5360",
//                 "&.Mui-focused": { backgroundColor: "#7A8392" },
//               },
//               "& .MuiInputLabel-root": {
//                 color: "white",
//                 "&.Mui-focused": {
//                   color: colors.greenAccent[100],
//                   fontSize: 16,
//                 },
//               },
//             }}
//           />
//         </Box>

//         {/* Buttons */}
//         <Box
//           display="grid"
//           gap="10px"
//           gridTemplateColumns={isMobile ? "repeat(2, 1fr)" : "repeat(8, 1fr)"}
//           sx={{
//             "& > div": { gridColumn: isNonMobile ? undefined : "span 1" },
//             mb: 3,
//           }}
//         >
//           {/* Save button */}
//           <Button
//             variant="contained"
//             onClick={handleSubmit}
//             sx={{
//               gridColumn: isMobile ? "span 1" : "span 2",
//               backgroundColor: "#26A889",
//               color: "white",
//               fontSize: 14,
//               "&:hover": {
//                 backgroundColor: "#62CDB4",
//               },
//               height: 44,
//               marginTop: 1.1,
//             }}
//           >
//             Save Sale
//           </Button>

//           {/* Clear button */}
//           <Button
//             type="button"
//             variant="contained"
//             onClick={() => {
//               // setRecipeName("");
//               // setRecipeType("");
//               // setNumberOfPortions("");
//               // setActualSalePrice("");
//               // setRecipeNote("");
//               // setIngredients([]);
//             }}
//             sx={{
//               gridColumn: isMobile ? "span 1" : "span 2",
//               backgroundColor: "#EAB308",
//               color: "white",
//               "&:hover": {
//                 backgroundColor: "#facc15",
//               },
//               fontSize: 14,
//               height: 44,
//               marginTop: 1.1,
//             }}
//           >
//             Clear
//           </Button>
//         </Box>
//       </form>
//     </Box>
//   );
// }
// export default SalesForm;

