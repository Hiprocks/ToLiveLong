"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Camera, Database, PencilLine, Plus, Shapes } from "lucide-react";
import CalorieGauge from "@/components/CalorieGauge";
import ErrorBanner from "@/components/ErrorBanner";
import FoodSearchModal from "@/components/FoodSearchModal";
import IntakeSummaryTable from "@/components/IntakeSummaryTable";
import MealTable from "@/components/MealTable";
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

export default function Home() {
  const [logs, setLogs] = useState<MealRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isEntrySheetOpen, setIsEntrySheetOpen] = useState(false);
  const [foodModalMode, setFoodModalMode] = useState<"manual" | "template" | "database">("manual");
  const [loading, setLoading] = useState(true);
  const [dailyTargets, setDailyTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [photoPrefill, setPhotoPrefill] = useState<PhotoAnalysisPrefill | null>(null);

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
    if (!isEntrySheetOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsEntrySheetOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEntrySheetOpen]);

  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      carbs: acc.carbs + log.carbs,
      protein: acc.protein + log.protein,
      fat: acc.fat + log.fat,
      sugar: acc.sugar + log.sugar,
      sodium: acc.sodium + log.sodium,
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
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

  const handleSaved = (message: string) => {
    setFlashMessage(message);
    window.setTimeout(() => setFlashMessage(null), 2000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 p-4 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">{format(new Date(), "yyyy-MM-dd")} 오늘 대시보드</h1>
        </div>
      </header>

      <div className="space-y-8 p-4">
        <ErrorBanner message={errorMessage} />
        {flashMessage && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {flashMessage}
          </div>
        )}

        <section className="flex flex-col items-center rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
          <h2 className="mb-4 text-center text-sm font-medium text-muted-foreground">오늘 섭취량</h2>
          <div className="h-48 w-48">
            <CalorieGauge current={totals.calories} target={dailyTargets.calories} />
          </div>
          <div className="mt-5 w-full">
            <IntakeSummaryTable targets={dailyTargets} totals={totals} />
          </div>
        </section>

        <section>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">불러오는 중...</div>
          ) : (
            <MealTable logs={logs} targets={dailyTargets} />
          )}
        </section>
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
            className="absolute bottom-24 right-4 w-64 rounded-2xl border border-border bg-card p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">식단 등록</p>
            <div className="space-y-2">
              <button
                onClick={() => openFoodModal("template")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
              >
                <Shapes className="h-4 w-4" />
                <span className="text-sm">템플릿 사용</span>
              </button>
              <button
                onClick={() => openFoodModal("database")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
              >
                <Database className="h-4 w-4" />
                <span className="text-sm">DB 검색</span>
              </button>
              <button
                onClick={() => openFoodModal("manual")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
              >
                <PencilLine className="h-4 w-4" />
                <span className="text-sm">수기 입력</span>
              </button>
              <button
                onClick={openPhotoModal}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
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
        onSaved={handleSaved}
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
    </main>
  );
}
