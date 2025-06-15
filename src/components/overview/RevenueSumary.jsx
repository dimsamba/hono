import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
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
    <div>
      <h2 className="text-lg font-medium mb-4 text-[#3FA89B]">
        MONTHLY NET PROFIT
      </h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid stroke="lightGray" strokeDasharray="3 3" />
            <XAxis dataKey="month" stroke="dimGray" />
            <YAxis stroke="dimGray" />
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
              payload={[
                { value: "Gross Revenue", type: "triangle", color: "#ff006e" },
                { value: "Net Profit", type: "triangle", color: "#00afb9" },
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

            <Bar
              dataKey="total_revenue"
              fill="#FF9AA2"
              barSize={30}
              label={({ x, y, value }) => (
                <text
                  x={x + 15}
                  y={y - 10}
                  fill="#333"
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
              fill="#A0E7E5"
              barSize={30}
              label={({ x, y, value }) => (
                <text
                  x={x + 15}
                  y={y - 10}
                  fill="#333"
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
    </div>
  );
};

export default RevenueSummary;
