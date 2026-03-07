"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, addWeeks, format, startOfWeek, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion } from "framer-motion";
import LoadingOverlay from "@/components/LoadingOverlay";
import ErrorBanner from "@/components/ErrorBanner";
import { DailyTargets } from "@/lib/types";
import { DailySummary } from "@/lib/sheetsCache";

const DEFAULT_TARGETS: DailyTargets = {
  calories: 2000,
  carbs: 250,
  protein: 120,
  fat: 60,
  sugar: 30,
  sodium: 2000,
};

type ChartDay = {
  label: string;
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
};

type TooltipPayloadEntry = {
  dataKey: string;
  value: number;
  color: string;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  unit: string;
  nutrientLabel: string;
};

function CustomTooltip({ active, payload, label, unit, nutrientLabel }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {value.toLocaleString()}{unit} <span className="text-xs font-normal text-muted-foreground">{nutrientLabel}</span>
      </p>
    </div>
  );
}

const buildWeekDays = (weekStart: Date, summaryMap: Map<string, DailySummary>): ChartDay[] => {
  return Array.from({ length: 7 }, (_, i) => {
    const d = addDays(weekStart, i);
    const dateStr = format(d, "yyyy-MM-dd");
    const s = summaryMap.get(dateStr);
    return {
      label: format(d, "EEE", { locale: ko }),
      date: dateStr,
      calories: s?.calories ?? 0,
      carbs: s?.carbs ?? 0,
      protein: s?.protein ?? 0,
      fat: s?.fat ?? 0,
    };
  });
};

type MiniChartProps = {
  data: ChartDay[];
  dataKey: "carbs" | "protein" | "fat";
  label: string;
  target: number;
  color: string;
};

const MiniChart = ({ data, dataKey, label, target, color }: MiniChartProps) => (
  <div className="flex-1 min-w-0">
    <p className="mb-1 text-center text-xs font-medium text-muted-foreground">{label}</p>
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} margin={{ top: 4, right: 2, left: -28, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
        <Tooltip
          content={(props) => (
            <CustomTooltip
              {...(props as CustomTooltipProps)}
              unit="g"
              nutrientLabel={label}
            />
          )}
        />
        <ReferenceLine y={target} stroke={color} strokeDasharray="4 2" strokeOpacity={0.6} />
        <Bar dataKey={dataKey} fill={color} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default function StatsPage() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [summaryMap, setSummaryMap] = useState<Map<string, DailySummary>>(new Map());
  const [monthlySummaries, setMonthlySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTargets = useCallback(async () => {
    const res = await fetch("/api/sheets/user", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as DailyTargets;
    setTargets(data);
  }, []);

  const fetchSummary = useCallback(async (from: string, to: string): Promise<DailySummary[]> => {
    const res = await fetch(`/api/sheets/records/summary?from=${from}&to=${to}`, { cache: "no-store" });
    if (!res.ok) throw new Error("통계를 불러오지 못했습니다.");
    return (await res.json()) as DailySummary[];
  }, []);

  const loadData = useCallback(async (ws: Date) => {
    setLoading(true);
    setError(null);
    try {
      const weekEnd = addDays(ws, 6);
      const now = new Date();
      const monthFrom = format(new Date(now.getFullYear(), now.getMonth(), 1), "yyyy-MM-dd");
      const monthTo = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), "yyyy-MM-dd");

      const [weekData, monthData] = await Promise.all([
        fetchSummary(format(ws, "yyyy-MM-dd"), format(weekEnd, "yyyy-MM-dd")),
        fetchSummary(monthFrom, monthTo),
      ]);

      const map = new Map<string, DailySummary>();
      weekData.forEach((d) => map.set(d.date, d));
      setSummaryMap(map);
      setMonthlySummaries(monthData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [fetchSummary]);

  useEffect(() => {
    void fetchTargets();
  }, [fetchTargets]);

  useEffect(() => {
    void loadData(weekStart);
  }, [weekStart, loadData]);

  const weekDays = buildWeekDays(weekStart, summaryMap);
  const weekEnd = addDays(weekStart, 6);

  const monthDays = monthlySummaries.length;
  const monthAvgCalories = monthDays > 0
    ? Math.round(monthlySummaries.reduce((s, d) => s + d.calories, 0) / monthDays)
    : 0;
  const monthAvgCarbs = monthDays > 0
    ? Math.round(monthlySummaries.reduce((s, d) => s + d.carbs, 0) / monthDays)
    : 0;
  const monthAvgProtein = monthDays > 0
    ? Math.round(monthlySummaries.reduce((s, d) => s + d.protein, 0) / monthDays)
    : 0;
  const monthAvgFat = monthDays > 0
    ? Math.round(monthlySummaries.reduce((s, d) => s + d.fat, 0) / monthDays)
    : 0;

  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const goalDays = monthlySummaries.filter((d) => d.calories >= targets.calories * 0.85 && d.calories <= targets.calories * 1.1).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <LoadingOverlay active={loading} />
      <div className="mx-auto max-w-md px-4 pt-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <h1 className="mb-6 text-xl font-bold">통계</h1>

          {error && <ErrorBanner message={error} />}

          {/* 주간 섹션 */}
          <section className="mb-8">
            {/* 주 탐색 */}
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={() => setWeekStart((w) => subWeeks(w, 1))}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="이전 주"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-muted-foreground">
                {format(weekStart, "MM.dd", { locale: ko })} ~ {format(weekEnd, "MM.dd", { locale: ko })}
              </span>
              <button
                onClick={() => setWeekStart((w) => addWeeks(w, 1))}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="다음 주"
                disabled={weekStart >= startOfWeek(new Date(), { weekStartsOn: 0 })}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* 칼로리 메인 차트 */}
            <div className="mb-2 rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold">칼로리 <span className="text-xs font-normal text-muted-foreground">목표 {targets.calories.toLocaleString()} kcal</span></p>
              <ResponsiveContainer width="100%" height={140}>
                <BarChart data={weekDays} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.4)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={(props) => (
                      <CustomTooltip
                        {...(props as CustomTooltipProps)}
                        unit=" kcal"
                        nutrientLabel="칼로리"
                      />
                    )}
                  />
                  <ReferenceLine y={targets.calories} stroke="rgba(34,197,94,0.7)" strokeDasharray="4 2" label={{ value: "목표", position: "right", fontSize: 9, fill: "rgba(34,197,94,0.7)" }} />
                  <Bar dataKey="calories" fill="rgba(59,130,246,0.75)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 탄단지 소형 차트 3개 */}
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="mb-3 text-sm font-semibold">탄수 · 단백질 · 지방</p>
              <div className="flex gap-3">
                <MiniChart data={weekDays} dataKey="carbs" label="탄수 (g)" target={targets.carbs} color="rgba(251,191,36,0.8)" />
                <MiniChart data={weekDays} dataKey="protein" label="단백질 (g)" target={targets.protein} color="rgba(239,68,68,0.8)" />
                <MiniChart data={weekDays} dataKey="fat" label="지방 (g)" target={targets.fat} color="rgba(168,85,247,0.8)" />
              </div>
            </div>
          </section>

          {/* 월간 요약 */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
              {format(now, "yyyy년 M월")} 요약
            </h2>
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <SummaryRow label="평균 칼로리" value={`${monthAvgCalories.toLocaleString()} kcal`} target={`목표 ${targets.calories.toLocaleString()}`} ratio={monthAvgCalories / targets.calories} />
              <SummaryRow label="평균 탄수" value={`${monthAvgCarbs}g`} target={`목표 ${targets.carbs}g`} ratio={monthAvgCarbs / targets.carbs} />
              <SummaryRow label="평균 단백질" value={`${monthAvgProtein}g`} target={`목표 ${targets.protein}g`} ratio={monthAvgProtein / targets.protein} />
              <SummaryRow label="평균 지방" value={`${monthAvgFat}g`} target={`목표 ${targets.fat}g`} ratio={monthAvgFat / targets.fat} />
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">칼로리 목표 달성일</span>
                  <span className="text-sm font-semibold">
                    {goalDays} <span className="font-normal text-muted-foreground">/ {daysInMonth}일</span>
                  </span>
                </div>
              </div>
            </div>
          </section>
        </motion.div>
      </div>
    </div>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  target: string;
  ratio: number;
};

function SummaryRow({ label, value, target, ratio }: SummaryRowProps) {
  const color =
    !Number.isFinite(ratio) || ratio <= 0
      ? "bg-muted"
      : ratio <= 1.1
      ? "bg-green-500/70"
      : "bg-red-500/70";

  const pct = Math.min(Math.round((Number.isFinite(ratio) ? ratio : 0) * 100), 100);

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="text-right">
          <span className="text-sm font-semibold">{value}</span>
          <span className="ml-2 text-xs text-muted-foreground">{target}</span>
        </div>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
