"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { ko } from "date-fns/locale";
import { Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart } from "recharts";
import DateNavCard from "@/components/DateNavCard";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import MealEntryFab from "@/components/MealEntryFab";
import { cacheKeys, getCachedData, markRecordCacheDirty, setCachedData } from "@/lib/clientSyncCache";
import { getLocalDateString } from "@/lib/date";
import {
  applyIntakeAdjustments,
  DEFAULT_INTAKE_META,
  invertAdjustedValue,
  MealNutritionFields,
  normalizeIntakeMeta,
  RATIO_OPTIONS,
  isSoupyMeal,
} from "@/lib/mealAdjustments";
import { showToast } from "@/lib/toast";
import { DailyTargets, IntakeMeta, MealRecord } from "@/lib/types";

const today = getLocalDateString();
const DEFAULT_TARGETS: DailyTargets = { calories: 2300, carbs: 320, protein: 120, fat: 60, sugar: 30, sodium: 2000 };
const NUTRIENTS: Array<{ key: keyof DailyTargets; label: string; unit: string }> = [
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
const TONE_CHART_COLOR: Record<ProgressTone, string> = {
  low: "rgba(59,130,246,0.75)",
  ok: "rgba(34,197,94,0.75)",
  high: "rgba(239,68,68,0.75)",
};
const TONE_TEXT_COLOR: Record<ProgressTone, string> = {
  low: "rgb(59,130,246)",
  ok: "rgb(34,197,94)",
  high: "rgb(239,68,68)",
};

type EditDraft = {
  date: string;
  food_name: string;
  intakeMeta: IntakeMeta;
  amount: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  sugar: string;
  sodium: string;
};
const parseNumber = (v: string) => (v.trim() === "" ? 0 : Number.isFinite(Number(v)) ? Number(v) : 0);
const parsePositive = (v: string) => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};
const getBaseNutritionFromRecord = (record: MealRecord): MealNutritionFields => {
  const meta = normalizeIntakeMeta(record.intakeMeta) ?? DEFAULT_INTAKE_META;
  const isSoupy = isSoupyMeal(record.food_name);
  return {
    amount: invertAdjustedValue("amount", record.amount, meta, isSoupy),
    calories: invertAdjustedValue("calories", record.calories, meta, isSoupy),
    carbs: invertAdjustedValue("carbs", record.carbs, meta, isSoupy),
    protein: invertAdjustedValue("protein", record.protein, meta, isSoupy),
    fat: invertAdjustedValue("fat", record.fat, meta, isSoupy),
    sugar: invertAdjustedValue("sugar", record.sugar, meta, isSoupy),
    sodium: invertAdjustedValue("sodium", record.sodium, meta, isSoupy),
  };
};
const buildAdjustedDraft = (date: string, foodName: string, base: MealNutritionFields, intakeMeta: IntakeMeta): EditDraft => {
  const adjusted = applyIntakeAdjustments(base, intakeMeta, isSoupyMeal(foodName));
  return {
    date,
    food_name: foodName,
    intakeMeta,
    amount: String(adjusted.amount),
    calories: String(adjusted.calories),
    carbs: String(adjusted.carbs),
    protein: String(adjusted.protein),
    fat: String(adjusted.fat),
    sugar: String(adjusted.sugar),
    sodium: String(adjusted.sodium),
  };
};

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(today);
  const [records, setRecords] = useState<MealRecord[]>([]);
  const [targets, setTargets] = useState<DailyTargets>(DEFAULT_TARGETS);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadingTargets, setLoadingTargets] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editing, setEditing] = useState<MealRecord | null>(null);
  const [editBase, setEditBase] = useState<MealRecord | null>(null);
  const [editBaseNutrition, setEditBaseNutrition] = useState<MealNutritionFields | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [syncByAmount, setSyncByAmount] = useState(true);
  const [templateSaving, setTemplateSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isChartReady, setIsChartReady] = useState(false);
  const datePickerRef = useRef<HTMLInputElement>(null);

  const loadRecords = useCallback(async (targetDate: string, force = false) => {
    setLoadingRecords(true);
    try {
      const key = cacheKeys.records(targetDate);
      const cached = !force ? getCachedData<MealRecord[]>(key) : null;
      if (cached) {
        setRecords(cached);
        setErrorMessage(null);
        return;
      }
      const response = await fetch(`/api/sheets/records?date=${targetDate}`, { cache: "no-store" });
      if (!response.ok) throw new Error("records");
      const data = (await response.json()) as MealRecord[];
      setCachedData(key, data);
      setRecords(data);
      setErrorMessage(null);
    } catch (error) {
      console.error(error);
      setErrorMessage("湲곕줉 議고쉶???ㅽ뙣?덉뒿?덈떎.");
    } finally {
      setLoadingRecords(false);
    }
  }, []);

  const refreshSelectedDate = useCallback(async () => {
    await loadRecords(selectedDate, true);
  }, [loadRecords, selectedDate]);

  useEffect(() => void loadRecords(selectedDate), [loadRecords, selectedDate]);
  useEffect(() => setIsChartReady(true), []);
  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setLoadingTargets(true);
      try {
        const cached = getCachedData<DailyTargets>(cacheKeys.user);
        if (cached) {
          if (isActive) setTargets(cached);
          return;
        }
        const response = await fetch("/api/sheets/user", { cache: "no-store" });
        if (!response.ok) throw new Error("user");
        const data = (await response.json()) as DailyTargets;
        setCachedData(cacheKeys.user, data);
        if (isActive) setTargets(data);
      } catch (error) {
        console.error(error);
        if (isActive) setErrorMessage("紐⑺몴 ?뺣낫瑜?遺덈윭?ㅼ? 紐삵뻽?듬땲??");
      } finally {
        if (isActive) setLoadingTargets(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const totals = useMemo(
    () =>
      records.reduce(
        (acc, record) => ({ calories: acc.calories + record.calories, carbs: acc.carbs + record.carbs, protein: acc.protein + record.protein, fat: acc.fat + record.fat, sugar: acc.sugar + record.sugar, sodium: acc.sodium + record.sodium }),
        { calories: 0, carbs: 0, protein: 0, fat: 0, sugar: 0, sodium: 0 }
      ),
    [records]
  );
  const ratio = targets.calories > 0 ? totals.calories / targets.calories : 0;
  const progress = Math.min(1, Math.max(0, ratio));
  const calorieTone = getProgressTone(ratio);
  const donutData = [
    { name: "??랬", value: progress, color: TONE_CHART_COLOR[calorieTone] },
    { name: "?붿뿬", value: Math.max(0, 1 - progress), color: "rgba(148,163,184,0.22)" },
  ];

  const openEdit = (record: MealRecord) => {
    const intakeMeta = normalizeIntakeMeta(record.intakeMeta) ?? DEFAULT_INTAKE_META;
    const baseNutrition = getBaseNutritionFromRecord(record);
    setEditing(record);
    setEditBase(record);
    setEditBaseNutrition(baseNutrition);
    setEditDraft(buildAdjustedDraft(record.date, record.food_name, baseNutrition, intakeMeta));
    setSyncByAmount(true);
  };
  const closeEdit = () => {
    setEditing(null);
    setEditBase(null);
    setEditBaseNutrition(null);
    setEditDraft(null);
    setSyncByAmount(true);
  };
  const handleAmountChange = (raw: string) => {
    if (!editDraft || !editBaseNutrition) return;
    const amount = parsePositive(raw);
    if (!amount) {
      setEditDraft((prev) => (prev ? { ...prev, amount: raw } : prev));
      return;
    }

    const nextBase = {
      ...editBaseNutrition,
      amount: invertAdjustedValue("amount", amount, editDraft.intakeMeta, isSoupyMeal(editDraft.food_name)),
    };
    setEditBaseNutrition(nextBase);

    if (syncByAmount && editBase) {
      const ratio = editBase.amount > 0 ? nextBase.amount / editBase.amount : 0;
      nextBase.calories = Math.round(editBase.calories * ratio);
      nextBase.carbs = Math.round(editBase.carbs * ratio);
      nextBase.protein = Math.round(editBase.protein * ratio);
      nextBase.fat = Math.round(editBase.fat * ratio);
      nextBase.sugar = Math.round(editBase.sugar * ratio);
      nextBase.sodium = Math.round(editBase.sodium * ratio);
    }

    setEditDraft(buildAdjustedDraft(editDraft.date, editDraft.food_name, nextBase, editDraft.intakeMeta));
  };
  const handleSyncToggle = (checked: boolean) => {
    setSyncByAmount(checked);
    if (!checked || !editDraft || !editBase || !editBaseNutrition) return;
    const nextBase = {
      ...editBaseNutrition,
      calories: Math.round(editBase.calories * (editBaseNutrition.amount / editBase.amount)),
      carbs: Math.round(editBase.carbs * (editBaseNutrition.amount / editBase.amount)),
      protein: Math.round(editBase.protein * (editBaseNutrition.amount / editBase.amount)),
      fat: Math.round(editBase.fat * (editBaseNutrition.amount / editBase.amount)),
      sugar: Math.round(editBase.sugar * (editBaseNutrition.amount / editBase.amount)),
      sodium: Math.round(editBase.sodium * (editBaseNutrition.amount / editBase.amount)),
    };
    setEditBaseNutrition(nextBase);
    setEditDraft(buildAdjustedDraft(editDraft.date, editDraft.food_name, nextBase, editDraft.intakeMeta));
  };
  const handleEditNutrientChange = (key: keyof Omit<MealNutritionFields, "amount">, raw: string) => {
    if (!editDraft || !editBaseNutrition) return;
    const parsed = parseNumber(raw);
    const nextBase = {
      ...editBaseNutrition,
      [key]: invertAdjustedValue(key, parsed, editDraft.intakeMeta, isSoupyMeal(editDraft.food_name)),
    };
    setEditBaseNutrition(nextBase);
    setEditDraft(buildAdjustedDraft(editDraft.date, editDraft.food_name, nextBase, editDraft.intakeMeta));
  };
  const handleEditSoupPreferenceChange = (checked: boolean) => {
    if (!editDraft || !editBaseNutrition) return;
    const intakeMeta: IntakeMeta = {
      ...editDraft.intakeMeta,
      adjustments: {
        ...editDraft.intakeMeta.adjustments,
        soupPreference: checked ? "solids_only" : "normal",
      },
    };
    setEditDraft(buildAdjustedDraft(editDraft.date, editDraft.food_name, editBaseNutrition, intakeMeta));
  };
  const handleEditConsumptionRatioChange = (ratio: number) => {
    if (!editDraft || !editBaseNutrition) return;
    const intakeMeta: IntakeMeta = {
      ...editDraft.intakeMeta,
      adjustments: {
        ...editDraft.intakeMeta.adjustments,
        consumptionRatio: ratio,
      },
    };
    setEditDraft(buildAdjustedDraft(editDraft.date, editDraft.food_name, editBaseNutrition, intakeMeta));
  };
  const handleDeleteRecord = async (id: string, targetDate: string) => {
    if (!confirm("??湲곕줉????젣?섏떆寃좎뒿?덇퉴?")) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/sheets/records/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setErrorMessage("??젣???ㅽ뙣?덉뒿?덈떎.");
        return;
      }
      markRecordCacheDirty(targetDate);
      closeEdit();
      setErrorMessage(null);
      await refreshSelectedDate();
      showToast({ message: "湲곕줉 ??젣媛 ?꾨즺?섏뿀?듬땲??", type: "success" });
    } finally {
      setDeleting(false);
    }
  };
  const handleUpdateRecord = async () => {
    if (!editing || !editDraft) return;
    const amount = parsePositive(editDraft.amount);
    if (!editDraft.food_name.trim()) return setErrorMessage("?뚯떇紐낆? ?꾩닔?낅땲??");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(editDraft.date)) return setErrorMessage("?좎쭨瑜??뺤씤??二쇱꽭??");
    if (!amount) return setErrorMessage("??랬?됱? 1g ?댁긽?댁뼱???⑸땲??");
    setUpdating(true);
    try {
      const payload: MealRecord = {
        ...editing,
        date: editDraft.date,
        food_name: editDraft.food_name.trim(),
        intakeMeta: editDraft.intakeMeta,
        amount,
        calories: parseNumber(editDraft.calories),
        carbs: parseNumber(editDraft.carbs),
        protein: parseNumber(editDraft.protein),
        fat: parseNumber(editDraft.fat),
        sugar: parseNumber(editDraft.sugar),
        sodium: parseNumber(editDraft.sodium),
      };
      const response = await fetch(`/api/sheets/records/${editing.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) return setErrorMessage("?섏젙???ㅽ뙣?덉뒿?덈떎.");
      markRecordCacheDirty(editing.date);
      markRecordCacheDirty(editDraft.date);
      setErrorMessage(null);
      closeEdit();
      await refreshSelectedDate();
      showToast({ message: "湲곕줉 ?섏젙???꾨즺?섏뿀?듬땲??", type: "success" });
    } finally {
      setUpdating(false);
    }
  };
  const handleSaveTemplateFromEdit = async () => {
    if (!editDraft) return;
    const amount = parsePositive(editDraft.amount);
    if (!editDraft.food_name.trim()) return setErrorMessage("?뚯떇紐낆? ?꾩닔?낅땲??");
    if (!amount) return setErrorMessage("??랬?됱? 1g ?댁긽?댁뼱???⑸땲??");
    setTemplateSaving(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/sheets/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ food_name: editDraft.food_name.trim(), base_amount: amount, calories: parseNumber(editDraft.calories), carbs: parseNumber(editDraft.carbs), protein: parseNumber(editDraft.protein), fat: parseNumber(editDraft.fat), sugar: parseNumber(editDraft.sugar), sodium: parseNumber(editDraft.sodium) }) });
      if (!response.ok) throw new Error("template");
      showToast({ message: "利먭꺼李얘린 ?깅줉???꾨즺?섏뿀?듬땲??", type: "success" });
    } catch (error) {
      console.error(error);
      setErrorMessage("利먭꺼李얘린 ?깅줉???ㅽ뙣?덉뒿?덈떎.");
    } finally {
      setTemplateSaving(false);
    }
  };

  const moveDateByDays = (days: number) => {
    const nextDate = format(addDays(parseISO(selectedDate), days), "yyyy-MM-dd");
    if (nextDate <= today) setSelectedDate(nextDate);
  };
  const openDatePicker = () => {
    const datePicker = datePickerRef.current;
    if (!datePicker) return;
    const picker = datePicker as HTMLInputElement & { showPicker?: () => void };
    if (typeof picker.showPicker === "function") return picker.showPicker();
    datePicker.focus();
    datePicker.click();
  };

  return (
    <motion.main
      className="space-y-4 p-4 pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <h1 className="text-2xl font-bold">대시보드</h1>

      <DateNavCard
        onPrev={() => moveDateByDays(-1)}
        onNext={() => moveDateByDays(1)}
        canGoNext={selectedDate < today}
        centerLabel="조회 날짜"
        centerValue={`${selectedDate} (${format(parseISO(selectedDate), "EEE", { locale: ko })})`}
        onCenterClick={openDatePicker}
        prevAriaLabel="이전 날짜"
        nextAriaLabel="다음 날짜"
        centerAriaLabel="날짜 선택 열기"
      >
        <input
          ref={datePickerRef}
          type="date"
          value={selectedDate}
          max={today}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="sr-only"
          aria-label="날짜 바로 이동"
        />
      </DateNavCard>

      <ErrorBanner message={errorMessage} />

      <section className="rounded-2xl border border-border/80 bg-card p-4">
        <h2 className="mb-3 text-base font-semibold">칼로리 진행</h2>
        <div className="flex flex-col items-center gap-3">
          <div className="relative h-[220px] w-[220px]">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold" style={{ color: TONE_TEXT_COLOR[calorieTone] }}>
                {totals.calories}
              </p>
              <p className="text-sm text-muted-foreground">/ {targets.calories} kcal</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            남은 칼로리 {Math.max(0, targets.calories - totals.calories)} kcal
          </p>
        </div>
        <div className="mt-4 space-y-3">
          {NUTRIENTS.map((item) => {
            const target = Math.max(0, targets[item.key]);
            const current = Math.max(0, totals[item.key]);
            const ratioRaw = target > 0 ? current / target : 0;
            const r = Math.min(1, Math.max(0, ratioRaw));
            const tone = getProgressTone(ratioRaw);

            return (
              <div key={item.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span style={{ color: TONE_TEXT_COLOR[tone] }}>
                    {current} / {target} {item.unit}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${r * 100}%`, backgroundColor: TONE_CHART_COLOR[tone] }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border/80 bg-card p-4">
        <h2 className="mb-3 text-base font-semibold">식단 기록</h2>
        {!loadingRecords && records.length === 0 ? (
          <p className="text-sm text-muted-foreground">선택한 날짜에 등록된 식단이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {records.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-border/70 bg-background/70 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="max-w-[65%] truncate text-sm font-semibold sm:text-base">
                        {record.food_name}
                      </h3>
                      <span className="text-xs text-muted-foreground">{record.amount}g</span>
                      <span className="text-sm font-bold text-primary">{record.calories} kcal</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openEdit(record)}
                    className="rounded-lg border border-border/80 bg-background/60 p-2 text-muted-foreground hover:border-primary/60 hover:text-foreground"
                    aria-label={`${record.food_name} 수정`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <MetricChip label="탄수" value={`${record.carbs}g`} />
                  <MetricChip label="단백질" value={`${record.protein}g`} />
                  <MetricChip label="지방" value={`${record.fat}g`} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && editDraft && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="flex min-h-full items-start justify-center py-2 sm:items-center">
            <div className="flex max-h-[calc(100vh-2rem-env(safe-area-inset-bottom))] w-full max-w-md flex-col rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-4">
                <h2 className="text-lg font-semibold">기록 수정</h2>
              </div>

              <div className="space-y-4 overflow-y-auto px-4 py-4">
                <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">기록 날짜</span>
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
                onChange={(e) => {
                  if (!editBaseNutrition) {
                    setEditDraft({ ...editDraft, food_name: e.target.value });
                    return;
                  }

                  const nextFoodName = e.target.value;
                  const soupPreference = editDraft.intakeMeta.adjustments?.soupPreference;
                  const nextIntakeMeta: IntakeMeta =
                    soupPreference === "solids_only" &&
                    !isSoupyMeal(nextFoodName)
                      ? {
                          ...editDraft.intakeMeta,
                          adjustments: {
                            ...editDraft.intakeMeta.adjustments,
                            soupPreference: "normal",
                          },
                        }
                      : editDraft.intakeMeta;

                  setEditDraft(
                    buildAdjustedDraft(
                      editDraft.date,
                      nextFoodName,
                      editBaseNutrition,
                      nextIntakeMeta,
                    ),
                  );
                }}
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              />
                </label>

                <div className="space-y-2 rounded-xl border border-border/70 bg-background/40 p-3">
              <div className="text-sm font-semibold text-foreground">섭취 보정</div>

              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editDraft.intakeMeta.adjustments?.soupPreference === "solids_only"}
                  disabled={!isSoupyMeal(editDraft.food_name)}
                  onChange={(e) => handleEditSoupPreferenceChange(e.target.checked)}
                />
                <span
                  className={
                    isSoupyMeal(editDraft.food_name) ? "text-foreground" : "text-muted-foreground"
                  }
                >
                  건더기 위주로 섭취
                </span>
              </label>

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">섭취 비율</div>
                <div className="grid grid-cols-4 gap-2">
                  {RATIO_OPTIONS.map((ratio) => {
                    const isSelected =
                      editDraft.intakeMeta.adjustments?.consumptionRatio === ratio;

                    return (
                      <button
                        key={ratio}
                        type="button"
                        onClick={() => handleEditConsumptionRatioChange(ratio)}
                        className={
                          isSelected
                            ? "rounded-lg border border-primary bg-primary py-2 text-sm font-semibold text-primary-foreground"
                            : "rounded-lg border border-border bg-background py-2 text-sm text-foreground"
                        }
                      >
                        {Math.round(ratio * 100)}%
                      </button>
                    );
                  })}
                </div>
              </div>
                </div>

                <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={syncByAmount}
                onChange={(e) => handleSyncToggle(e.target.checked)}
              />
              무게 변경 시 영양성분 자동 계산
                </label>

                <div className="grid grid-cols-2 gap-2">
              <LabeledNumberInput label="섭취량 (g)" value={editDraft.amount} onChange={handleAmountChange} />
              <LabeledNumberInput
                label="칼로리 (kcal)"
                value={editDraft.calories}
                onChange={(value) => handleEditNutrientChange("calories", value)}
              />
              <LabeledNumberInput
                label="탄수화물 (g)"
                value={editDraft.carbs}
                onChange={(value) => handleEditNutrientChange("carbs", value)}
              />
              <LabeledNumberInput
                label="단백질 (g)"
                value={editDraft.protein}
                onChange={(value) => handleEditNutrientChange("protein", value)}
              />
              <LabeledNumberInput
                label="지방 (g)"
                value={editDraft.fat}
                onChange={(value) => handleEditNutrientChange("fat", value)}
              />
              <LabeledNumberInput
                label="당 (g)"
                value={editDraft.sugar}
                onChange={(value) => handleEditNutrientChange("sugar", value)}
              />
              <LabeledNumberInput
                className="col-span-2"
                label="나트륨 (mg)"
                value={editDraft.sodium}
                onChange={(value) => handleEditNutrientChange("sodium", value)}
              />
                </div>

                <button
                  onClick={() => void handleSaveTemplateFromEdit()}
                  disabled={templateSaving || updating || deleting}
                  className="w-full rounded-lg border border-border bg-background py-2 text-sm font-semibold text-foreground disabled:opacity-50"
                >
                  {templateSaving ? "즐겨찾기 저장 중..." : "즐겨찾기 등록"}
                </button>
              </div>

              <div className="border-t border-border px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleDeleteRecord(editing.id, editing.date)}
                    disabled={deleting || updating || templateSaving}
                    className="flex-1 rounded-lg border border-destructive/40 bg-destructive/10 py-2 text-destructive disabled:opacity-50"
                  >
                    {deleting ? "삭제 중..." : "삭제"}
                  </button>
                  <button
                    onClick={closeEdit}
                    disabled={deleting || updating || templateSaving}
                    className="flex-1 rounded-lg bg-muted py-2 disabled:opacity-50"
                  >
                    취소
                  </button>
                  <button
                    onClick={() => void handleUpdateRecord()}
                    disabled={updating || deleting || templateSaving}
                    className="flex-1 rounded-lg bg-primary py-2 text-primary-foreground disabled:opacity-50"
                  >
                    {updating ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <MealEntryFab selectedDate={selectedDate} onSuccess={refreshSelectedDate} />
      <LoadingOverlay
        active={loadingRecords || loadingTargets || templateSaving || updating || deleting}
        label={
          loadingRecords || loadingTargets
            ? "데이터를 불러오는 중입니다..."
            : deleting
              ? "기록을 삭제하는 중입니다..."
              : updating
                ? "기록을 수정하는 중입니다..."
                : templateSaving
                  ? "즐겨찾기를 저장하는 중입니다..."
                  : "처리 중입니다..."
        }
      />
    </motion.main>
  );
}

function LabeledNumberInput({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={`space-y-1 text-xs text-muted-foreground ${className}`}>
      <span>{label}</span>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground" />
    </label>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-background/60 px-2 py-1">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-xs font-semibold text-foreground">{value}</div>
    </div>
  );
}

