"use client";

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";

interface CalorieGaugeProps {
  current: number;
  target: number;
}

export default function CalorieGauge({ current, target }: CalorieGaugeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const percentage = Math.min(100, (current / target) * 100);
  const data = [{ name: "Calories", value: percentage, fill: "var(--color-primary)" }];

  if (!mounted) {
    return (
      <div className="relative w-full h-64 flex flex-col items-center justify-center bg-muted/10 rounded-full animate-pulse">
        {/* Placeholder */}
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="70%"
          outerRadius="100%"
          barSize={20}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            fill="var(--color-primary)"
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-4xl font-bold text-foreground">{current}</span>
        <span className="text-sm text-muted-foreground">/ {target} kcal</span>
      </div>
    </div>
  );
}
