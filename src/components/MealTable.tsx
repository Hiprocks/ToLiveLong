"use client";

import { getProgressTone, type ProgressTone } from "@/lib/nutritionTone";
import { MealRecord } from "@/lib/types";
import { DailyTargets } from "@/lib/types";

interface MealTableProps {
  logs: MealRecord[];
  targets?: DailyTargets;
}

const CEILING_KEYS = new Set(["sugar", "sodium"]);

const getTone = (
  key: "carbs" | "protein" | "fat" | "sugar" | "sodium",
  value: number,
  targets?: DailyTargets,
): ProgressTone | "normal" => {
  if (!targets) return "normal";
  const target = targets[key];
  if (!target || target <= 0) return "normal";
  const ratio = value / target;
  const tone = getProgressTone(ratio, { ceiling: CEILING_KEYS.has(key) });
  if (tone === "ok") return "normal";
  return tone;
};

export default function MealTable({ logs, targets }: MealTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-sm">
        오늘 등록된 식단이 없습니다.
      </div>
    );
  }

  const totals = logs.reduce(
    (acc, item) => ({
      carbs: acc.carbs + item.carbs,
      protein: acc.protein + item.protein,
      fat: acc.fat + item.fat,
      sugar: acc.sugar + item.sugar,
      sodium: acc.sodium + item.sodium,
    }),
    { carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
  );

  const tones = {
    carbs: getTone("carbs", totals.carbs, targets),
    protein: getTone("protein", totals.protein, targets),
    fat: getTone("fat", totals.fat, targets),
    sugar: getTone("sugar", totals.sugar, targets),
    sodium: getTone("sodium", totals.sodium, targets),
  };

  return (
    <div className="w-full space-y-3 pb-24">
      {logs.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-border/80 bg-card/95 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h3 className="max-w-[65%] truncate text-sm font-semibold sm:text-base">{item.food_name}</h3>
            <div className="text-xs font-medium text-muted-foreground">{item.amount}g</div>
            <div className="text-sm font-bold text-primary sm:text-base">{item.calories} kcal</div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            <MetricChip label="탄수" value={`${item.carbs}g`} tone={tones.carbs} />
            <MetricChip label="단백질" value={`${item.protein}g`} tone={tones.protein} />
            <MetricChip label="지방" value={`${item.fat}g`} tone={tones.fat} />
            <MetricChip label="당" value={`${item.sugar}g`} tone={tones.sugar} />
            <MetricChip label="나트륨" value={`${item.sodium}mg`} tone={tones.sodium} />
          </div>
        </article>
      ))}
    </div>
  );
}

const CHIP_BORDER: Record<string, string> = {
  low: "border-sky-400/40 bg-sky-500/10",
  slight: "border-amber-400/40 bg-amber-500/10",
  high: "border-rose-400/40 bg-rose-500/10",
  normal: "border-border/70 bg-background/60",
};

const CHIP_TEXT: Record<string, string> = {
  low: "text-sky-300",
  slight: "text-amber-300",
  high: "text-rose-300",
  normal: "text-foreground",
};

function MetricChip({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: ProgressTone | "normal";
}) {
  return (
    <div className={`rounded-lg border px-2 py-1.5 ${CHIP_BORDER[tone] ?? CHIP_BORDER.normal}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-xs font-semibold ${CHIP_TEXT[tone] ?? CHIP_TEXT.normal}`}>
        {value}
      </div>
    </div>
  );
}

