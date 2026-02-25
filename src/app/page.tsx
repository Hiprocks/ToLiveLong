"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Camera, PencilLine, Plus, Shapes } from "lucide-react";
import CalorieGauge from "@/components/CalorieGauge";
import ErrorBanner from "@/components/ErrorBanner";
import MealTable from "@/components/MealTable";
import FoodSearchModal from "@/components/FoodSearchModal";
import IntakeSummaryTable from "@/components/IntakeSummaryTable";
import PhotoAnalysisModal from "@/components/PhotoAnalysisModal";
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
  const [foodModalMode, setFoodModalMode] = useState<"manual" | "template">("manual");
  const [loading, setLoading] = useState(true);
  const [dailyTargets, setDailyTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    const today = getLocalDateString();
    const response = await fetch(`/api/sheets/records?date=${today}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch records");
    const data = (await response.json()) as MealRecord[];
    setLogs(data);
  }, []);

  const fetchTargets = useCallback(async () => {
    const response = await fetch("/api/sheets/user", { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch user target");
    const data = (await response.json()) as DailyTargets;
    setDailyTargets(data);
  }, []);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        await Promise.all([fetchLogs(), fetchTargets()]);
        if (isActive) setErrorMessage(null);
      } catch (error) {
        if (isActive) {
          console.error(error);
          setErrorMessage("Failed to load dashboard data. Please try again.");
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

  const openFoodModal = (mode: "manual" | "template") => {
    setFoodModalMode(mode);
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
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">
            {format(new Date(), "yyyy-MM-dd")} Daily Dashboard
          </h1>
        </div>
      </header>

      <div className="p-4 space-y-8">
        <ErrorBanner message={errorMessage} />
        {flashMessage && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {flashMessage}
          </div>
        )}
        <section className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 flex flex-col items-center">
          <h2 className="text-center text-sm font-medium text-muted-foreground mb-4">
            Daily Intake
          </h2>
          <div className="w-48 h-48">
            <CalorieGauge current={totals.calories} target={dailyTargets.calories} />
          </div>
          <div className="mt-5 w-full">
            <IntakeSummaryTable targets={dailyTargets} totals={totals} />
          </div>
        </section>

        <section>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : (
            <MealTable logs={logs} />
          )}
        </section>
      </div>

      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => setIsEntrySheetOpen((prev) => !prev)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg rounded-full p-4 flex items-center justify-center transition-transform active:scale-95"
          aria-label="Open meal entry options"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {isEntrySheetOpen && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setIsEntrySheetOpen(false)}>
          <div
            className="absolute bottom-24 right-4 w-64 rounded-2xl border border-border bg-card p-3 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Add Meal
            </p>
            <div className="space-y-2">
              <button
                onClick={() => openFoodModal("manual")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
              >
                <PencilLine className="h-4 w-4" />
                <span className="text-sm">Manual entry</span>
              </button>
              <button
                onClick={() => openFoodModal("template")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
              >
                <Shapes className="h-4 w-4" />
                <span className="text-sm">Use template</span>
              </button>
              <button
                onClick={openPhotoModal}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60"
              >
                <Camera className="h-4 w-4" />
                <span className="text-sm">Analyze photo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <FoodSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLogs}
        onSaved={handleSaved}
        initialMode={foodModalMode}
      />

      <PhotoAnalysisModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSuccess={fetchLogs}
        onSaved={handleSaved}
      />
    </main>
  );
}
