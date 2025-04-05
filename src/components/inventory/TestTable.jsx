import React from "react";
import supabase from "../supabaseClient";

const TestTable = async () => {
  try {
    const { data, error } = await supabase
    .from("inventory")
    .insert({
      item_name: "Avocado",
      category: "Fruits",
      unit: "pc",
      quantity: 24, // Should be a number, not a string
      price_per_unit: 3.12, // Should be a number
      total_cost: 75.12, // Should be a number
      supplier: "Brasil",
      date: "2025-03-12", // Changed from "data" to "date"
    })
    .select();

    if (error) {
      console.log("Supabase Error:", error);
    } else {
      console.log(data);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
};
const InventoryButton = () => {
  return <button onClick={insertInvtory}>Insert Inventory</button>;
};

export default TestTable;
