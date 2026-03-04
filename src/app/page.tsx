"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Camera, Database, PencilLine, Plus, Shapes } from "lucide-react";
import { motion } from "framer-motion";
import { Pie, PieChart, Cell } from "recharts";
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ErrorBanner from "@/components/ErrorBanner";
import FoodSearchModal from "@/components/FoodSearchModal";
import PhotoAnalysisModal, { PhotoAnalysisPrefill } from "@/components/PhotoAnalysisModal";
import { cacheKeys, getCachedData, setCachedData } from "@/lib/clientSyncCache";
import { getLocalDateString } from "@/lib/date";
import { DailyTargets, MealRecord } from "@/lib/types";

const DEFAULT_TARGETS: DailyTargets = {
  calories: 2300,
  carbs: 320,
  protein: 120,
  fat: 60,
  sugar: 30,
  sodium: 2000,
};

const NUTRIENT_ITEMS: Array<{ key: keyof DailyTargets; label: string; unit: string }> = [
  { key: "carbs", label: "탄수", unit: "g" },
  { key: "protein", label: "단백질", unit: "g" },
  { key: "fat", label: "지방", unit: "g" },
  { key: "sugar", label: "당", unit: "g" },
  { key: "sodium", label: "나트륨", unit: "mg" },
];

type ProgressTone = "low" | "ok" | "high";

const getProgressTone = (ratio: number): ProgressTone => {
  if (!Number.isFinite(ratio) || ratio <= 0.8) return "low";
  if (ratio <= 1) return "ok";
  return "high";
};

const tonePalette: Record<ProgressTone, { chart: string; bar: string; text: string }> = {
  low: { chart: "rgba(59, 130, 246, 0.75)", bar: "rgba(59, 130, 246, 0.75)", text: "text-blue-500" },
  ok: { chart: "rgba(34, 197, 94, 0.75)", bar: "rgba(34, 197, 94, 0.75)", text: "text-green-500" },
  high: { chart: "rgba(239, 68, 68, 0.75)", bar: "rgba(239, 68, 68, 0.75)", text: "text-red-500" },
};

export default function Home() {
  const [logs, setLogs] = useState<MealRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false);
  const [foodModalMode, setFoodModalMode] = useState<"manual" | "template" | "database">("manual");
  const [loading, setLoading] = useState(true);
  const [dailyTargets, setDailyTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [photoPrefill, setPhotoPrefill] = useState<PhotoAnalysisPrefill | null>(null);
  const [todayText, setTodayText] = useState("");
  const [isChartReady, setIsChartReady] = useState(false);

  const fetchLogs = useCallback(async (): Promise<MealRecord[]> => {
    const today = getLocalDateString();
    const response = await fetch(`/api/sheets/records?date=${today}`, { cache: "no-store" });
    if (!response.ok) throw new Error("기록을 불러오지 못했습니다.");
    return (await response.json()) as MealRecord[];
  }, []);

  const fetchTargets = useCallback(async (): Promise<DailyTargets> => {
    const response = await fetch("/api/sheets/user", { cache: "no-store" });
    if (!response.ok) throw new Error("목표 정보를 불러오지 못했습니다.");
    return (await response.json()) as DailyTargets;
  }, []);

  const refreshLogs = useCallback(async () => {
    const today = getLocalDateString();
    const nextLogs = await fetchLogs();
    setLogs(nextLogs);
    setCachedData(cacheKeys.records(today), nextLogs);
  }, [fetchLogs]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const today = getLocalDateString();
        const logsKey = cacheKeys.records(today);
        const cachedLogs = getCachedData<MealRecord[]>(logsKey);
        const cachedTargets = getCachedData<DailyTargets>(cacheKeys.user);

        if (cachedLogs && cachedTargets) {
          if (isActive) {
            setLogs(cachedLogs);
            setDailyTargets(cachedTargets);
            setErrorMessage(null);
          }
          return;
        }

        const [nextLogs, nextTargets] = await Promise.all([
          cachedLogs ? Promise.resolve(cachedLogs) : fetchLogs(),
          cachedTargets ? Promise.resolve(cachedTargets) : fetchTargets(),
        ]);

        if (!cachedLogs) setCachedData(logsKey, nextLogs);
        if (!cachedTargets) setCachedData(cacheKeys.user, nextTargets);

        if (isActive) {
          setLogs(nextLogs);
          setDailyTargets(nextTargets);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          console.error(error);
          setErrorMessage("대시보드 데이터를 불러오지 못했습니다. 다시 시도해 주세요.");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [fetchLogs, fetchTargets]);

  useEffect(() => {
    setTodayText(format(new Date(), "yyyy-MM-dd"));
    setIsChartReady(true);
  }, []);

  useEffect(() => {
    if (!isEntrySheetOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsEntrySheetOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEntrySheetOpen]);

  const totals = useMemo(
    () =>
      logs.reduce(
        (acc, log) => ({
          calories: acc.calories + log.calories,
          carbs: acc.carbs + log.carbs,
          protein: acc.protein + log.protein,
          fat: acc.fat + log.fat,
          sugar: acc.sugar + log.sugar,
          sodium: acc.sodium + log.sodium,
        }),
        { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
      ),
    [logs]
  );

  const openFoodModal = (mode: "manual" | "template" | "database") => {
    setFoodModalMode(mode);
    if (mode !== "manual") setPhotoPrefill(null);
    setIsEntrySheetOpen(false);
    setIsModalOpen(true);
  };

  const openPhotoModal = () => {
    setIsEntrySheetOpen(false);
    setIsPhotoModalOpen(true);
  };

  const currentCalories = Number.isFinite(totals.calories) ? totals.calories : 0;
  const targetCalories = Number.isFinite(dailyTargets.calories) ? dailyTargets.calories : 0;
  const calorieRatio = targetCalories > 0 ? currentCalories / targetCalories : 0;
  const calorieProgress = Math.min(1, Math.max(0, calorieRatio));
  const calorieTone = getProgressTone(calorieRatio);
  const remainingCalories = Math.max(0, targetCalories - currentCalories);
  const donutData = [
    { name: "섭취", value: Math.max(0, calorieProgress), color: tonePalette[calorieTone].chart },
    { name: "남음", value: Math.max(0, 1 - calorieProgress), color: "rgba(148, 163, 184, 0.22)" },
  ];

  return (
    <motion.main
      className="relative min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-0 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute right-0 top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border bg-background/80 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{todayText || "---- -- --"} 대시보드</h1>
        </div>
      </header>

      <div className="relative z-10 space-y-4 p-4 pb-24">
        <ErrorBanner message={errorMessage} />

        <BentoGrid>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: 0.02 }}
            whileTap={{ scale: 0.995 }}
            className="md:col-span-3"
          >
            <BentoCard className="overflow-hidden">
              <Card className="border-0 bg-transparent py-4 shadow-none">
            <CardHeader className="px-4">
              <CardTitle className="text-base">오늘 칼로리</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              <div className="flex flex-col items-center gap-4">
                <div className="relative h-[220px] w-[220px] overflow-hidden rounded-full">
                  {isChartReady ? (
                    <PieChart width={220} height={220}>
                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={96}
                        stroke="none"
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                      >
                        {donutData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : (
                    <div className="h-[220px] w-[220px] rounded-full border border-border bg-muted/40" />
                  )}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className={`text-3xl font-bold ${tonePalette[calorieTone].text}`}>{currentCalories}</p>
                    <p className="text-sm text-muted-foreground">/ {targetCalories} kcal</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">남은 칼로리 {remainingCalories} kcal</p>
              </div>
            </CardContent>
              </Card>
            </BentoCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: 0.06 }}
            whileTap={{ scale: 0.995 }}
            className="md:col-span-3"
          >
            <BentoCard>
              <Card className="border-0 bg-transparent py-4 shadow-none">
            <CardHeader className="px-4">
              <CardTitle className="text-base">영양 목표 진행</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-4">
              {NUTRIENT_ITEMS.map((item) => {
                const target = Math.max(0, dailyTargets[item.key]);
                const current = Math.max(0, totals[item.key]);
                const ratioRaw = target > 0 ? current / target : 0;
                const ratio = Math.min(1, Math.max(0, ratioRaw));
                const tone = getProgressTone(ratioRaw);
                return (
                  <div key={item.key} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={tonePalette[tone].text}>
                        {current} / {target} {item.unit}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full"
                        style={{ backgroundColor: tonePalette[tone].bar, width: `${ratio * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
              </Card>
            </BentoCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut", delay: 0.12 }}
            whileTap={{ scale: 0.995 }}
            className="md:col-span-6"
          >
            <BentoCard>
              <Card className="border-0 bg-transparent py-4 shadow-none">
            <CardHeader className="px-4">
              <CardTitle className="text-base">오늘 식단 기록</CardTitle>
            </CardHeader>
            <CardContent className="px-4">
              {loading ? (
                <p className="py-4 text-sm text-muted-foreground">불러오는 중...</p>
              ) : logs.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">오늘 등록된 식단이 없습니다.</p>
              ) : (
                <div className="space-y-4">
                  {logs.slice(0, 6).map((item, index) => (
                    <motion.div
                      key={item.id}
                      className="rounded-2xl border border-border/60 bg-background/70 p-4"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileTap={{ scale: 0.99 }}
                      transition={{ duration: 0.2, ease: "easeOut", delay: 0.02 * index }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <p className="truncate text-lg font-semibold">{item.food_name}</p>
                        <p className="text-sm text-muted-foreground">{item.amount}g</p>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                        <p>{item.calories} kcal</p>
                        <p>탄 {item.carbs} / 단 {item.protein} / 지 {item.fat}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
              </Card>
            </BentoCard>
          </motion.div>
        </BentoGrid>
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsEntrySheetOpen((prev) => !prev)}
          className="flex items-center justify-center rounded-full bg-primary p-4 text-primary-foreground shadow-lg transition-transform active:scale-95 hover:bg-primary/90"
          aria-label="식단 등록 옵션 열기"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {isEntrySheetOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsEntrySheetOpen(false)}>
          <div
            className="absolute bottom-24 right-4 w-64 rounded-2xl border border-border/80 bg-card p-4 shadow-sm backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="pb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">식단 등록</p>
            <div className="space-y-2">
              <button
                onClick={() => openFoodModal("template")}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-white/5"
              >
                <Shapes className="h-4 w-4" />
                <span className="text-sm">템플릿 사용</span>
              </button>
              <button
                onClick={() => openFoodModal("database")}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-white/5"
              >
                <Database className="h-4 w-4" />
                <span className="text-sm">DB 검색</span>
              </button>
              <button
                onClick={() => openFoodModal("manual")}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-white/5"
              >
                <PencilLine className="h-4 w-4" />
                <span className="text-sm">수기 입력</span>
              </button>
              <button
                onClick={openPhotoModal}
                className="flex w-full items-center gap-4 rounded-2xl p-4 text-left hover:bg-white/5"
              >
                <Camera className="h-4 w-4" />
                <span className="text-sm">사진 등록</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <FoodSearchModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setPhotoPrefill(null);
        }}
        onSuccess={refreshLogs}
        initialMode={foodModalMode}
        initialPrefill={foodModalMode === "manual" ? photoPrefill : null}
      />

      <PhotoAnalysisModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onAnalyzed={(prefill) => {
          setPhotoPrefill(prefill);
          setFoodModalMode("manual");
          setIsPhotoModalOpen(false);
          setIsModalOpen(true);
        }}
      />
    </motion.main>
  );
}
