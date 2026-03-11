"use client";

import { useCallback, useEffect, useState } from "react";
import { useModalHistory } from "@/hooks/useModalHistory";
import { addDays, addWeeks, format, startOfWeek, subDays, subWeeks } from "date-fns";
import { ko } from "date-fns/locale";
import { RefreshCw, Sparkles, X } from "lucide-react";
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
import DateNavCard from "@/components/DateNavCard";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import MealEntryFab from "@/components/MealEntryFab";
import { getLocalDateString } from "@/lib/date";
import { getProgressTone, TONE_CHART_COLOR } from "@/lib/nutritionTone";
import { DailyTargets, UserTargetsResponse } from "@/lib/types";
import { DailySummary } from "@/lib/sheetsCache";

const AI_REVIEW_STORAGE_KEY = "diet-ai-review-last";
const today = getLocalDateString();

type AiReviewCache = {
  text: string;
  generatedAt: string;
  from?: string;
  to?: string;
};

function loadAiReviewCache(): AiReviewCache | null {
  try {
    const raw = localStorage.getItem(AI_REVIEW_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AiReviewCache;
  } catch {
    return null;
  }
}

const reviewTimeValue = (value: string | null | undefined) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

function saveAiReviewCache(text: string, range?: { from: string; to: string }) {
  try {
    const value: AiReviewCache = {
      text,
      generatedAt: new Date().toISOString(),
      from: range?.from,
      to: range?.to,
    };
    localStorage.setItem(AI_REVIEW_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage 저장 실패 시 무시
  }
}

function sanitizeReviewText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

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
  payload: ChartDay;
};

type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  label?: string;
  unit: string;
  nutrientLabel: string;
};

function CustomTooltip({ active, payload, unit, nutrientLabel }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const day = payload[0]?.payload;
  const dateLabel = day ? format(new Date(day.date + "T00:00:00"), "M/d (EEE)", { locale: ko }) : "";
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="mb-0.5 text-xs text-muted-foreground">{dateLabel}</p>
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
        <ReferenceLine y={target} stroke="rgba(34,197,94,0.6)" strokeDasharray="4 2" strokeOpacity={0.6} />
        <Bar dataKey={dataKey} fill={color} fillOpacity={0.8} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default function StatsPage() {
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [userResponse, setUserResponse] = useState<UserTargetsResponse | null>(null);
  const [summaryMap, setSummaryMap] = useState<Map<string, DailySummary>>(new Map());
  const [monthlySummaries, setMonthlySummaries] = useState<DailySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [aiReviewText, setAiReviewText] = useState<string>("");
  const [aiReviewDate, setAiReviewDate] = useState<string | null>(null);
  const [aiReviewRange, setAiReviewRange] = useState<{ from: string; to: string } | null>(null);
  const [aiStreamingText, setAiStreamingText] = useState<string>("");
  const [isAiStreaming, setIsAiStreaming] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  useModalHistory(isAiModalOpen, () => setIsAiModalOpen(false));

  useEffect(() => {
    if (!isAiModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAiModalOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isAiModalOpen]);

  useEffect(() => {
    const cached = loadAiReviewCache();
    if (cached) {
      setAiReviewText(sanitizeReviewText(cached.text));
      setAiReviewDate(cached.generatedAt);
      if (cached.from && cached.to) {
        setAiReviewRange({ from: cached.from, to: cached.to });
      } else if (cached.generatedAt) {
        const to = format(new Date(cached.generatedAt), "yyyy-MM-dd");
        const from = format(subDays(new Date(cached.generatedAt), 6), "yyyy-MM-dd");
        setAiReviewRange({ from, to });
      }
    }
  }, []);

  const fetchTargets = useCallback(async () => {
    const res = await fetch("/api/sheets/user", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as UserTargetsResponse;
    setUserResponse(data);
    setTargets(data);

    const serverReview = data.dietReview;
    if (serverReview?.text) {
      const localTime = reviewTimeValue(aiReviewDate);
      const serverTime = reviewTimeValue(serverReview.generatedAt);
      if (serverTime >= localTime) {
        setAiReviewText(sanitizeReviewText(serverReview.text));
        setAiReviewDate(serverReview.generatedAt);
        setAiReviewRange({ from: serverReview.from, to: serverReview.to });
        saveAiReviewCache(sanitizeReviewText(serverReview.text), {
          from: serverReview.from,
          to: serverReview.to,
        });
      }
    }
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

  const requestAiReview = useCallback(async (openModal = true) => {
    if (isAiStreaming) return;
    setIsAiStreaming(true);
    setAiError(null);
    setAiStreamingText("");
    if (openModal) setIsAiModalOpen(true);

    try {
      const today = new Date();
      const from = format(subDays(today, 6), "yyyy-MM-dd");
      const to = format(today, "yyyy-MM-dd");
      const res = await fetch(`/api/sheets/records/summary?from=${from}&to=${to}`, { cache: "no-store" });
      if (!res.ok) throw new Error("식단 데이터를 불러오지 못했습니다.");
      const recentSummaries = (await res.json()) as DailySummary[];

      const reviewRes = await fetch("/api/analyze/diet-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summaries: recentSummaries,
          targets,
          profile: userResponse?.profile ?? null,
        }),
      });

      if (!reviewRes.ok || !reviewRes.body) {
        const errText = await reviewRes.text();
        throw new Error(errText || "AI 평가 요청에 실패했습니다.");
      }

      const reader = reviewRes.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setAiStreamingText(accumulated);
      }

      const cleaned = sanitizeReviewText(accumulated);
      const generatedAt = new Date().toISOString();
      setAiReviewText(cleaned);
      setAiReviewRange({ from, to });
      saveAiReviewCache(cleaned, { from, to });
      setAiReviewDate(generatedAt);
      await fetch("/api/sheets/user/diet-review", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: cleaned,
          generatedAt,
          from,
          to,
        }),
      });
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setAiStreamingText("");
      setIsAiStreaming(false);
    }
  }, [isAiStreaming, targets, userResponse]);

  useEffect(() => {
    void fetchTargets();
  }, [fetchTargets]);

  useEffect(() => {
    void loadData(weekStart);
  }, [weekStart, loadData]);

  const refreshStats = useCallback(async () => {
    await Promise.all([fetchTargets(), loadData(weekStart)]);
  }, [fetchTargets, loadData, weekStart]);

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
  const hasAiReview = aiReviewText.trim().length > 0;
  const modalReviewText = isAiStreaming ? sanitizeReviewText(aiStreamingText || aiReviewText) : aiReviewText;
  const aiRangeLabel = aiReviewRange
    ? `${format(new Date(`${aiReviewRange.from}T00:00:00`), "M/d")}~${format(new Date(`${aiReviewRange.to}T00:00:00`), "M/d")}`
    : null;

  return (
    <motion.main className="space-y-4 p-4 pb-24" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <LoadingOverlay active={loading} />
      <h1 className="text-2xl font-bold">통계</h1>

      {error && <ErrorBanner message={error} />}

      {/* 주간 섹션 */}
      <section className="space-y-3">
        <div>
          <DateNavCard
            onPrev={() => setWeekStart((w) => subWeeks(w, 1))}
            onNext={() => setWeekStart((w) => addWeeks(w, 1))}
            canGoNext={weekStart < startOfWeek(new Date(), { weekStartsOn: 1 })}
            centerLabel="조회 주간"
            centerValue={`${format(weekStart, "MM.dd", { locale: ko })} ~ ${format(weekEnd, "MM.dd", { locale: ko })}`}
            prevAriaLabel="이전 주"
            nextAriaLabel="다음 주"
          />
        </div>

            <div>
              {!hasAiReview ? (
                <button
                  onClick={() => void requestAiReview(true)}
                  disabled={isAiStreaming}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-60"
                >
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  {isAiStreaming ? "AI 평가 생성 중..." : "AI 평가 받기"}
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAiModalOpen(true)}
                    className="flex-1 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
                  >
                    <span className="block">AI평가 보기</span>
                    {aiRangeLabel && (
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">({aiRangeLabel})</span>
                    )}
                  </button>
                  <button
                    onClick={() => void requestAiReview(true)}
                    disabled={isAiStreaming}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isAiStreaming ? "animate-spin" : ""}`} />
                    재생성
                  </button>
                </div>
              )}
            </div>

            {/* 칼로리 메인 차트 */}
            <div className="rounded-2xl border border-border bg-card p-4">
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

      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm" onClick={() => setIsAiModalOpen(false)}>
          <div className="flex min-h-full items-center justify-center p-4">
            <div
              className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-lg"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">AI 식단 평가</h2>
                </div>
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto px-4 py-4">
                {aiError && (
                  <p className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{aiError}</p>
                )}

                {modalReviewText ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {modalReviewText}
                    {isAiStreaming && (
                      <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-foreground align-middle" />
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isAiStreaming ? "평가를 생성하고 있습니다..." : "아직 생성된 평가가 없습니다."}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-border px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {aiReviewDate ? `${format(new Date(aiReviewDate), "M/d HH:mm")} 기준` : "최근 7일 기준"}
                </p>
                <button
                  onClick={() => void requestAiReview(false)}
                  disabled={isAiStreaming}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isAiStreaming ? "animate-spin" : ""}`} />
                  재생성
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <MealEntryFab selectedDate={today} onSuccess={refreshStats} />
    </motion.main>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
  target: string;
  ratio: number;
};

function SummaryRow({ label, value, target, ratio }: SummaryRowProps) {
  const tone = getProgressTone(ratio);
  const barColor = !Number.isFinite(ratio) || ratio <= 0 ? "rgba(148,163,184,0.4)" : TONE_CHART_COLOR[tone];
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
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
