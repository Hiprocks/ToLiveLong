"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Camera, Plus } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [dailyTargets, setDailyTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          setErrorMessage("데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
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
        <section className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 flex flex-col items-center">
          <h2 className="text-center text-sm font-medium text-muted-foreground mb-4">
            Daily Intake
          </h2>
          <div className="w-48 h-48">
            <CalorieGauge current={totals.calories} target={dailyTargets.calories} />
          </div>
        </section>

        <section>
          <h3 className="text-lg font-bold mb-3">Today&apos;s Summary</h3>
          <IntakeSummaryTable targets={dailyTargets} totals={totals} />
        </section>

        <section>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : (
            <MealTable logs={logs} />
          )}
        </section>
      </div>

      <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-40">
        <button
          onClick={() => setIsPhotoModalOpen(true)}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg rounded-full p-4 flex items-center justify-center transition-transform active:scale-95"
          aria-label="Open photo analysis modal"
        >
          <Camera className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg rounded-full p-4 flex items-center justify-center transition-transform active:scale-95"
          aria-label="Open meal modal"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <FoodSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLogs}
      />

      <PhotoAnalysisModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSuccess={fetchLogs}
      />
    </main>
  );
}
