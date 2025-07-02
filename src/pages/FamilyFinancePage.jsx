import StatCardBg from "../components/common/StatCardBg";
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

  // Function to fetch Family Finances data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("familyexpenses").select("*");
    if (error) {
      console.error("Error fetching Family Finances:", error);
    } else {
      setFFData(data); // ✅ Update state
    }
  };

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

  const totalAmountTTC = FamilyFinanceTable.reduce(
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
      <main className="max-w-7x1 mx-auto py-6 px-0 lg:px-8">
        {/* STATS */}
        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3"
        >
          <Box
            display="grid"
            gap="15px"
            gridTemplateColumns="repeat(4, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            }}
          >
            <StatCard
              // key={refreshKey} // 👈 triggers re-render when key changes
              // title={`Total € ${formatCurrency(totalAmountTTC)}`}
              // valueRed={(() => {
              //   const now = new Date();
              //   const in7Days = new Date();
              //   in7Days.setDate(now.getDate() + 8);

              //   const dueInvoices = FamilyFinanceTable.filter((inv) => {
              //     const invDate = new Date(inv.date);
              //     return !inv.amount && invDate >= now && invDate <= in7Days;
              //   });

              //   const totalAmount = dueInvoices.reduce((sum, inv) => {
              //     const amount = parseFloat(inv.amount) || 0;
              //     return sum + amount;
              //   }, 0);

              //   return `€ ${formatCurrency(totalAmount)}`;
              // })()}
              // subtitleRed={`${
              //   FamilyFinanceTable.filter((inv) => {
              //     const today = new Date();
              //     const in7Days = new Date();
              //     in7Days.setDate(today.getDate() + 8);

              //     // Strip time from dates for accurate comparison
              //     const normalizeDate = (d) =>
              //       new Date(d.getFullYear(), d.getMonth(), d.getDate());

              //     const invDate = normalizeDate(new Date(inv.date));
              //     const start = normalizeDate(today);
              //     const end = normalizeDate(in7Days);

              //     return !inv.paid && invDate >= start && invDate <= end;
              //   }).length
              // } Due in 7 days`}
              // subtitleRed2={`${
              //   FamilyFinanceTable.filter((inv) => {
              //     const today = new Date();
              //     today.setHours(0, 0, 0, 0);
              //     const invDate = new Date(inv.date);
              //     invDate.setHours(0, 0, 0, 0);
              //     return !inv.paid && invDate < today;
              //   }).length
              // } Overdue (€ ${formatCurrency(
              //   FamilyFinanceTable
              //     .filter((inv) => {
              //       const today = new Date();
              //       today.setHours(0, 0, 0, 0);
              //       const invDate = new Date(inv.date);
              //       invDate.setHours(0, 0, 0, 0);
              //       return !inv.paid && invDate < today;
              //     })
              //     .reduce((acc, curr) => acc + (curr.amount || 0), 0)
              //     .toFixed(2)
              // )})`}
            />

              <StatCard
              // key={refreshKey} // 👈 triggers re-render when key changes
              // title={`Total ${FamilyFinanceTable.length} Entries`}
              // valueRed={`${(() => {
              //   const unpaidInvoices = FamilyFinanceTable.filter((inv) => !inv.paid);

              //   const totalAmount = unpaidInvoices.reduce((sum, inv) => {
              //     const amount = parseFloat(inv.amount) || 0;
              //     return sum + amount;
              //   }, 0);

              //   return `€ ${formatCurrency(totalAmount)}`;
              // })()}`}
              // subtitleRed={`${FamilyFinanceTable.filter((inv) => !inv.paid).length}
              //  Unpaid Invoices`}
            />

            <StatCardBg
              // key={refreshKey} // 👈 triggers re-render when key changes
              // title={`Between Dates € ${formatCurrency(filteredTotalValue)}`}
              // value={`€ ${formatCurrency(filteredPaidValue)}`}
              // subtitle={`Paid`}
            />
             <StatCardBg
              // key={refreshKey} // 👈 triggers re-render when key changes
              // title={`Between Dates ${filteredRows.length} Entries`}
              // valueRed={`€ ${formatCurrency(filteredUnpaidValue)}`}
              // subtitleRed={`Unpaid`}
            />
          </Box>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0"
        >
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
