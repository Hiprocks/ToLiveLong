"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";
import { DailyTargets, MealRecord } from "@/lib/types";

const today = getLocalDateString();
const HISTORY_CACHE_TTL_MS = 30_000;
const historyCache = new Map<string, { fetchedAt: number; records: MealRecord[] }>();

type Tone = "normal" | "low" | "high";

const getTone = (
  key: "carbs" | "protein" | "fat" | "sugar" | "sodium",
  value: number,
  targets?: DailyTargets | null
): Tone => {
  if (!targets) return "normal";
  const target = targets[key];
  if (!target || target <= 0) return "normal";
  const ratio = value / target;

  if (key === "sugar" || key === "sodium") {
    return ratio > 1 ? "high" : "normal";
  }
  if (ratio < 0.85) return "low";
  if (ratio > 1.05) return "high";
  return "normal";
};

export default function HistoryPage() {
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MealRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targets, setTargets] = useState<DailyTargets | null>(null);

  const load = async (targetDate: string, force = false) => {
    setLoading(true);
    try {
      const cached = historyCache.get(targetDate);
      if (!force && cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
        setRecords(cached.records);
        setErrorMessage(null);
        return;
      }

      const response = await fetch(`/api/sheets/records?date=${targetDate}`, { cache: "no-store" });
      if (!response.ok) throw new Error("기록을 불러오지 못했습니다.");
      const data = (await response.json()) as MealRecord[];
      historyCache.set(targetDate, { fetchedAt: Date.now(), records: data });
      setRecords(data);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("기록 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(date);
  }, [date]);

  useEffect(() => {
    let isActive = true;
    const loadTargets = async () => {
      try {
        const response = await fetch("/api/sheets/user", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DailyTargets;
        if (isActive) setTargets(data);
      } catch {
        if (isActive) setTargets(null);
      }
    };
    void loadTargets();
    return () => {
      isActive = false;
    };
  }, []);

  const totals = records.reduce(
    (acc, record) => ({
      carbs: acc.carbs + record.carbs,
      protein: acc.protein + record.protein,
      fat: acc.fat + record.fat,
      sugar: acc.sugar + record.sugar,
      sodium: acc.sodium + record.sodium,
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

  const handleDelete = async (id: string) => {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    const response = await fetch(`/api/sheets/records/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setErrorMessage("삭제에 실패했습니다.");
      return;
    }
    setErrorMessage(null);
    await load(date, true);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    const response = await fetch(`/api/sheets/records/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    if (!response.ok) {
      setErrorMessage("수정에 실패했습니다.");
      return;
    }
    setErrorMessage(null);
    setEditing(null);
    await load(date, true);
  };

  return (
    <main className="space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-bold">기록</h1>
      <ErrorBanner message={errorMessage} />
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">날짜</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-input px-3 py-2"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">불러오는 중...</p>
      ) : records.length === 0 ? (
        <p className="text-muted-foreground">선택한 날짜에 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-2xl border border-border/80 bg-card/95 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="max-w-[65%] truncate text-sm font-semibold sm:text-base">{record.food_name}</h3>
                    <span className="text-xs font-medium text-muted-foreground">{record.amount}g</span>
                    <span className="text-sm font-bold text-primary sm:text-base">{record.calories} kcal</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setEditing(record)}
                    className="rounded-lg border border-border/80 bg-background/60 p-2 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                    aria-label={`${record.food_name} 수정`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(record.id)}
                    className="rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-red-300 transition-colors hover:border-red-300/60 hover:bg-red-500/20"
                    aria-label={`${record.food_name} 삭제`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <MetricChip label="탄수" value={`${record.carbs}g`} tone={tones.carbs} />
                <MetricChip label="단백질" value={`${record.protein}g`} tone={tones.protein} />
                <MetricChip label="지방" value={`${record.fat}g`} tone={tones.fat} />
                <MetricChip label="당" value={`${record.sugar}g`} tone={tones.sugar} />
                <MetricChip label="나트륨" value={`${record.sodium}mg`} tone={tones.sodium} />
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">기록 수정</h2>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">음식명</span>
              <input
                value={editing.food_name}
                onChange={(e) => setEditing({ ...editing, food_name: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <LabeledNumberInput
                label="섭취량(g)"
                value={editing.amount}
                onChange={(value) => setEditing({ ...editing, amount: value })}
              />
              <LabeledNumberInput
                label="칼로리(kcal)"
                value={editing.calories}
                onChange={(value) => setEditing({ ...editing, calories: value })}
              />
              <LabeledNumberInput
                label="탄수화물(g)"
                value={editing.carbs}
                onChange={(value) => setEditing({ ...editing, carbs: value })}
              />
              <LabeledNumberInput
                label="단백질(g)"
                value={editing.protein}
                onChange={(value) => setEditing({ ...editing, protein: value })}
              />
              <LabeledNumberInput
                label="지방(g)"
                value={editing.fat}
                onChange={(value) => setEditing({ ...editing, fat: value })}
              />
              <LabeledNumberInput
                label="당(g)"
                value={editing.sugar}
                onChange={(value) => setEditing({ ...editing, sugar: value })}
              />
              <LabeledNumberInput
                className="col-span-2"
                label="나트륨(mg)"
                value={editing.sodium}
                onChange={(value) => setEditing({ ...editing, sodium: value })}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg bg-muted py-2">
                취소
              </button>
              <button
                onClick={() => void handleUpdate()}
                className="flex-1 rounded-lg bg-primary py-2 text-primary-foreground"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function LabeledNumberInput({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}) {
  return (
    <label className={`space-y-1 text-xs text-muted-foreground ${className}`}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}

function MetricChip({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        tone === "low"
          ? "border-sky-400/40 bg-sky-500/10"
          : tone === "high"
            ? "border-rose-400/40 bg-rose-500/10"
            : "border-border/70 bg-background/60"
      }`}
    >
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={`text-xs font-semibold ${
          tone === "low" ? "text-sky-300" : tone === "high" ? "text-rose-300" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
