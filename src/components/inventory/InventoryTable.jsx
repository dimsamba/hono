import { motion } from "framer-motion";
import { Edit, Trash2 } from "lucide-react";
import { tokens } from "../theme";
import { useState, useEffect } from "react";
import supabase from "../supabaseClient";
import { DataGrid, GridToolbar } from "@mui/x-data-grid"; // ✅ Import MUI DataGrid
import { useTheme } from "@mui/material";

const InventoryTable = () => {
  const [products, setProducts] = useState([]);
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("inventory").select("*");

      if (error) {
        console.error("Error fetching data:", error.message);
      } else {
        setProducts(data);
      }
    };

    fetchData();
  }, []);

  // ✅ Define Columns for DataGrid
  const columns = [
    {
      field: "item_name",
      headerName: "Item",
      align: "left",
      minWidth: 120,
      flex: 1,
    },
    {
      field: "category",
      headerName: "Category",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "unit",
      headerName: "Unit",
      minWidth: 50,
      flex: 0.5,
    },
    {
      field: "quantity",
      headerName: "Qty",
      minWidth: 60,
      type: "number",
      flex: 0.5,
    },
    {
      field: "price_per_unit",
      headerName: "$ Unit",
      align: "right",
      minWidth: 80,
      type: "number",
      flex: 0.5,
    },
    {
      field: "total_cost",
      headerName: "Cost ($)",
      minWidth: 80,
      type: "number",
      flex: 0.5,
    },
    {
      field: "supplier",
      headerName: "Supplier",
      minWidth: 100,
      flex: 1,
    },
    {
      field: "supplier_id",
      headerName: "Sp ID",
      align: "center",
      headerAlign: "center",
      minWidth: 80,
      flex: 1,
    },
    {
      field: "actions",
      headerName: "Edit / Delee",
      minWidth: 80,
      headerAlign: "left",
      align: "right",
      sortable: false,
      flex: 1,
      renderCell: () => (
        <div className="flex gap-4">
          <button className="text-indigo-300 hover:text-indigo-300">
            <Edit size={18} />
          </button>
          <button className="text-red-400 hover:text-red-300">
            <Trash2 size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700 mb-1  scrollbar-hide scrollbar-none"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="text-xl font-semibold text-gray-100 mb-2">Product List</h2>

      <div className="overflow-x-auto max-h-[500px] scrollbar-hide scrollbar-none p-0">
        <DataGrid
          rows={products}
          columns={columns}
          getRowId={(row) => row.id} // Ensure correct row ID
          checkboxSelection
          slots={{ toolbar: GridToolbar }}
          sx={{
            height: "500px",
            scrollbarWidth: "0px",
            // Table border
            border: "none",
            "& .MuiDataGrid-scrollbar": {
              scrollbarWidth: "none",
            },
            "& .MuiDataGrid-columnHeader": {
              // Header Customizations
              backgroundColor: colors.greenAccent[600],
              color: `${colors.grey[100]} !important`,
              fontSize: 14,
              border: "none",
            },
            "& .MuiDataGrid-footerContainer": {
              //Footer Background color
              backgroundColor: `${colors.greenAccent[600]} !important`,
            },
            "& .MuiDataGrid-columnSeparator": {
              // Font Color for Header separator
              color: `${colors.greenAccent[600]} !important`,
            },
            "& .MuiButtonBase-root": {
              // Toolbar font color and vertical tick boxes
              color: `${colors.grey[200]} !important`,
            },
            "& .MuiDataGrid-toolbarContainer": {
              // Toolbar Items alignment
              ml: 1.5,
            },
            "& .MuiDataGrid-row:hover": {
              // Rows Hover effect bg color
              backgroundColor: `${colors.primary[300]} !important`,
              // Rows Hover effect font color
              color: `white`,
            },
            "& .MuiDataGrid-cell": {
              // Cell components alingment
              alignContent: "center",
              // Cell border color
              borderColor: `${colors.primary[300]} !important`,
              // Cell Font color
              color: `${colors.grey[200]} !important`,
              // Cell font size
              fontSize: 14,
            },
            "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
              // Toobar font color
              color: `${colors?.greenAccent?.[100] || "#E0E0E0"} !important`,
            },
          }}
        />
      </div>
    </motion.div>
  );
};

export default InventoryTable;
