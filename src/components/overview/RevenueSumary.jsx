import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import supabase from "../supabaseClient";
import { color } from "framer-motion";
import { mt } from "date-fns/locale";

const RevenueSummary = () => {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("financials")
        .select("net_profit, total_revenue, date_to, cost_perc");

      if (error) {
        console.error("Error fetching financials:", error.message);
        return;
      }

      // Group by month
      const monthMap = {};
      data.forEach(({ net_profit, total_revenue, date_to, cost_perc }) => {
        const date = new Date(date_to);
        const key = date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        });

        if (!monthMap[key]) {
          monthMap[key] = { net_profit: 0, total_revenue: 0, cost_perc: 0 };
        }

        monthMap[key].net_profit += net_profit || 0;
        monthMap[key].total_revenue += total_revenue || 0;
        monthMap[key].cost_perc += cost_perc || 0;
      });

      const formatted = Object.entries(monthMap)
        .map(([month, { net_profit, total_revenue, cost_perc }]) => ({
          month,
          net_profit,
          total_revenue,
          cost_perc,
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
          <BarChart
            data={chartData}
            syncId="barSync"
            width="100%"
            height="100%"
            margin={{ top: 0, right: 0, left: 20, bottom: 0 }}
          >
            <CartesianGrid stroke="lightGray" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              stroke="#333"
              tick={{ fontSize: 12 }}
              tickLine={false}
            />
            <YAxis yAxisId="left" stroke="dimGray" />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#00afb9"
              domain={[0, 100]} // Because it's a percentage
              tickFormatter={(value) => `${value}%`}
            />

            <Tooltip
              cursor={false}
              formatter={(value, name) => {
                const formattedValue =
                  name === "cost_perc"
                    ? `${value.toFixed(2)}%`
                    : `€${value.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`;

                const displayName =
                  name === "net_profit"
                    ? "Net Profit"
                    : name === "total_revenue"
                    ? "Gross Revenue"
                    : name === "cost_perc"
                    ? "Cost Percentage"
                    : name;

                return [formattedValue, displayName];
              }}
              contentStyle={{
                backgroundColor: "#f3f4f6",
                borderColor: "#4B5563",
              }}
              itemStyle={{ color: "#111" }}
              sx={{
                "& .recharts-layer recharts-label-list": {
                  fontSize: "25px",
                },
              }}
            />
            <Legend
              payload={[
                { value: "Gross Revenue", type: "triangle", color: "#fb6f92" },
                { value: "Net Profit", type: "triangle", color: "#00afb9" },
                {
                  value: "Cost Percentage",
                  type: "triangle",
                  color: "#adc178",
                },
              ]}
              align="right"
              formatter={(value) => {
                return (
                  <span style={{ color: "#333", fontSize: "14px" }}>
                    {value}
                  </span>
                );
              }}
            />
            <Bar
              dataKey="cost_perc"
              fill="#adc178"
              barSize={30}
              yAxisId="right"
              label={({ x, y, value }) => (
                <text
                  x={x - 10}
                  y={y - 5}
                  fill="#333"
                  fontSize={12}
                  textAnchor="right"
                  sx={{ backgroundColor: "#333" }}
                >
                  {`${value.toFixed(2)}%`}
                </text>
              )}
            />

            <Bar
              dataKey="total_revenue"
              fill="#fb6f92"
              barSize={30}
              yAxisId="left"
              label={({ x, y, value }) => (
                <text
                  x={x + 1}
                  y={y - 5}
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
              fill="#00afb9"
              barSize={30}
              yAxisId="left"
              label={({ x, y, value }) => (
                <text
                  x={x + 1}
                  y={y - 5}
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
