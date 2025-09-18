import { Box, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import StatCard from "../components/common/StatCard";
import FullFeaturedCrudGrid from "../components/familyFinance/FamilyFinanceTable";
import supabase from "../components/supabaseClient";

// ✅ Import Supabase
const FamilyFinancePage = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [FamilyFinanceTable, setFFData] = useState([]); // ✅ Define state
  const [refreshKey, setRefreshKey] = useState(); // used to force re-render
  const [filteredRows, setFilteredRows] = useState([]);
  const [filteredTotalValue, setFilteredTotalValue] = useState(0);
  const [fromDate, setFromDate] = useState(null); // e.g., new Date("2025-01-01")
  const [toDate, setToDate] = useState(null); // e.g., new Date("2025-01-31")

  // Function to fetch Family Finances data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("familyexpenses").select("*");
    if (error) {
      console.error("Error fetching Family Finances:", error);
    } else {
      setFFData(data); // ✅ Update state
    }
  };

  // total amount between dates

  useEffect(() => {
    fetchData(); // ✅ Fetch Family Finances data when the page loads
  }, []);

  const handleFFChange = () => {
    fetchData(); // ✅ Correct function name
    setRefreshKey((prev) => prev); // ✅ Also force StatCard re-render
  };

  // Function for Progressive Circle (due in 7 days only)
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7); // not +8 here

  console.log(
    FamilyFinanceTable.filter((inv) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const invDate = new Date(inv.date);
      invDate.setHours(0, 0, 0, 0);
      return !inv.amount && invDate < today;
    })
  );

  const totalAmount = FamilyFinanceTable.reduce(
    (sum, row) => sum + (row.amount || 0),
    0
  );

  // Customization for decimals and thousands separators
  const formatCurrency = (value) => {
    const validNumber = !isNaN(parseFloat(value)) && isFinite(value);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(validNumber ? parseFloat(value) : 0);
  };

  return (
    <div className="flex-1 overflow-auto relative z-10">
      <main className="max-w-7xl mx-auto py-6 px-4 lg:px-8">
        {/* STATS */}
        <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3">
          <Box
            display="grid"
            gap="15px"
            gridTemplateColumns="repeat(2, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            }}
          >
            <StatCard
              key={refreshKey} // 👈 triggers re-render when key changes
              title={`Grand Total`}
              value={` € ${formatCurrency(totalAmount)}`}
              subtitle={
                <span style={{ verticalAlign: "middle" }}>
                  <span
                    style={{
                      color: "#00747c",
                      fontSize: "18px",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    {FamilyFinanceTable.length} &nbsp;
                  </span>
                  Entries
                </span>
              }
            />
            <StatCard
              key={refreshKey}
              title={`Filtered Data (${filteredRows.length} entries)`}
              value={`€ ${formatCurrency(filteredTotalValue)}`}
            />
          </Box>
        </motion.div>

        <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0">
          {/* <FamilyFinanceTable /> */}
          <FullFeaturedCrudGrid
            FamilyFinanceTable={FamilyFinanceTable}
            onFFChange={handleFFChange}
            onFilteredRowsChange={setFilteredRows}
            onTotalValueChange={setFilteredTotalValue}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default FamilyFinancePage;
