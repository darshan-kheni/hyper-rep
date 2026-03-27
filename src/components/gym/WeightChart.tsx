"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from "recharts";
import { format, parseISO } from "date-fns";

interface WeightChartProps {
  data: { weight_kg: number; logged_at: string }[];
  target: number;
}

export function WeightChart({ data, target }: WeightChartProps) {
  const chartData = data.map((d) => ({
    date: format(parseISO(d.logged_at), "MMM d"),
    weight: d.weight_kg,
  }));

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["dataMin - 2", "dataMax + 2"]}
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: 12,
              fontSize: 12,
            }}
          />
          <ReferenceLine
            y={target}
            stroke="var(--success)"
            strokeDasharray="3 3"
            label={{
              value: `${target} kg`,
              position: "right",
              fill: "var(--success)",
              fontSize: 10,
            }}
          />
          <Line
            type="monotone"
            dataKey="weight"
            stroke="var(--accent)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--accent)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
