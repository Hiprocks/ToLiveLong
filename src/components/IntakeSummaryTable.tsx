"use client";

import { DailyTargets } from "@/lib/types";

interface IntakeSummaryTableProps {
  targets: DailyTargets;
  totals: {
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
    sugar: number;
    sodium: number;
  };
}

type MetricKey = keyof DailyTargets;

const metrics: Array<{ key: MetricKey; label: string; unit: string }> = [
  { key: "calories", label: "칼로리", unit: "kcal" },
  { key: "carbs", label: "탄수화물", unit: "g" },
  { key: "protein", label: "단백질", unit: "g" },
  { key: "fat", label: "지방", unit: "g" },
  { key: "sugar", label: "당", unit: "g" },
  { key: "sodium", label: "나트륨", unit: "mg" },
];

export default function IntakeSummaryTable({ targets, totals }: IntakeSummaryTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">오늘 타겟</h3>
      <div className="space-y-3">
        {metrics.map((metric) => {
          const target = Math.max(0, targets[metric.key]);
          const current = Math.max(0, totals[metric.key]);
          const ratio = target > 0 ? (current / target) * 100 : 0;
          const width = Math.min(100, ratio);
          const isOver = current > target && target > 0;

          return (
            <div key={metric.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">{metric.label}</span>
                <span className={isOver ? "font-semibold text-red-500" : "text-muted-foreground"}>
                  {current} / {target} {metric.unit}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isOver ? "bg-red-500" : "bg-primary"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

