"use client";

import { useEffect, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";
import { MealRecord } from "@/lib/types";

const today = getLocalDateString();

export default function HistoryPage() {
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MealRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async (targetDate: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sheets/records?date=${targetDate}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Failed to load records");
      const data = (await response.json()) as MealRecord[];
      setRecords(data);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("히스토리 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isActive = true;
    const run = async () => {
      await load(date);
      if (!isActive) return;
    };
    void run();
    return () => {
      isActive = false;
    };
  }, [date]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    const response = await fetch(`/api/sheets/records/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setErrorMessage("삭제에 실패했습니다.");
      return;
    }
    setErrorMessage(null);
    await load(date);
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
    await load(date);
  };

  return (
    <main className="p-4 space-y-4 pb-24">
      <h1 className="text-2xl font-bold">History</h1>
      <ErrorBanner message={errorMessage} />
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="bg-input border border-border rounded-lg px-3 py-2"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : records.length === 0 ? (
        <p className="text-muted-foreground">No records for this date.</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="border border-border rounded-xl p-3 bg-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{record.food_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.meal_type} | {record.amount}g | {record.calories} kcal
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditing(record)}
                    className="px-3 py-1 text-sm rounded-md bg-muted"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void handleDelete(record.id)}
                    className="px-3 py-1 text-sm rounded-md bg-red-500 text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-center justify-center">
          <div className="w-full max-w-md bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="text-lg font-semibold">Edit Record</h2>
            <input
              value={editing.food_name}
              onChange={(e) => setEditing({ ...editing, food_name: e.target.value })}
              className="w-full bg-input border border-border rounded-lg px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) || 0 })}
                className="bg-input border border-border rounded-lg px-3 py-2"
                placeholder="Amount"
              />
              <input
                type="number"
                value={editing.calories}
                onChange={(e) =>
                  setEditing({ ...editing, calories: Number(e.target.value) || 0 })
                }
                className="bg-input border border-border rounded-lg px-3 py-2"
                placeholder="Calories"
              />
              <input
                type="number"
                value={editing.carbs}
                onChange={(e) => setEditing({ ...editing, carbs: Number(e.target.value) || 0 })}
                className="bg-input border border-border rounded-lg px-3 py-2"
                placeholder="Carbs"
              />
              <input
                type="number"
                value={editing.protein}
                onChange={(e) =>
                  setEditing({ ...editing, protein: Number(e.target.value) || 0 })
                }
                className="bg-input border border-border rounded-lg px-3 py-2"
                placeholder="Protein"
              />
              <input
                type="number"
                value={editing.fat}
                onChange={(e) => setEditing({ ...editing, fat: Number(e.target.value) || 0 })}
                className="bg-input border border-border rounded-lg px-3 py-2"
                placeholder="Fat"
              />
              <input
                type="number"
                value={editing.sugar}
                onChange={(e) => setEditing({ ...editing, sugar: Number(e.target.value) || 0 })}
                className="bg-input border border-border rounded-lg px-3 py-2"
                placeholder="Sugar"
              />
              <input
                type="number"
                value={editing.sodium}
                onChange={(e) =>
                  setEditing({ ...editing, sodium: Number(e.target.value) || 0 })
                }
                className="bg-input border border-border rounded-lg px-3 py-2 col-span-2"
                placeholder="Sodium"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 py-2 bg-muted rounded-lg">
                Cancel
              </button>
              <button
                onClick={() => void handleUpdate()}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
