import StatCardBg from "../components/common/StatCardBg";
import { Box, useMediaQuery } from "@mui/material";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import StatCard from "../components/common/StatCard";
import FullFeaturedCrudGrid from "../components/invoices/InvoiceData";
import supabase from "../components/supabaseClient";

// ✅ Import Supabase
const invoicePaga = () => {
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const [invoicesData, setInvoiceData] = useState([]); // ✅ Define state
  const [refreshKey, setRefreshKey] = useState(); // used to force re-render
  const [, setFilteredRows] = useState([]);
  const [filteredTotalValue, setFilteredTotalValue] = useState(0);
  const [filteredPaidValue, setFilteredPaidValue] = useState(0);
  const [filteredUnpaidValue, setFilteredUnpaidValue] = useState(0);

  // Function to fetch invoices data from Supabase
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

  // Function for Progressive Circle (due in 7 days only)
  const now = new Date();
  const in7Days = new Date();
  in7Days.setDate(now.getDate() + 7); // not +8 here

  console.log(
    invoicesData.filter((inv) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const invDate = new Date(inv.invoice_date);
      invDate.setHours(0, 0, 0, 0);
      return !inv.paid && invDate < today;
    })
  );

  const totalAmountTTC = invoicesData.reduce(
    (sum, row) => sum + (row.amount_ttc || 0),
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
        <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-3">
          <Box
            display="grid"
            gap="15px"
            gridTemplateColumns="repeat(3, minmax(0, 1fr))"
            sx={{
              "& > div": { gridColumn: isNonMobile ? undefined : "span 3" },
            }}
          >
            <StatCard
              key={refreshKey} // 👈 triggers re-render when key changes
              title={`Overview`}
              value={`€${formatCurrency(totalAmountTTC)}`}
              subtitleRed={
                <span style={{ verticalAlign: "middle" }}>
                  <span
                    style={{
                      color: "#00747c",
                      fontSize: "18px",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    {(() => {
                      const now = new Date();
                      const in7Days = new Date();
                      in7Days.setDate(now.getDate() + 8);

                      // Normalize dates to ignore time
                      const normalizeDate = (d) =>
                        new Date(d.getFullYear(), d.getMonth(), d.getDate());

                      const start = normalizeDate(now);
                      const end = normalizeDate(in7Days);

                      const dueInvoices = invoicesData.filter((inv) => {
                        const invDate = normalizeDate(
                          new Date(inv.invoice_date)
                        );
                        return !inv.paid && invDate >= start && invDate <= end;
                      });

                      const totalAmount = dueInvoices.reduce((sum, inv) => {
                        const amount = parseFloat(inv.amount_ttc) || 0;
                        return sum + amount;
                      }, 0);

                      return `${dueInvoices.length} 
                     / €${formatCurrency(totalAmount)}`;
                    })()}
                    <span></span>
                  </span>{" "}
                  Due 7 days
                </span>
              }
              subtitleRed2={
                <span style={{ verticalAlign: "middle" }}>
                  <span
                    style={{
                      color: "#00747c",
                      fontSize: "18px",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    {
                      invoicesData.filter((inv) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const invDate = new Date(inv.invoice_date);
                        invDate.setHours(0, 0, 0, 0);
                        return !inv.paid && invDate < today;
                      }).length
                    }
                  </span>{" "}
                  <span
                    style={{
                      color: "#00747c",
                      fontSize: "18px",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    {" "}
                    / €
                    {formatCurrency(
                      invoicesData
                        .filter((inv) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const invDate = new Date(inv.invoice_date);
                          invDate.setHours(0, 0, 0, 0);
                          return !inv.paid && invDate < today;
                        })
                        .reduce((acc, curr) => acc + (curr.amount_ttc || 0), 0)
                    )}
                  </span>{" "}
                  Overdue
                </span>
              }
            />

            <StatCard
              key={refreshKey} // 👈 triggers re-render when key changes
              title={`Overview`}
              value={`${invoicesData.length} Entries`}
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
                    {(() => {
                      const paidInvoices = invoicesData.filter(
                        (inv) => inv.paid
                      );
                      const totalPaid = paidInvoices.reduce((sum, inv) => {
                        const amount = parseFloat(inv.amount_ttc) || 0;
                        return sum + amount;
                      }, 0);
                      return `${paidInvoices.length} / €${formatCurrency(
                        totalPaid
                      )}`;
                    })()}
                  </span>{" "}
                  Paid Invoices
                </span>
              }
              subtitleRed2={
                <span style={{ verticalAlign: "middle" }}>
                  <span
                    style={{
                      color: "#00747c",
                      fontSize: "18px",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    {invoicesData.filter((inv) => !inv.paid).length}
                    {" / "}
                    {(() => {
                      const unpaidInvoices = invoicesData.filter(
                        (inv) => !inv.paid
                      );

                      const totalAmount = unpaidInvoices.reduce((sum, inv) => {
                        const amount = parseFloat(inv.amount_ttc) || 0;
                        return sum + amount;
                      }, 0);

                      return `€${formatCurrency(totalAmount)}`;
                    })()}
                  </span>{" "}
                  Unpaid Invoices
                </span>
              }
            />

            <StatCardBg
              key={refreshKey} // 👈 triggers re-render when key changes
              title={`Filtered`}
              value={`€${formatCurrency(filteredTotalValue)}`}
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
                    €{formatCurrency(filteredPaidValue)}
                  </span>{" "}
                  Paid TTC
                </span>
              }
              subtitleRed2={
                <span style={{ verticalAlign: "middle" }}>
                  <span
                    style={{
                      color: "#00747c",
                      fontSize: "18px",
                      fontWeight: 500,
                      verticalAlign: "middle",
                    }}
                  >
                    €{formatCurrency(filteredUnpaidValue)}
                  </span>{" "}
                  Unpaid TTC
                </span>
              }
            />
          </Box>
        </motion.div>

        <motion.div className="grid grid-cols-1 gap-2 sm:grid-cols-1 lg:grid-cols-1 mb-0">
          {/* <InvoiceData /> */}
          <FullFeaturedCrudGrid
            InvoiceData={invoicesData}
            onInvoiceChange={handleInvoiceChange}
            onFilteredRowsChange={setFilteredRows}
            onTotalValueChange={setFilteredTotalValue}
            onPaidValueChange={setFilteredPaidValue}
            onUnpaidValueChange={setFilteredUnpaidValue}
          />
        </motion.div>
      </main>
    </div>
  );
};

export default invoicePaga;
