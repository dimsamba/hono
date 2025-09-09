import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import supabase from "../supabaseClient"; // adjust path if needed

const COLORS = [
  "#FFB5E8", // pastel pink
  "#B28DFF", // pastel purple
  "#A0E7E5", // pastel cyan
  "#C3F584", // pastel green
  "#FFDAC1", // pastel peach
  "#FFABAB", // pastel red
  "#D5AAFF", // light lavender
  "#FFD6E0", // light rose
  "#B5EAD7", // soft mint
  "#FF9AA2", // soft pink-red
  "#E2F0CB", // light lime
  "#C7CEEA", // light periwinkle
  "#FBE7C6", // soft cream
  "#FFF5BA", // pastel yellow
  "#AEC6CF", // pastel blue-gray
];

const SalesCategory = () => {
  const [categoryData, setCategoryData] = useState([]);

  //Fetch from sales table
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("sales").select("items");

      if (error) {
        console.error("Error fetching sales data:", error.message);
        return;
      }

      const itemCounts = {};

      data.forEach(({ items }) => {
        if (items) {
          let parsedItems;

          try {
            // Supabase might return items already as an object, or as a JSON string
            parsedItems = typeof items === "string" ? JSON.parse(items) : items;
          } catch (e) {
            console.error("Error parsing item JSON:", e);
            return;
          }

          parsedItems.forEach(({ name, quantity }) => {
            if (!name || !quantity) return;
            itemCounts[name] = (itemCounts[name] || 0) + Number(quantity);
          });
        }
      });

      const total = Object.values(itemCounts).reduce(
        (sum, val) => sum + val,
        0
      );

      const formatted = Object.entries(itemCounts).map(([name, value]) => ({
        name,
        value,
        percent: ((value / total) * 100).toFixed(1),
      }));

      setCategoryData(formatted);
    };

    fetchData();
  }, []);

  // Sort Function
  const sortedCategoryData = [...categoryData].sort(
    (a, b) => b.value - a.value
  );

  return (
    <motion.div className="bg-gray-100 bg-opacity-50 backdrop-blur-md rounded-xl p-6 border border-gray-100">
      <h2 className="text-lg font-medium mb-4 text-[#3FA89B]">ITEMS SOLD</h2>
      <div className="w-full h-full">
        <ResponsiveContainer
          width="100%"
          height={sortedCategoryData.length * 25 + 10}
        >
          <BarChart
            data={sortedCategoryData}
            layout="vertical"
            height={sortedCategoryData.length * 40}
            margin={{ top: 1, right: 50, left: 5, bottom: 1 }}
          >
            <CartesianGrid strokeMiterlimit="1 1" stroke="#edf2fb" />
            <XAxis type="number" stroke="dimGray" />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#111"
              interval={0}
              width={140}
              style={{ fontSize: 12, fill: "#111" }}
              tickLine={false}
            />

            <Tooltip
              cursor={true}
              contentStyle={{
                backgroundColor: "#f3f4f6",
                borderColor: "#4B5563",
              }}
              itemStyle={{ color: "dimGray" }}
              formatter={(value) => [` ${""}: ${value} sales`]}
            />

            <Bar
              dataKey="value"
              barSize={12}
              isAnimationActive={true}
              height={sortedCategoryData.length * 40}
            >
              {sortedCategoryData.map((_entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
              <LabelList
                content={(props) => {
                  const { x, y, width, height, index } = props;
                  const percent = sortedCategoryData[index]?.percent;
                  return (
                    <text
                      x={x + width + 5}
                      y={y + height / 1.5}
                      fill="#555"
                      fontSize={14}
                      dominantBaseline="middle"
                    >
                      {`${percent}%`}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default SalesCategory;
