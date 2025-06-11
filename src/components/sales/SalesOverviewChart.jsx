import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useState, useEffect } from "react";
import supabase from "../supabaseClient";

const SalesOverviewChart = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState("This Year");
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchChartData();
  }, [selectedTimeRange]);

  const fetchChartData = async () => {
    const now = new Date();

    // 1) Pull both tables in parallel
    const [
      { data: sales, error: salesError },
      { data: invoices, error: invError },
    ] = await Promise.all([
      supabase.from("sales").select("date, sale_total_disc"),
      supabase.from("invoices").select("invoice_date, amount_ttc"),
    ]);

    if (salesError || invError) {
      console.error("Error fetching:", salesError || invError);
      return;
    }

    // 2) A helper to filter by selectedTimeRange
    const inRange = (dateStr) => {
      const d = new Date(dateStr);
      if (selectedTimeRange === "This Week") {
        const start = new Date(now);
        start.setDate(now.getDate() - now.getDay());
        return d >= start;
      }
      if (selectedTimeRange === "This Month") {
        return d >= new Date(now.getFullYear(), now.getMonth(), 1);
      }
      if (selectedTimeRange === "This Quarter") {
        const m = now.getMonth();
        const qStart = m - (m % 3);
        return d >= new Date(now.getFullYear(), qStart, 1);
      }
      // This Year
      return d >= new Date(now.getFullYear(), 0, 1);
    };

    // 3) Filter each set
    const filteredSales = sales.filter((s) => inRange(s.date));
    const filteredInvoices = invoices.filter((i) => inRange(i.invoice_date));

    if (!filteredSales.length && !filteredInvoices.length) {
      setChartData([]);
      return;
    }

    // 4) Build monthMap with keys YYYY-MM ➔ { sales: 0, expenses: 0 }
    let start,
      end = new Date(); // always end at “now”

    if (selectedTimeRange === "This Week") {
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
    } else if (selectedTimeRange === "This Month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (selectedTimeRange === "This Quarter") {
      const m = now.getMonth();
      start = new Date(now.getFullYear(), m - (m % 3), 1);
    } else {
      // "This Year"
      start = new Date(now.getFullYear(), 0, 1);
    }

    const monthMap = new Map();
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const key = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}`;
      monthMap.set(key, { sales: 0, expenses: 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }

    // 5) Sum sales
    filteredSales.forEach(({ date, sale_total_disc }) => {
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const rec = monthMap.get(key);
      if (rec) rec.sales += parseFloat(sale_total_disc) || 0;
    });

    // 6) Sum expenses
    filteredInvoices.forEach(({ invoice_date, amount_ttc }) => {
      const d = new Date(invoice_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}`;
      const rec = monthMap.get(key);
      if (rec) rec.expenses += parseFloat(amount_ttc) || 0;
    });

    // 7) Format for recharts
    const formatted = Array.from(monthMap.entries())
      .map(([ym, { sales, expenses }]) => {
        const [y, m] = ym.split("-");
        const dt = new Date(y, m - 1);
        return {
          month: dt.toLocaleString("default", {
            month: "short",
            year: "2-digit",
          }),
          sales,
          expenses,
          orderKey: ym,
        };
      })
      .sort((a, b) => a.orderKey.localeCompare(b.orderKey));

    setChartData(formatted);
  };

  return (
    <motion.div className="bg-gray-100 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-6 w-full">
        <h2 className="text-lg mb-4 text-[#3FA89B] font-medium">
          SALES VS. EXPENSES
        </h2>
        <select
          className="bg-gray-200 text-[#111] rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green-500"
          value={selectedTimeRange}
          onChange={(e) => setSelectedTimeRange(e.target.value)}
        >
          <option>This Year</option>
          <option>This Quarter</option>
          <option>This Month</option>
          <option>This Week</option>
        </select>
      </div>

      <div className="h-80">
        <ResponsiveContainer width={"100%"} height={"100%"}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="month" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              cursor={false}
              formatter={(value, name) => [
                `€${value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                name === "value" ? "Net Profit" : name,
              ]}
              contentStyle={{
                backgroundColor: "#f3f4f6",
                borderColor: "#4B5563",
              }}
              itemStyle={{ color: "#111" }}
            />
            <Legend
              payload={[
                { value: "Expenses", type: "triangle", color: "#ff006e" },
                { value: "Sales", type: "triangle", color: "#00afb9" },
              ]}
              align="right"
              formatter={(value) => {
                return (
                  <span style={{ color: "#444", fontSize: "14px" }}>
                    {value}
                  </span>
                );
              }}
            />

            {/* Sales */}

            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke="#ff006e"
              fill="#ff006e"
              fillOpacity={0.3}
            />
            <Area
              type="monotone"
              dataKey="sales"
              name="Sales"
              stroke="#edf6f9"
              fill="#00afb9"
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SalesOverviewChart;
