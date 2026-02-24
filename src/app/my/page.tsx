"use client";

import { useEffect, useState } from "react";
import { DailyTargets } from "@/lib/types";

const defaultTargets: DailyTargets = {
  calories: 2300,
  carbs: 320,
  protein: 120,
  fat: 60,
  sugar: 30,
  sodium: 2000,
};

export default function MyPage() {
  const [targets, setTargets] = useState<DailyTargets>(defaultTargets);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isActive = true;
    const loadTargets = async () => {
      try {
        const response = await fetch("/api/sheets/user", { cache: "no-store" });
        if (!response.ok) throw new Error("Failed to load targets");
        const data = (await response.json()) as DailyTargets;
        if (isActive) setTargets(data);
      } catch (error) {
        if (isActive) console.error(error);
      } finally {
        if (isActive) setLoading(false);
      }
    };
    void loadTargets();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/sheets/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targets),
      });
      if (!response.ok) throw new Error("Failed to save targets");
      alert("Saved.");
    } catch (error) {
      console.error(error);
      alert("Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-muted-foreground">Loading...</div>;
  }

  return (
    <main className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">My Targets</h1>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ["calories", "Calories"],
            ["carbs", "Carbs (g)"],
            ["protein", "Protein (g)"],
            ["fat", "Fat (g)"],
            ["sugar", "Sugar (g)"],
            ["sodium", "Sodium (mg)"],
          ] as const
        ).map(([key, label]) => (
          <div key={key}>
            <label className="text-sm text-muted-foreground">{label}</label>
            <input
              type="number"
              value={targets[key]}
              onChange={(e) =>
                setTargets((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
              }
              className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Targets"}
      </button>
    </main>
  );
}

