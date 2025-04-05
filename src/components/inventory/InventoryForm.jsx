// import {
//   Box,
//   Button,
//   TextField,
//   useMediaQuery,
//   Snackbar,
//   Alert,
//   IconButton,
//   MenuItem,
//   Menu,
// } from "@mui/material";
// import { ArrowDropDown } from "@mui/icons-material";

// import React from "react";

// import { useFormik } from "formik";
// import supabase from "../supabaseClient"; // Import Supabase client
// import { useState } from "react";
// import { useEffect } from "react";
// import { tokens } from "../theme";
// import { useTheme } from "@mui/material";
// import { Label } from "recharts";

// const InventoryForm = ({ fetchData }) => {
//   // Accept fetchData as a prop
//   const isNonMobile = useMediaQuery("(min-width:600px)");
//   const [openSnackbar, setOpenSnackbar] = useState(false);
//   const [snackbarMessage, setSnackbarMessage] = useState("");
//   const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // success, error, warning

//   const theme = useTheme();
//   const colors = tokens(theme.palette.mode);

//   // Fetch category fomr database
//   const [categories, setCategories] = useState([]);

//   const [anchorEl, setAnchorEl] = useState(null);
//   const open = Boolean(anchorEl);

//   const handleMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null);
//   };

//   useEffect(() => {
//     const fetchCategories = async () => {
//       const { data, error } = await supabase
//         .from('inventory')
//         .select("category") // Select only the category column
//         .neq("category", null); // Exclude null values

//       if (error) {
//         console.error("Error fetching categories:", error);
//       } else {
//         const uniqueCategories = [
//           ...new Set(data.map((item) => item.category)),
//         ]; // Remove duplicates
//         setCategories(uniqueCategories);
//       }
//     };

//     fetchCategories();
//   }, []);

//   const handleOpen = (event) => {
//     setAnchorEl(event.currentTarget);
//   };

//   const handleClose = () => {
//     setAnchorEl(null);
//   };

//   const handleSelectCategory = (category) => {
//     formik.setFieldValue("category", category);
//     handleClose();
//   };

//   // Insert new Product into database
//   useEffect(() => {
//     supabase.auth.onAuthStateChange((event, session) => {
//       console.log("Auth state changed:", event, session);
//     });
//   }, []);

//   const colorForm = {
//     inputColor: "#ADD8E6", // Green
//     labelColor: "#C0C0C0", // Orange
//     helperTextColor: "#4287f5", // Blue
//   };

//   const formik = useFormik({
//     initialValues: {
//       item_name: "",
//       category: "",
//       unit: "",
//       quantity: "",
//       price_per_unit: "",
//       total_cost: "",
//       supplier: "",
//       supplier_id: "",
//     },

//     onSubmit: async (values, { resetForm }) => {
//       try {
//         // ✅ Check if the user is authenticated
//         const { data: userData, error: authError } =
//           await supabase.auth.getUser();

//         if (authError || !userData?.user) {
//           console.error(
//             "Auth Error:",
//             authError?.message || "User is not authenticated"
//           );
//           setSnackbarMessage("You must be logged in to add items.");
//           setSnackbarSeverity("error");
//           setOpenSnackbar(true);
//           return;
//         }

//         const user = userData.user;
//         console.log("Authenticated User ID:", user.id);

//         // ✅ Proceed with the insert
//         const { data, error: insertError } = await supabase
//           .from('inventory')
//           .insert([
//             {
//               ...values,
//               price_per_unit: Number(values.price_per_unit) || 0,
//               total_cost: Number(values.total_cost) || 0,
//               user_id: user.id, // Ensure user ID is included if RLS requires it
//             },
//           ]);

//         if (insertError) {
//           console.error("Supabase Insert Error:", insertError.message);
//           setSnackbarMessage("Failed to save item. " + insertError.message);
//           setSnackbarSeverity("error");
//         } else {
//           console.log("Insert Success:", data);
//           setSnackbarMessage("Item saved successfully!");
//           setSnackbarSeverity("success");
//           resetForm();
//           fetchData(); // ✅ Refresh inventory table
//         }
//       } catch (err) {
//         console.error("Unexpected Error:", err);
//         setSnackbarMessage("An unexpected error occurred. " + err.message);
//         setSnackbarSeverity("error");
//       }

//       setOpenSnackbar(true);
//     },
//   });

//   return (
//     <Box m="5px 20px">
//       <form onSubmit={formik.handleSubmit}>
//         <Box
//           display="grid"
//           gap="15px"
//           gridTemplateColumns="repeat(4, minmax(0, 1fr))"
//           sx={{
//             "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
//           }}
//         >
//           {[
//             { label: "Item name", name: "item_name", span: 4 },
//             {
//               label: "Category",
//               name: "category",
//               span: 2,
//               inputProps: {
//                 endAdornment: (
//                   <IconButton onClick={handleMenuOpen}>
//                     <ArrowDropDown />
//                   </IconButton>
//                 ),
//               },
//             },
//             { label: "Unit", name: "unit", span: 1 },
//             { label: "Quty", name: "quantity", span: 1 },
//             { label: "(€) Unit", name: "price_per_unit", span: 2 },
//             { label: "Total (€)", name: "total_cost", span: 2 },
//             { label: "Supplier", name: "supplier", span: 3 },
//             { label: "Supl ID", name: "supplier_id", span: 1 },
//           ].map(({ label, name, span, inputProps }) => (
//             <TextField
//               key={name}
//               fullWidth
//               variant="filled"
//               label={label}
//               name={name}
//               value={
//                 name === "total_cost"
//                   ? `€ ${new Intl.NumberFormat("en-US", {
//                       minimumFractionDigits: 2,
//                       maximumFractionDigits: 2,
//                     }).format(parseFloat(formik.values[name] || 0))}`
//                   : formik.values[name]
//               }
//               onChange={(e) => {
//                 let { name, value } = e.target;

//                 if (name === "price_per_unit" || name === "quantity") {
//                   value = value.replace(/[^0-9.]/g, ""); // Allow only numbers & dot

//                   // Prevent multiple dots
//                   if ((value.match(/\./g) || []).length > 1) return;

//                   formik.setFieldValue(name, value); // Save user input

//                   // Convert to numbers for calculation
//                   const quantity =
//                     parseFloat(
//                       name === "quantity" ? value : formik.values.quantity
//                     ) || 0;
//                   const pricePerUnit =
//                     parseFloat(
//                       name === "price_per_unit"
//                         ? value
//                         : formik.values.price_per_unit
//                     ) || 0;

//                   const totalCost = quantity * pricePerUnit;
//                   formik.setFieldValue("total_cost", totalCost.toFixed(2)); // Update total_cost
//                 } else {
//                   formik.handleChange(e);
//                 }
//               }}
//               onBlur={(e) => {
//                 let { name, value } = e.target;

//                 if (name === "price_per_unit") {
//                   // Format price_per_unit only when focus is lost
//                   const formattedValue = parseFloat(value || 0).toFixed(2);
//                   formik.setFieldValue(name, formattedValue);
//                 }
//               }}
//               error={formik.touched[name] && Boolean(formik.errors[name])}
//               helperText={formik.touched[name] && formik.errors[name]}
//               sx={{
//                 gridColumn: `span ${span}`,
//                 "& .MuiInputBase-input": {
//                   color: colorForm.inputColor,
//                   fontSize: "20px",
//                 },
//                 "& .MuiInputLabel-animated": {
//                   color: "white",
//                 },
//                 "& .MuiInputBase-root": {
//                   backgroundColor: "#4B5360",
//                   "&.Mui-focused": {
//                     backgroundColor: "#7A8392",
//                   },
//                 },
//                 "& .MuiFormLabel-root": {
//                   color: `${colors.grey[100]} !important`,
//                   "&.Mui-focused": {
//                     color: `${colors.greenAccent[100]} !important`,
//                     fontSize: 16,
//                   },
//                 },
//                 "&.MuiList-root": {
//                   backgroundColorolor: `${colors.greenAccent[100]} !important`,
//                 },
//               }}
//               slotProps={name === "total_cost" ? { readOnly: true } : {}}
//               InputProps={inputProps} // Add the IconButton here
//             />
//           ))}
//         </Box>

//         {/* Add Menu to display categories when the IconButton is clicked */}
//         <Menu
//           anchorEl={anchorEl}
//           open={open}
//           onClose={handleClose}
//           MenuProps={{
//             "aria-labelledby": "category-button",
//           }}
//         >
//           {categories.map((category, index) => (
//             <MenuItem
//               key={index}
//               onClick={() => handleSelectCategory(category)}
//             >
//               {category}
//             </MenuItem>
//           ))}
//         </Menu>

//         <Box
//           display="grid"
//           gap="15px"
//           gridTemplateColumns="repeat(4, minmax(0, 1fr))"
//           sx={{
//             "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
//             pt: 2,
//           }}
//         >
//           {/* Insert Button */}
//           <Button
//             type="submit"
//             color="secondary"
//             variant="contained"
//             onClick={fetchData}
//             sx={{
//               backgroundColor: "#14B8A6",
//               color: "white",
//               "&:hover": { backgroundColor: "#45b344" },
//             }}
//           >
//             Insert
//           </Button>

//           {/* Update Button */}
//           <Button
//             type="button"
//             color="secondary"
//             variant="contained"
//             sx={{
//               backgroundColor: "#14B8A6",
//               color: "white",
//               "&:hover": { backgroundColor: "#6366F1" },
//             }}
//           >
//             Update
//           </Button>

//           {/* Delete Button */}
//           <Button
//             type="button"
//             color="secondary"
//             variant="contained"
//             sx={{
//               backgroundColor: "#14B8A6",
//               color: "white",
//               "&:hover": { backgroundColor: "#F97316" },
//             }}
//           >
//             Delete
//           </Button>

//           {/* Clear Button */}
//           <Button
//             type="button"
//             color="secondary"
//             variant="contained"
//             onClick={() => formik.resetForm()} // Reset form fields
//             sx={{
//               backgroundColor: "#14B8A6",
//               color: "white",
//               "&:hover": { backgroundColor: "#EAB308" },
//             }}
//           >
//             Clear
//           </Button>
//         </Box>
//       </form>

//       {/* Snackbar Notification */}
//       <Snackbar
//         open={openSnackbar}
//         autoHideDuration={3000}
//         onClose={() => setOpenSnackbar(false)}
//       >
//         <Alert
//           onClose={() => setOpenSnackbar(false)}
//           severity={snackbarSeverity}
//           sx={{ width: "100%" }}
//         >
//           {snackbarMessage}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default InventoryForm;

// //Work with insert data

// // import {
// //   Box,
// //   Button,
// //   TextField,
// //   useMediaQuery,
// //   Snackbar,
// //   Alert,
// // } from "@mui/material";
// // import { useFormik } from "formik";
// // import { supabase } from "../supabaseClient"; // Import Supabase client
// // import { useState } from "react";

// // const InventoryForm = () => {
// //   const isNonMobile = useMediaQuery("(min-width:600px)");

// //   const [openSnackbar, setOpenSnackbar] = useState(false);
// //   const [snackbarMessage, setSnackbarMessage] = useState("");
// //   const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // success, error, warning

// //   const colorForm = {
// //     inputColor: "#ADD8E6", // Green
// //     labelColor: "#C0C0C0", // Orange
// //     helperTextColor: "#4287f5", // Blue
// //   };

// //   const formik = useFormik({
// //     initialValues: {
// //       item_name: "",
// //       category: "",
// //       unit: "",
// //       quantity: "",
// //       price_per_unit: "",
// //       total_cost: "",
// //       supplier: "",
// //       supplier_id: "",
// //     },

// //     onSubmit: async (values, { resetForm }) => {
// //       console.log("Raw values before formatting:", values);

// //       const formattedValues = {
// //         ...values,
// //         price_per_unit: Number(values.price_per_unit) || 0,
// //         total_cost: Number(values.total_cost) || 0,
// //       };

// //       console.log("Formatted values before insert:", formattedValues);

// //       try {
// //         const response = await supabase
// //           .from("Inventory")
// //           .insert([formattedValues]);
// //         console.log("Supabase response:", response);

// //         if (response.error) {
// //           console.error("Insert Error:", response.error);
// //           setSnackbarMessage("Failed to save item. " + response.error.message);
// //           setSnackbarSeverity("error");
// //         } else {
// //           console.log("Insert Success:", response.data);
// //           setSnackbarMessage("Item saved successfully!");
// //           setSnackbarSeverity("success");
// //           resetForm();
// //         }
// //       } catch (err) {
// //         console.error("Unexpected Error:", err);
// //         setSnackbarMessage("An unexpected error occurred. " + err.message);
// //         setSnackbarSeverity("error");
// //       }

// //       setOpenSnackbar(true);
// //     },
// //   });

// //   return (
// //     <Box m="5px 20px">
// //       <form onSubmit={formik.handleSubmit}>
// //         <Box
// //           display="grid"
// //           gap="15px"
// //           gridTemplateColumns="repeat(4, minmax(0, 1fr))"
// //           sx={{
// //             "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
// //           }}
// //         >
// //           {[
// //             { label: "Item name", name: "item_name", span: 4 },
// //             { label: "Category", name: "category", span: 2 },
// //             { label: "Unit", name: "unit", span: 1 },
// //             { label: "Quantity", name: "quantity", span: 1 },
// //             { label: "Price per unit (€)", name: "price_per_unit", span: 2 },
// //             { label: "Total Cost (€)", name: "total_cost", span: 2 },
// //             { label: "Supplier", name: "supplier", span: 3 },
// //             { label: "Supplier ID", name: "supplier_id", span: 1 },
// //           ].map(({ label, name, span }) => (
// //             <TextField
// //               key={name}
// //               fullWidth
// //               variant="filled"
// //               label={label}
// //               name={name}
// //               value={
// //                 name === "total_cost"
// //                   ? `€ ${new Intl.NumberFormat("en-US", {
// //                       minimumFractionDigits: 2,
// //                       maximumFractionDigits: 2,
// //                     }).format(parseFloat(formik.values[name] || 0))}`
// //                   : formik.values[name]
// //               }
// //               onChange={(e) => {
// //                 let { name, value } = e.target;

// //                 if (name === "price_per_unit" || name === "quantity") {
// //                   value = value.replace(/[^0-9.]/g, ""); // Allow only numbers & dot

// //                   // Prevent multiple dots
// //                   if ((value.match(/\./g) || []).length > 1) return;

// //                   formik.setFieldValue(name, value); // Save user input

// //                   // Convert to numbers for calculation
// //                   const quantity =
// //                     parseFloat(
// //                       name === "quantity" ? value : formik.values.quantity
// //                     ) || 0;
// //                   const pricePerUnit =
// //                     parseFloat(
// //                       name === "price_per_unit"
// //                         ? value
// //                         : formik.values.price_per_unit
// //                     ) || 0;

// //                   const totalCost = quantity * pricePerUnit;
// //                   formik.setFieldValue("total_cost", totalCost.toFixed(2)); // Update total_cost
// //                 } else {
// //                   formik.handleChange(e);
// //                 }
// //               }}
// //               onBlur={(e) => {
// //                 let { name, value } = e.target;

// //                 if (name === "price_per_unit") {
// //                   // Format price_per_unit only when focus is lost
// //                   const formattedValue = parseFloat(value || 0).toFixed(2);
// //                   formik.setFieldValue(name, formattedValue);
// //                 }
// //               }}
// //               error={formik.touched[name] && Boolean(formik.errors[name])}
// //               helperText={formik.touched[name] && formik.errors[name]}
// //               sx={{
// //                 gridColumn: `span ${span}`,
// //                 "& .MuiInputBase-input": {
// //                   color: colorForm.inputColor,
// //                   fontSize: "20px",
// //                 },
// //                 "& .MuiInputLabel-root": { color: colorForm.labelColor },
// //                 "& .MuiFormHelperText-root": {
// //                   color: colorForm.helperTextColor,
// //                   transition: "color 0.3s ease",
// //                 },
// //                 "&:focus-within .MuiFormHelperText-root": {
// //                   color: "#FFD700", // Change this to your desired focus color
// //                 },
// //                 "& .MuiInputBase-root": {
// //                   backgroundColor: "#384152",
// //                   transition: "background-color 0.3s ease",
// //                   "&:hover": { backgroundColor: "#4a5568" },
// //                 },
// //               }}
// //               slotProps= {name === "total_cost" ? { readOnly: true } : {}}
// //             />
// //           ))}
// //         </Box>
// //         <Box
// //           display="grid"
// //           gap="15px"
// //           gridTemplateColumns="repeat(4, minmax(0, 1fr))"
// //           sx={{
// //             "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
// //             pt: 2,
// //           }}
// //         >
// //           {/* Insert Button */}
// //           <Button
// //             type="submit"
// //             color="secondary"
// //             variant="contained"
// //             sx={{
// //               backgroundColor: "#14B8A6",
// //               color: "white",
// //               "&:hover": { backgroundColor: "#45b344" },
// //             }}
// //           >
// //             Insert
// //           </Button>

// //           {/* Update Button */}
// //           <Button
// //             type="button"
// //             color="secondary"
// //             variant="contained"
// //             sx={{
// //               backgroundColor: "#14B8A6",
// //               color: "white",
// //               "&:hover": { backgroundColor: "#6366F1" },
// //             }}
// //           >
// //             Update
// //           </Button>

// //           {/* Delete Button */}
// //           <Button
// //             type="button"
// //             color="secondary"
// //             variant="contained"
// //             sx={{
// //               backgroundColor: "#14B8A6",
// //               color: "white",
// //               "&:hover": { backgroundColor: "#F97316" },
// //             }}
// //           >
// //             Delete
// //           </Button>

// //           {/* Clear Button */}
// //           <Button
// //             type="button"
// //             color="secondary"
// //             variant="contained"
// //             onClick={() => formik.resetForm()} // Reset form fields
// //             sx={{
// //               backgroundColor: "#14B8A6",
// //               color: "white",
// //               "&:hover": { backgroundColor: "#EAB308" },
// //             }}
// //           >
// //             Clear
// //           </Button>
// //         </Box>
// //       </form>

// //       {/* Snackbar Notification */}
// //       <Snackbar
// //         open={openSnackbar}
// //         autoHideDuration={3000}
// //         onClose={() => setOpenSnackbar(false)}
// //       >
// //         <Alert
// //           onClose={() => setOpenSnackbar(false)}
// //           severity={snackbarSeverity}
// //           sx={{ width: "100%" }}
// //         >
// //           {snackbarMessage}
// //         </Alert>
// //       </Snackbar>
// //     </Box>
// //   );
// // };

// // export default InventoryForm;

// // import React from "react";
// // import { Box, Button, TextField, Snackbar, Alert } from "@mui/material";
// // import { useFormik } from "formik";
// // import { supabase } from "../supabaseClient";
// // import { useMediaQuery } from "@mui/material";

// // const InventoryForm = () => {
// //     const [openSnackbar, setOpenSnackbar] = React.useState(false);
// //     const [snackbarMessage, setSnackbarMessage] = React.useState("");
// //     const [snackbarSeverity, setSnackbarSeverity] = React.useState("success");

// //     // Media query for responsive design
// //     const isMobile = useMediaQuery("(max-width:600px)");

// //     // Formik setup
// //     const formik = useFormik({
// //         initialValues: {
// //             name: "",
// //             email: "",
// //         },
// //         validate: (values) => {
// //             const errors = {};
// //             if (!values.name) errors.name = "Name is required";
// //             if (!values.email) errors.email = "Email is required";
// //             return errors;
// //         },
// //         onSubmit: async (values) => {
// //             try {
// //                 // Insert data into Supabase table
// //                 const { data, error } = await supabase
// //                     .from("users")
// //                     .insert([
// //                         {
// //                             name: values.name,
// //                             email: values.email,
// //                         },
// //                     ]);

// //                 if (error) {
// //                     throw new Error(error.message);
// //                 }

// //                 // On success
// //                 setSnackbarMessage("Form submitted successfully!");
// //                 setSnackbarSeverity("success");
// //                 setOpenSnackbar(true);
// //                 formik.resetForm();
// //             } catch (error) {
// //                 // On error
// //                 setSnackbarMessage(error.message);
// //                 setSnackbarSeverity("error");
// //                 setOpenSnackbar(true);
// //             }
// //         },
// //     });

// //     return (
// //         <Box
// //             display="flex"
// //             flexDirection="column"
// //             alignItems="center"
// //             justifyContent="center"
// //             sx={{ maxWidth: 400, margin: "auto", padding: 2 }}
// //         >
// //             <form onSubmit={formik.handleSubmit} style={{ width: "100%" }}>
// //                 <TextField
// //                     fullWidth
// //                     label="Name"
// //                     name="name"
// //                     value={formik.values.name}
// //                     onChange={formik.handleChange}
// //                     onBlur={formik.handleBlur}
// //                     error={formik.touched.name && Boolean(formik.errors.name)}
// //                     helperText={formik.touched.name && formik.errors.name}
// //                     margin="normal"
// //                     variant="outlined"
// //                 />
// //                 <TextField
// //                     fullWidth
// //                     label="Email"
// //                     name="email"
// //                     value={formik.values.email}
// //                     onChange={formik.handleChange}
// //                     onBlur={formik.handleBlur}
// //                     error={formik.touched.email && Boolean(formik.errors.email)}
// //                     helperText={formik.touched.email && formik.errors.email}
// //                     margin="normal"
// //                     variant="outlined"
// //                 />
// //                 <Button
// //                     fullWidth
// //                     variant="contained"
// //                     color="primary"
// //                     type="submit"
// //                     sx={{ marginTop: 2 }}
// //                 >
// //                     Submit
// //                 </Button>
// //             </form>

// //             {/* Snackbar for notifications */}
// //             <Snackbar
// //                 open={openSnackbar}
// //                 autoHideDuration={3000}
// //                 onClose={() => setOpenSnackbar(false)}
// //             >
// //                 <Alert
// //                     onClose={() => setOpenSnackbar(false)}
// //                     severity={snackbarSeverity}
// //                     sx={{ width: "100%" }}
// //                 >
// //                     {snackbarMessage}
// //                 </Alert>
// //             </Snackbar>
// //         </Box>
// //     );
// // };

// // export default InventoryForm;
