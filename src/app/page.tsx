"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Camera, Plus } from "lucide-react";
import CalorieGauge from "@/components/CalorieGauge";
import MealTable from "@/components/MealTable";
import FoodSearchModal from "@/components/FoodSearchModal";
import IntakeSummaryTable from "@/components/IntakeSummaryTable";
import PhotoAnalysisModal from "@/components/PhotoAnalysisModal";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

// Default fallback (will be overwritten by onboarding data)
const DEFAULT_TARGETS = {
  calories: 2300,
  carbs: 320,
  protein: 120,
  fat: 60,
  sugar: 30,
  sodium: 2000,
};

interface MealLog {
  id: string;
  meal_type: string;
  menu_name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

export default function Home() {
  const router = useRouter();
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dailyTargets, setDailyTargets] = useState(DEFAULT_TARGETS);

  useEffect(() => {
    // Check for onboarding data
    const savedTargets = localStorage.getItem("user_targets");
    if (savedTargets) {
      try {
        setDailyTargets(JSON.parse(savedTargets));
      } catch (e) {
        console.error("Failed to parse targets", e);
      }
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data, error } = await supabase
      .from("daily_logs")
      .select("*")
      .eq("date", today)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching logs:", error);
    } else {
      setLogs(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Calculate totals
  const totals = logs.reduce(
    (acc, log) => ({
      calories: acc.calories + log.calories,
      carbs: acc.carbs + log.carbs,
      protein: acc.protein + log.protein,
      fat: acc.fat + log.fat,
      sugar: acc.sugar + (log.sugar || 0),
      sodium: acc.sodium + (log.sodium || 0),
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">
            {format(new Date(), "yyyy-MM-dd")} 식단관리
          </h1>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <span className="font-bold text-xs">ME</span>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-8">
        {/* Calorie Gauge Section */}
        <section className="bg-card rounded-2xl p-6 shadow-lg border border-border/50 flex flex-col items-center">
          <h2 className="text-center text-sm font-medium text-muted-foreground mb-4">Daily Intake</h2>
          <div className="w-48 h-48">
            <CalorieGauge current={totals.calories} target={dailyTargets.calories} />
          </div>
        </section>

        {/* Intake Summary Table */}
        <section>
          <h3 className="text-lg font-bold mb-3">Today's Summary</h3>
          <IntakeSummaryTable targets={dailyTargets} totals={totals} />
        </section>

        {/* Meal Table Section */}
        <section>
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading...</div>
          ) : (
            <MealTable logs={logs} />
          )}
        </section>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-3 z-40">
        <button
          onClick={() => setIsPhotoModalOpen(true)}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg rounded-full p-4 flex items-center justify-center transition-transform active:scale-95"
          aria-label="사진 등록"
        >
          <Camera className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg rounded-full p-4 flex items-center justify-center transition-transform active:scale-95"
          aria-label="식단 등록"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Food Search Modal (Replaces simple AddMealModal) */}
      <FoodSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLogs}
      />

      {/* Photo Analysis Modal */}
      <PhotoAnalysisModal
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSuccess={fetchLogs}
      />
    </main>
  );
}
