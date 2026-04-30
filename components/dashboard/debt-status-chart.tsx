"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Props {
  data: { name: string; value: number; color: string }[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl px-4 py-3 text-sm">
      <span className="flex items-center gap-2 font-semibold text-gray-900">
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: payload[0].payload.color }} />
        {payload[0].name}
      </span>
      <p className="text-gray-500 mt-0.5">{payload[0].value} debt{payload[0].value !== 1 ? "s" : ""}</p>
    </div>
  );
};

export function DebtStatusChart({ data }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-gray-400">
        No debt data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} strokeWidth={0} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, color: "#64748b" }}
          formatter={(value) => value}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
