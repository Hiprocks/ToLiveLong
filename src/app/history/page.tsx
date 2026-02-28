"use client";

import { useEffect, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";
import { MealRecord } from "@/lib/types";

const today = getLocalDateString();
const HISTORY_CACHE_TTL_MS = 30_000;
const historyCache = new Map<string, { fetchedAt: number; records: MealRecord[] }>();

export default function HistoryPage() {
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MealRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = async (targetDate: string, force = false) => {
    setLoading(true);
    try {
      const cached = historyCache.get(targetDate);
      if (!force && cached && Date.now() - cached.fetchedAt < HISTORY_CACHE_TTL_MS) {
        setRecords(cached.records);
        setErrorMessage(null);
        return;
      }

      const response = await fetch(`/api/sheets/records?date=${targetDate}`, { cache: "no-store" });
      if (!response.ok) throw new Error("기록을 불러오지 못했습니다.");
      const data = (await response.json()) as MealRecord[];
      historyCache.set(targetDate, { fetchedAt: Date.now(), records: data });
      setRecords(data);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("기록 조회에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load(date);
  }, [date]);

  const handleDelete = async (id: string) => {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    const response = await fetch(`/api/sheets/records/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setErrorMessage("삭제에 실패했습니다.");
      return;
    }
    setErrorMessage(null);
    await load(date, true);
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
    await load(date, true);
  };

  return (
    <main className="space-y-4 p-4 pb-24">
      <h1 className="text-2xl font-bold">기록</h1>
      <ErrorBanner message={errorMessage} />
      <div className="flex items-center gap-3">
        <label className="text-sm text-muted-foreground">날짜</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-border bg-input px-3 py-2"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">불러오는 중...</p>
      ) : records.length === 0 ? (
        <p className="text-muted-foreground">선택한 날짜에 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <div key={record.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{record.food_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {record.amount}g | {record.calories} kcal
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(record)} className="rounded-md bg-muted px-3 py-1 text-sm">
                    수정
                  </button>
                  <button
                    onClick={() => void handleDelete(record.id)}
                    className="rounded-md bg-red-500 px-3 py-1 text-sm text-white"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">기록 수정</h2>
            <input
              value={editing.food_name}
              onChange={(e) => setEditing({ ...editing, food_name: e.target.value })}
              className="w-full rounded-lg border border-border bg-input px-3 py-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={editing.amount}
                onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-input px-3 py-2"
                placeholder="중량"
              />
              <input
                type="number"
                value={editing.calories}
                onChange={(e) => setEditing({ ...editing, calories: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-input px-3 py-2"
                placeholder="칼로리"
              />
              <input
                type="number"
                value={editing.carbs}
                onChange={(e) => setEditing({ ...editing, carbs: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-input px-3 py-2"
                placeholder="탄수화물"
              />
              <input
                type="number"
                value={editing.protein}
                onChange={(e) => setEditing({ ...editing, protein: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-input px-3 py-2"
                placeholder="단백질"
              />
              <input
                type="number"
                value={editing.fat}
                onChange={(e) => setEditing({ ...editing, fat: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-input px-3 py-2"
                placeholder="지방"
              />
              <input
                type="number"
                value={editing.sugar}
                onChange={(e) => setEditing({ ...editing, sugar: Number(e.target.value) || 0 })}
                className="rounded-lg border border-border bg-input px-3 py-2"
                placeholder="당"
              />
              <input
                type="number"
                value={editing.sodium}
                onChange={(e) => setEditing({ ...editing, sodium: Number(e.target.value) || 0 })}
                className="col-span-2 rounded-lg border border-border bg-input px-3 py-2"
                placeholder="나트륨"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 rounded-lg bg-muted py-2">
                취소
              </button>
              <button
                onClick={() => void handleUpdate()}
                className="flex-1 rounded-lg bg-primary py-2 text-primary-foreground"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}