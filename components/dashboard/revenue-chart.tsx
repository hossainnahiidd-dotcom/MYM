"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const mockData = [
  { month: "Nov", collected: 1200, owed: 3400 },
  { month: "Dec", collected: 1800, owed: 2900 },
  { month: "Jan", collected: 2200, owed: 3100 },
  { month: "Feb", collected: 1600, owed: 2600 },
  { month: "Mar", collected: 2800, owed: 2200 },
  { month: "Apr", collected: 2100, owed: 2800 },
];

export function RevenueChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={mockData} barGap={4}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${v}`} />
        <Tooltip
          formatter={(value, name) => [
            `£${Number(value).toLocaleString()}`,
            name === "collected" ? "Collected" : "Outstanding",
          ]}
          contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: 12 }}
        />
        <Bar dataKey="collected" fill="#22c55e" radius={[4, 4, 0, 0]} />
        <Bar dataKey="owed" fill="#eff6ff" stroke="#bfdbfe" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
