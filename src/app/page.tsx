"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Camera } from "lucide-react";
import CalorieGauge from "@/components/CalorieGauge";
import MealTable from "@/components/MealTable";
import AddMealModal from "@/components/AddMealModal";
import { supabase } from "@/lib/supabase";

// === User Stats & Daily Targets ===
const DAILY_TARGETS = {
  calories: 2300,
  carbs: 320,
  protein: 120,
  fat: 60,
};

interface MealLog {
  id: string;
  meal_type: string;
  menu_name: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export default function Home() {
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    }),
    { calories: 0, carbs: 0, protein: 0, fat: 0 }
  );

  return (
    <main className="min-h-screen bg-background text-foreground pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border p-4">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Today's Diet</h1>
            <p className="text-sm text-muted-foreground">{format(new Date(), "EEEE, MMM do")}</p>
          </div>
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
            <span className="font-bold text-xs">JD</span>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4 space-y-8">
        {/* Calorie Gauge Section */}
        <section className="bg-card rounded-2xl p-6 shadow-lg border border-border/50">
          <h2 className="text-center text-sm font-medium text-muted-foreground mb-4">Daily Intake</h2>
          <CalorieGauge current={totals.calories} target={DAILY_TARGETS.calories} />

          {/* Macro Summary */}
          <div className="grid grid-cols-3 gap-4 mt-6 text-center">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Carbs</p>
              <p className="font-semibold">{totals.carbs}g <span className="text-xs text-muted-foreground">/ {DAILY_TARGETS.carbs}g</span></p>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${Math.min(100, (totals.carbs / DAILY_TARGETS.carbs) * 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="font-semibold">{totals.protein}g <span className="text-xs text-muted-foreground">/ {DAILY_TARGETS.protein}g</span></p>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (totals.protein / DAILY_TARGETS.protein) * 100)}%` }} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Fat</p>
              <p className="font-semibold">{totals.fat}g <span className="text-xs text-muted-foreground">/ {DAILY_TARGETS.fat}g</span></p>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-amber-500" style={{ width: `${Math.min(100, (totals.fat / DAILY_TARGETS.fat) * 100)}%` }} />
              </div>
            </div>
          </div>
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

      {/* Floating Action Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <button
          onClick={() => setIsModalOpen(true)}
          className="pointer-events-auto bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 rounded-full px-6 py-3 flex items-center gap-2 font-medium transform active:scale-95"
        >
          <Camera className="w-5 h-5" />
          <span>Log Meal</span>
        </button>
      </div>

      {/* Add Meal Modal */}
      <AddMealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchLogs}
      />
    </main>
  );
}
