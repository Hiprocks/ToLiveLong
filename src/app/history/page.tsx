"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import {
  cacheKeys,
  getCachedData,
  markRecordCacheDirty,
  setCachedData,
} from "@/lib/clientSyncCache";
import { getLocalDateString } from "@/lib/date";
import { DailyTargets, MealRecord } from "@/lib/types";

const today = getLocalDateString();

type Tone = "normal" | "low" | "high";

type EditDraft = {
  date: string;
  food_name: string;
  amount: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  sugar: string;
  sodium: string;
};

const toEditDraft = (record: MealRecord): EditDraft => ({
  date: record.date,
  food_name: record.food_name,
  amount: String(record.amount),
  calories: String(record.calories),
  carbs: String(record.carbs),
  protein: String(record.protein),
  fat: String(record.fat),
  sugar: String(record.sugar),
  sodium: String(record.sodium),
});

const parseNumber = (value: string): number => {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePositiveNumber = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const scaleNutrients = (amount: number, base: MealRecord) => {
  const ratio = base.amount > 0 ? amount / base.amount : 0;
  return {
    calories: String(Math.round(base.calories * ratio)),
    carbs: String(Math.round(base.carbs * ratio)),
    protein: String(Math.round(base.protein * ratio)),
    fat: String(Math.round(base.fat * ratio)),
    sugar: String(Math.round(base.sugar * ratio)),
    sodium: String(Math.round(base.sodium * ratio)),
  };
};

const getTone = (
  key: "carbs" | "protein" | "fat" | "sugar" | "sodium",
  value: number,
  targets?: DailyTargets | null
): Tone => {
  if (!targets) return "normal";
  const target = targets[key];
  if (!target || target <= 0) return "normal";
  const ratio = value / target;

  if (key === "sugar" || key === "sodium") {
    return ratio > 1 ? "high" : "normal";
  }
  if (ratio < 0.85) return "low";
  if (ratio > 1.05) return "high";
  return "normal";
};

export default function HistoryPage() {
  const [date, setDate] = useState(today);
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<MealRecord | null>(null);
  const [editBase, setEditBase] = useState<MealRecord | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [syncByAmount, setSyncByAmount] = useState(true);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [targets, setTargets] = useState<DailyTargets | null>(null);

  const load = async (targetDate: string, force = false) => {
    setLoading(true);
    try {
      const recordsKey = cacheKeys.records(targetDate);
      const cached = !force ? getCachedData<MealRecord[]>(recordsKey) : null;
      if (cached) {
        setRecords(cached);
        setErrorMessage(null);
        return;
      }

      const response = await fetch(`/api/sheets/records?date=${targetDate}`, { cache: "no-store" });
      if (!response.ok) throw new Error("기록을 불러오지 못했습니다.");
      const data = (await response.json()) as MealRecord[];
      setCachedData(recordsKey, data);
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

  useEffect(() => {
    let isActive = true;
    const loadTargets = async () => {
      try {
        const cached = getCachedData<DailyTargets>(cacheKeys.user);
        if (cached) {
          if (isActive) setTargets(cached);
          return;
        }

        const response = await fetch("/api/sheets/user", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as DailyTargets;
        if (isActive) setTargets(data);
        setCachedData(cacheKeys.user, data);
      } catch {
        if (isActive) setTargets(null);
      }
    };
    void loadTargets();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!editing) return;
    const scrollY = window.scrollY;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyPosition = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyWidth = document.body.style.width;
    const prevBodyTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.position = prevBodyPosition;
      document.body.style.top = prevBodyTop;
      document.body.style.width = prevBodyWidth;
      document.body.style.touchAction = prevBodyTouchAction;
      window.scrollTo(0, scrollY);
    };
  }, [editing]);

  const totals = records.reduce(
    (acc, record) => ({
      carbs: acc.carbs + record.carbs,
      protein: acc.protein + record.protein,
      fat: acc.fat + record.fat,
      sugar: acc.sugar + record.sugar,
      sodium: acc.sodium + record.sodium,
    }),
    { carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
  );

  const tones = {
    carbs: getTone("carbs", totals.carbs, targets),
    protein: getTone("protein", totals.protein, targets),
    fat: getTone("fat", totals.fat, targets),
    sugar: getTone("sugar", totals.sugar, targets),
    sodium: getTone("sodium", totals.sodium, targets),
  };

  const openEdit = (record: MealRecord) => {
    setEditing(record);
    setEditBase(record);
    setEditDraft(toEditDraft(record));
    setSyncByAmount(true);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditBase(null);
    setEditDraft(null);
    setSyncByAmount(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 기록을 삭제하시겠습니까?")) return;
    const response = await fetch(`/api/sheets/records/${id}`, { method: "DELETE" });
    if (!response.ok) {
      setErrorMessage("삭제에 실패했습니다.");
      return;
    }
    markRecordCacheDirty(date);
    setErrorMessage(null);
    await load(date, true);
  };

  const handleAmountChange = (raw: string) => {
    if (!editDraft) return;
    const next: EditDraft = { ...editDraft, amount: raw };

    if (syncByAmount && editBase) {
      const amount = parsePositiveNumber(raw);
      if (amount) {
        Object.assign(next, scaleNutrients(amount, editBase));
      }
    }

    setEditDraft(next);
  };

  const handleSyncToggle = (checked: boolean) => {
    setSyncByAmount(checked);
    if (!checked || !editDraft || !editBase) return;

    const amount = parsePositiveNumber(editDraft.amount);
    if (!amount) return;

    setEditDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...scaleNutrients(amount, editBase),
      };
    });
  };

  const handleUpdate = async () => {
    if (!editing || !editDraft) return;

    const amount = parsePositiveNumber(editDraft.amount);
    if (!editDraft.food_name.trim()) {
      setErrorMessage("음식명은 필수입니다.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDraft.date)) {
      setErrorMessage("날짜를 확인해 주세요.");
      return;
    }
    if (!amount) {
      setErrorMessage("섭취량은 1g 이상이어야 합니다.");
      return;
    }

    const payload: MealRecord = {
      ...editing,
      date: editDraft.date,
      food_name: editDraft.food_name.trim(),
      amount,
      calories: parseNumber(editDraft.calories),
      carbs: parseNumber(editDraft.carbs),
      protein: parseNumber(editDraft.protein),
      fat: parseNumber(editDraft.fat),
      sugar: parseNumber(editDraft.sugar),
      sodium: parseNumber(editDraft.sodium),
    };

    const response = await fetch(`/api/sheets/records/${editing.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      setErrorMessage("수정에 실패했습니다.");
      return;
    }

    markRecordCacheDirty(editing.date);
    markRecordCacheDirty(editDraft.date);
    setErrorMessage(null);
    closeEdit();
    await load(date, true);
  };

  const handleSaveTemplateFromEdit = async () => {
    if (!editDraft) return;

    const amount = parsePositiveNumber(editDraft.amount);
    if (!editDraft.food_name.trim()) {
      setErrorMessage("음식명은 필수입니다.");
      return;
    }
    if (!amount) {
      setErrorMessage("섭취량은 1g 이상이어야 합니다.");
      return;
    }

    setTemplateSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        food_name: editDraft.food_name.trim(),
        base_amount: amount,
        calories: parseNumber(editDraft.calories),
        carbs: parseNumber(editDraft.carbs),
        protein: parseNumber(editDraft.protein),
        fat: parseNumber(editDraft.fat),
        sugar: parseNumber(editDraft.sugar),
        sodium: parseNumber(editDraft.sodium),
      };

      const response = await fetch("/api/sheets/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "템플릿 등록에 실패했습니다.");
      }

      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "템플릿 등록에 실패했습니다.");
    } finally {
      setTemplateSaving(false);
    }
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
        <p className="text-muted-foreground">선택한 날짜의 기록이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {records.map((record) => (
            <article
              key={record.id}
              className="rounded-2xl border border-border/80 bg-card/95 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="max-w-[65%] truncate text-sm font-semibold sm:text-base">{record.food_name}</h3>
                    <span className="text-xs font-medium text-muted-foreground">{record.amount}g</span>
                    <span className="text-sm font-bold text-primary sm:text-base">{record.calories} kcal</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => openEdit(record)}
                    className="rounded-lg border border-border/80 bg-background/60 p-2 text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                    aria-label={`${record.food_name} 수정`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => void handleDelete(record.id)}
                    className="rounded-lg border border-red-400/30 bg-red-500/10 p-2 text-red-300 transition-colors hover:border-red-300/60 hover:bg-red-500/20"
                    aria-label={`${record.food_name} 삭제`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                <MetricChip label="탄수" value={`${record.carbs}g`} tone={tones.carbs} />
                <MetricChip label="단백질" value={`${record.protein}g`} tone={tones.protein} />
                <MetricChip label="지방" value={`${record.fat}g`} tone={tones.fat} />
                <MetricChip label="당" value={`${record.sugar}g`} tone={tones.sugar} />
                <MetricChip label="나트륨" value={`${record.sodium}mg`} tone={tones.sodium} />
              </div>
            </article>
          ))}
        </div>
      )}

      {editing && editDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onWheel={(event) => event.preventDefault()}
          onTouchMove={(event) => event.preventDefault()}
        >
          <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4">
            <h2 className="text-lg font-semibold">기록 수정</h2>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">섭취 날짜</span>
              <input
                type="date"
                value={editDraft.date}
                onChange={(e) => setEditDraft({ ...editDraft, date: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">음식명</span>
              <input
                value={editDraft.food_name}
                onChange={(e) => setEditDraft({ ...editDraft, food_name: e.target.value })}
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              />
            </label>

            <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={syncByAmount}
                onChange={(e) => handleSyncToggle(e.target.checked)}
              />
              섭취량 대비 영양성분 변동
            </label>

            <div className="grid grid-cols-2 gap-2">
              <LabeledNumberInput
                label="섭취량(g)"
                value={editDraft.amount}
                onChange={handleAmountChange}
              />
              <LabeledNumberInput
                label="칼로리(kcal)"
                value={editDraft.calories}
                onChange={(value) => setEditDraft({ ...editDraft, calories: value })}
              />
              <LabeledNumberInput
                label="탄수화물(g)"
                value={editDraft.carbs}
                onChange={(value) => setEditDraft({ ...editDraft, carbs: value })}
              />
              <LabeledNumberInput
                label="단백질(g)"
                value={editDraft.protein}
                onChange={(value) => setEditDraft({ ...editDraft, protein: value })}
              />
              <LabeledNumberInput
                label="지방(g)"
                value={editDraft.fat}
                onChange={(value) => setEditDraft({ ...editDraft, fat: value })}
              />
              <LabeledNumberInput
                label="당(g)"
                value={editDraft.sugar}
                onChange={(value) => setEditDraft({ ...editDraft, sugar: value })}
              />
              <LabeledNumberInput
                className="col-span-2"
                label="나트륨(mg)"
                value={editDraft.sodium}
                onChange={(value) => setEditDraft({ ...editDraft, sodium: value })}
              />
            </div>
            <button
              onClick={() => void handleSaveTemplateFromEdit()}
              disabled={templateSaving}
              className="w-full rounded-lg border border-border bg-background py-2 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              {templateSaving ? "템플릿 저장 중..." : "템플릿 등록"}
            </button>
            <div className="flex gap-2">
              <button onClick={closeEdit} className="flex-1 rounded-lg bg-muted py-2">
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

function LabeledNumberInput({
  label,
  value,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <label className={`space-y-1 text-xs text-muted-foreground ${className}`}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground"
      />
    </label>
  );
}

function MetricChip({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        tone === "low"
          ? "border-sky-400/40 bg-sky-500/10"
          : tone === "high"
            ? "border-rose-400/40 bg-rose-500/10"
            : "border-border/70 bg-background/60"
      }`}
    >
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div
        className={`text-xs font-semibold ${
          tone === "low" ? "text-sky-300" : tone === "high" ? "text-rose-300" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
