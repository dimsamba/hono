import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
	LabelList,
	Cell
} from "recharts";
import supabase from "../supabaseClient"; // adjust path if needed

const COLORS = ["#ff9f1c", "#4cc9f0", "#f15bb5", "#EF4444", "#8338ec", "#f2cc8f", "#EF4444"];

const SalesCategory = () => {
	const [categoryData, setCategoryData] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			const { data, error } = await supabase.from("sales").select("item_name");

			if (error) {
				console.error("Error fetching sales data:", error.message);
				return;
			}

			// Group by item_name
			const counts = {};
			data.forEach(({ item_name }) => {
				if (item_name) {
					counts[item_name] = (counts[item_name] || 0) + 1;
				}
			});

			// Total for percentage
			const total = Object.values(counts).reduce((sum, val) => sum + val, 0);

			// Format: name, value, percent
			const formatted = Object.entries(counts).map(([name, value]) => ({
				name,
				value,
				percent: ((value / total) * 100).toFixed(1), // as string, e.g. "23.5"
			}));

			setCategoryData(formatted);
		};

		fetchData();
	}, []);

	return (
		<motion.div
			className='bg-gray-800 bg-opacity-50 backdrop-blur-md shadow-lg rounded-xl p-6 border border-gray-700'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: 0.3 }}
		>
			<h2 className='text-lg font-medium mb-4 text-gray-100'>Items Sold</h2>
			<div className='h-80'>
				<ResponsiveContainer width="100%" height="100%">
					<BarChart
						data={categoryData}
						layout="vertical"
						margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
					>
						<CartesianGrid strokeDasharray="0.5 1" />
						<XAxis type="number" stroke="lightGray" />
						<YAxis dataKey="name" type="category" stroke="lightGray" width={100} />
						<Tooltip
						cursor={false}
							contentStyle={{
								backgroundColor: "rgba(31, 41, 55, 0.8)",
								borderColor: "#4B5563",
							}}
							itemStyle={{ color: "#E5E7EB" }}
							formatter={(value, _name, props) => [`${value} sales`, props.payload.name]}
						/>
						{/* <Legend /> */}
						<Bar dataKey="value">
							{categoryData.map((_entry, index) => (
								<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
							))}
							<LabelList
								dataKey="percent"
								position="right"
								formatter={(val) => `${val}%`}
								fill="#E5E7EB"
							/>
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</motion.div>
	);
};

export default SalesCategory;
