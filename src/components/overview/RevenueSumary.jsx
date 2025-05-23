import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import supabase from "../supabaseClient";

const RevenueSummary = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("financials")
        .select("net_profit, total_revenue, date_to");

      if (error) {
        console.error("Error fetching financials:", error.message);
        return;
      }

      // Group by month
      const monthMap = {};
      data.forEach(({ net_profit, total_revenue, date_to }) => {
        const date = new Date(date_to);
        const key = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!monthMap[key]) {
          monthMap[key] = { net_profit: 0, total_revenue: 0 };
        }

        monthMap[key].net_profit += net_profit || 0;
        monthMap[key].total_revenue += total_revenue || 0;
      });

      const formatted = Object.entries(monthMap)
        .map(([month, { net_profit, total_revenue }]) => ({
          month,
          net_profit,
          total_revenue,
        }))
        .sort((a, b) => new Date(a.month) - new Date(b.month));

      setChartData(formatted);
    };

    fetchData();
  }, []);

  return (
    <motion.div
      className="bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 lg:col-span-2 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <h2 className="text-lg font-medium mb-4 text-gray-100">
        Monthly Net Profit
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid stroke="#4B5563" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="lightGray" />
            <YAxis stroke="lightGray" />
            <Tooltip
              cursor={false}
              formatter={(value, name) => [
                `€${value.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`,
                name === "net_profit"
                  ? "Net Profit"
                  : name === "total_revenue"
                  ? "Gross Revenue"
                  : name,
              ]}
              contentStyle={{
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                borderColor: "#4B5563",
              }}
              itemStyle={{ color: "#E5E7EB" }}
            />
            <Legend
              formatter={(value) => {
                if (value === "total_revenue") return "Gross Revenue";
                if (value === "net_profit") return "Net Profit";
                return value;
              }}
            />

            <Bar
              dataKey="total_revenue"
              fill="#ff9f1c"
              barSize={30}
              label={({ x, y, value }) => (
                <text
                  x={x + 15}
                  y={y - 10}
                  fill="lightGray"
                  fontSize={12}
                  textAnchor="right"
                >
                  {`€${value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </text>
              )}
            />
            <Bar
              dataKey="net_profit"
              fill="#00afb9"
              barSize={30}
              label={({ x, y, value }) => (
                <text
                  x={x + 15}
                  y={y - 10}
                  fill="lightGray"
                  fontSize={12}
                  textAnchor="right"
                >
                  {`€${value.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
                </text>
              )}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default RevenueSummary;
