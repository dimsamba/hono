import { motion } from "framer-motion";
import { useTheme, useMediaQuery, Box } from "@mui/material";
import { tokens } from "../components/theme";
import StatCard from "../components/common/StatCard";
import MoneyOffCsredIcon from "@mui/icons-material/MoneyOffCsred";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import supabase from "../components/supabaseClient";
import React, { useState, useEffect } from "react";
import FullFeaturedCrudGrid from "../components/invoices/InvoiceData";

// ✅ Import Supabase
const invoicePaga = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [invoicesData, setInvoiceData] = useState([]); // ✅ Define state
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [refreshKey, setRefreshKey] = useState(0); // used to force re-render
  const today = new Date();

  // Function to fetch inventory data from Supabase
  const fetchData = async () => {
    const { data, error } = await supabase.from("invoices").select("*");
    if (error) {
      console.error("Error fetching Invoices:", error);
    } else {
      setInvoiceData(data); // ✅ Update state
    }
  };

  useEffect(() => {
    fetchData(); // ✅ Fetch Invoices data when the page loads
  }, []);

  const handleInvoiceChange = () => {
    fetchData(); // ✅ Correct function name
    setRefreshKey((prev) => prev); // ✅ Also force StatCard re-render
  };

  // Function for Progressive Circle
  const totalInvoices = invoicesData.length;
  const unpaidInvoices = invoicesData.filter((inv) => !inv.paid);
  const unpaid =
    totalInvoices > 0
      ? (unpaidInvoices.length / totalInvoices).toFixed(2)
      : "0";

  // Function for Progressive Circle (due in 7 days only)
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7); // not +8 here

  const dueSoonInvoices = invoicesData.filter((inv) => {
    const invDate = new Date(inv.invoice_date);
    return !inv.paid && invDate >= now && invDate <= in7Days;
  });

  const unpaidDueSoon =
    totalInvoices > 0
      ? (dueSoonInvoices.length / totalInvoices).toFixed(2)
      : "0";

  console.log(
    invoicesData.filter((inv) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const invDate = new Date(inv.invoice_date);
      invDate.setHours(0, 0, 0, 0);
      return !inv.paid && invDate < today;
    })
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Box
            display="grid"
            gap="15px"
            gridTemplateColumns="repeat(2, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 4" },
            }}
          >
            <StatCard
              icon={
                <MoneyOffCsredIcon
                  sx={{ color: "#38a3a5", fontSize: "26px" }}
                />
              }
              key={refreshKey} // 👈 triggers re-render when key changes
              title={"Due in 7 days"}
              value={(() => {
                const now = new Date();
                const in7Days = new Date();
                in7Days.setDate(now.getDate() + 8);

                const dueInvoices = invoicesData.filter((inv) => {
                  const invDate = new Date(inv.invoice_date);
                  return !inv.paid && invDate >= now && invDate <= in7Days;
                });

                const totalAmount = dueInvoices.reduce((sum, inv) => {
                  const amount = parseFloat(inv.amount_ttc) || 0;
                  return sum + amount;
                }, 0);

                return `€ ${formatCurrency(totalAmount)}`;
              })()}
              subtitle={`${
                invoicesData.filter((inv) => {
                  const today = new Date();
                  const in7Days = new Date();
                  in7Days.setDate(today.getDate() + 8);

                  // Strip time from dates for accurate comparison
                  const normalizeDate = (d) =>
                    new Date(d.getFullYear(), d.getMonth(), d.getDate());

                  const invDate = normalizeDate(new Date(inv.invoice_date));
                  const start = normalizeDate(today);
                  const end = normalizeDate(in7Days);

                  return !inv.paid && invDate >= start && invDate <= end;
                }).length
              }/${invoicesData.length} Due in 7 days`}
              increase={` ${formatCurrency(unpaidDueSoon * 100)}%`}
              progress={unpaidDueSoon}
              sx={{
                gridColumn: "span 1",
              }}
            />

            <StatCard
              icon={
                <MoneyOffIcon sx={{ color: "#38a3a5", fontSize: "26px" }} />
              }
              key={refreshKey} // 👈 triggers re-render when key changes
              title={`${invoicesData.filter((inv) => !inv.paid).length}/${
                invoicesData.length
              } Unpaid Invoices`}
              subtitleRed={`${
                invoicesData.filter((inv) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const invDate = new Date(inv.invoice_date);
                  invDate.setHours(0, 0, 0, 0);
                  return !inv.paid && invDate < today;
                }).length
              }/${invoicesData.length} Overdue – Total: € ${formatCurrency(
                invoicesData
                  .filter((inv) => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const invDate = new Date(inv.invoice_date);
                    invDate.setHours(0, 0, 0, 0);
                    return !inv.paid && invDate < today;
                  })
                  .reduce((acc, curr) => acc + (curr.amount_ttc || 0), 0)
                  .toFixed(2)
              )}`}
              value={`Total ${(() => {
                const unpaidInvoices = invoicesData.filter((inv) => !inv.paid);

                const totalAmount = unpaidInvoices.reduce((sum, inv) => {
                  const amount = parseFloat(inv.amount_ttc) || 0;
                  return sum + amount;
                }, 0);

                return `€ ${formatCurrency(totalAmount)}`;
              })()}`}
              increase={` ${formatCurrency(unpaid * 100)}%`}
              progress={unpaid}
              sx={{
                gridColumn: "span 1",
              }}
            />
          </Box>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* <InvoiceData /> */}
          <FullFeaturedCrudGrid
            InvoiceData={invoicesData}
            onInvoiceChange={handleInvoiceChange}
          />
        </motion.div>

        {/* ✅ Pass fetchData to the form so it refreshes after insert */}
        <motion.div
          className="grid grid-cols-1 gap-0 sm:grid-cols-1 lg:grid-cols-1 mb-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {/* <InventoryForm fetchData={fetchData} /> */}
        </motion.div>
      </main>
    </div>
  );
};

export default invoicePaga;
