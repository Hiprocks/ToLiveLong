"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Info, Search, X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import {
  cacheKeys,
  getCachedData,
  markCacheDirty,
  markRecordCacheDirty,
  setCachedData,
} from "@/lib/clientSyncCache";
import { getLocalDateString } from "@/lib/date";
import { showToast } from "@/lib/toast";
import { FoodIndexItem, MealRecord, TemplateItem } from "@/lib/types";

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  initialMode?: "manual" | "template";
  initialDate?: string;
  onSaved?: (message: string) => void;
  initialPrefill?: Partial<FormState> | null;
}

interface FormState {
  date: string;
  food_name: string;
  ai_summary: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

type NumericKey = "amount" | "calories" | "carbs" | "protein" | "fat" | "sugar" | "sodium";
type NumericDraft = Record<NumericKey, string>;
type TemplateEditDraft = {
  food_name: string;
  amount: string;
  calories: string;
  carbs: string;
  protein: string;
  fat: string;
  sugar: string;
  sodium: string;
};

type SaveState = "idle" | "saving" | "success" | "error";

type PreviewSource =
  | { kind: "template"; item: TemplateItem }
  | { kind: "database"; item: FoodIndexItem };

type SelectedSource =
  | { kind: "template"; item: TemplateItem }
  | { kind: "database"; item: FoodIndexItem }
  | {
      kind: "prefill";
      item: {
        baseAmount: number;
        calories: number;
        carbs: number;
        protein: number;
        fat: number;
        sugar: number;
        sodium: number;
      };
    };

const getInitialForm = (initialDate?: string): FormState => ({
  date: initialDate ?? getLocalDateString(),
  food_name: "",
  ai_summary: "",
  amount: 100,
  calories: 0,
  carbs: 0,
  protein: 0,
  fat: 0,
  sugar: 0,
  sodium: 0,
});

const RECENT_TEMPLATE_KEY = "toLiveLong.recentTemplates";
const dbResultCache = new Map<string, FoodIndexItem[]>();

const normalizeAmount = (value: number | undefined): number => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return 100;
  return value;
};

const toDraft = (form: FormState): NumericDraft => ({
  amount: String(form.amount),
  calories: String(form.calories),
  carbs: String(form.carbs),
  protein: String(form.protein),
  fat: String(form.fat),
  sugar: String(form.sugar),
  sodium: String(form.sodium),
});

const parseNumber = (value: string): number => {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePositiveAmount = (value: string): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
};

const scaleWithAmount = (
  amount: number,
  base: number,
  nutrients: Pick<FormState, "calories" | "carbs" | "protein" | "fat" | "sugar" | "sodium">
): Pick<FormState, "calories" | "carbs" | "protein" | "fat" | "sugar" | "sodium"> => {
  const ratio = base > 0 ? amount / base : 0;
  return {
    calories: Math.round(nutrients.calories * ratio),
    carbs: Math.round(nutrients.carbs * ratio),
    protein: Math.round(nutrients.protein * ratio),
    fat: Math.round(nutrients.fat * ratio),
    sugar: Math.round(nutrients.sugar * ratio),
    sodium: Math.round(nutrients.sodium * ratio),
  };
};

export default function FoodSearchModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "manual",
  initialDate,
  onSaved,
  initialPrefill = null,
}: FoodSearchModalProps) {
  const initialForm = useMemo(() => getInitialForm(initialDate), [initialDate]);
  const [mode, setMode] = useState<"manual" | "template">(initialMode);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [dbResults, setDbResults] = useState<FoodIndexItem[]>([]);
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [draft, setDraft] = useState<NumericDraft>(toDraft(initialForm));
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [previewSource, setPreviewSource] = useState<PreviewSource | null>(null);
  const [previewDraft, setPreviewDraft] = useState<TemplateEditDraft | null>(null);
  const [previewSyncByAmount, setPreviewSyncByAmount] = useState(true);
  const [previewSaving, setPreviewSaving] = useState(false);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  const setFormAndDraft = (nextForm: FormState) => {
    setForm(nextForm);
    setDraft(toDraft(nextForm));
  };

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    setSaveState("idle");
    setErrorMessage(null);
    try {
      const raw = window.localStorage.getItem(RECENT_TEMPLATE_KEY);
      const parsed = raw ? (JSON.parse(raw) as string[]) : [];
      setRecentTemplateIds(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRecentTemplateIds([]);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !initialPrefill) return;
    const prefillAmount =
      typeof initialPrefill.amount === "number" && Number.isFinite(initialPrefill.amount)
        ? initialPrefill.amount
        : initialForm.amount;

    const nextForm: FormState = {
      ...initialForm,
      ...initialPrefill,
      amount: prefillAmount,
      ai_summary:
        typeof initialPrefill.ai_summary === "string" ? initialPrefill.ai_summary.trim() : "",
    };
    setMode("manual");
    setSelectedSource({
      kind: "prefill",
      item: {
        baseAmount: normalizeAmount(prefillAmount),
        calories: Number(nextForm.calories) || 0,
        carbs: Number(nextForm.carbs) || 0,
        protein: Number(nextForm.protein) || 0,
        fat: Number(nextForm.fat) || 0,
        sugar: Number(nextForm.sugar) || 0,
        sodium: Number(nextForm.sodium) || 0,
      },
    });
    setFormAndDraft(nextForm);
  }, [initialForm, initialPrefill, isOpen]);

  useEffect(() => {
    if (!isOpen || initialPrefill) return;
    setSelectedSource(null);
    setFormAndDraft(initialForm);
  }, [initialForm, initialPrefill, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const cached = getCachedData<TemplateItem[]>(cacheKeys.templates);
    if (cached) {
      setTemplates(cached);
      return;
    }
    let isActive = true;

    const loadTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sheets/templates", { cache: "no-store" });
        if (!res.ok) throw new Error("즐겨찾기를 불러오지 못했습니다.");
        const data = (await res.json()) as TemplateItem[];
        if (!isActive) return;
        setCachedData(cacheKeys.templates, data);
        setTemplates(data);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) return;
        console.error(error);
        setErrorMessage("즐겨찾기를 불러오지 못했습니다.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadTemplates();
    return () => {
      isActive = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || mode === "manual") return;
    const keyword = query.trim();
    if (!keyword) {
      setDbResults([]);
      return;
    }

    const cacheKey = keyword.toLowerCase();
    if (dbResultCache.has(cacheKey)) {
      setDbResults(dbResultCache.get(cacheKey) ?? []);
      return;
    }

    let isActive = true;
    const timer = window.setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/foods/search?q=${encodeURIComponent(keyword)}&limit=30`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("검색 결과를 불러오지 못했습니다.");
        const data = (await res.json()) as { items: FoodIndexItem[] };
        if (!isActive) return;
        dbResultCache.set(cacheKey, data.items ?? []);
        setDbResults(data.items ?? []);
      } catch (error) {
        if (!isActive) return;
        console.error(error);
        setErrorMessage("음식 DB 검색에 실패했습니다.");
      } finally {
        if (isActive) setLoading(false);
      }
    }, 280);

    return () => {
      isActive = false;
      window.clearTimeout(timer);
    };
  }, [isOpen, mode, query]);

  const filteredTemplates = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const base = templates.filter((item) => item.food_name.toLowerCase().includes(keyword));
    const recentRank = new Map(recentTemplateIds.map((id, index) => [id, index]));
    const baseOrder = new Map(base.map((item, index) => [item.id, index]));
    return [...base].sort((a, b) => {
      const rankA = recentRank.has(a.id) ? (recentRank.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
      const rankB = recentRank.has(b.id) ? (recentRank.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return (baseOrder.get(a.id) ?? 0) - (baseOrder.get(b.id) ?? 0);
    });
  }, [query, recentTemplateIds, templates]);

  const rememberTemplate = (templateId: string) => {
    const next = [templateId, ...recentTemplateIds.filter((id) => id !== templateId)].slice(0, 8);
    setRecentTemplateIds(next);
    window.localStorage.setItem(RECENT_TEMPLATE_KEY, JSON.stringify(next));
  };

  const applyTemplate = (template: TemplateItem) => {
    const amount = normalizeAmount(template.base_amount);
    const scaled = scaleWithAmount(amount, normalizeAmount(template.base_amount), {
      calories: template.calories,
      carbs: template.carbs,
      protein: template.protein,
      fat: template.fat,
      sugar: template.sugar,
      sodium: template.sodium,
    });

    setSelectedSource({ kind: "template", item: template });
    setFormAndDraft({
      ...initialForm,
      ...scaled,
      food_name: template.food_name,
      amount,
    });
  };

  const applyDatabaseFood = (food: FoodIndexItem) => {
    const amount = normalizeAmount(food.defaultAmount ?? food.baseAmount);
    const scaled = scaleWithAmount(amount, normalizeAmount(food.baseAmount), {
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      sugar: food.sugar,
      sodium: food.sodium,
    });

    setSelectedSource({ kind: "database", item: food });
    setFormAndDraft({
      ...initialForm,
      ...scaled,
      food_name: food.name,
      amount,
    });
  };

  const openDatabasePreview = (food: FoodIndexItem) => {
    const amount = normalizeAmount(food.defaultAmount ?? food.baseAmount);
    const scaled = scaleWithAmount(amount, normalizeAmount(food.baseAmount), {
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat,
      sugar: food.sugar,
      sodium: food.sodium,
    });
    setPreviewSource({ kind: "database", item: food });
    setPreviewDraft({
      food_name: food.name,
      amount: String(amount),
      calories: String(scaled.calories),
      carbs: String(scaled.carbs),
      protein: String(scaled.protein),
      fat: String(scaled.fat),
      sugar: String(scaled.sugar),
      sodium: String(scaled.sodium),
    });
    setPreviewSyncByAmount(true);
  };

  const openTemplatePreview = (template: TemplateItem) => {
    setPreviewSource({ kind: "template", item: template });
    setPreviewDraft({
      food_name: template.food_name,
      amount: String(template.base_amount),
      calories: String(template.calories),
      carbs: String(template.carbs),
      protein: String(template.protein),
      fat: String(template.fat),
      sugar: String(template.sugar),
      sodium: String(template.sodium),
    });
    setPreviewSyncByAmount(true);
  };

  const closeTemplatePreview = useCallback(() => {
    setPreviewSource(null);
    setPreviewDraft(null);
    setPreviewSyncByAmount(true);
    setPreviewSaving(false);
  }, []);

  const recalcFromSelectedSource = (amount: number, source: SelectedSource) => {
    if (source.kind === "template") {
      return scaleWithAmount(amount, normalizeAmount(source.item.base_amount), {
        calories: source.item.calories,
        carbs: source.item.carbs,
        protein: source.item.protein,
        fat: source.item.fat,
        sugar: source.item.sugar,
        sodium: source.item.sodium,
      });
    }
    const baseAmount = normalizeAmount(source.item.baseAmount);
    return scaleWithAmount(amount, baseAmount, {
      calories: source.item.calories,
      carbs: source.item.carbs,
      protein: source.item.protein,
      fat: source.item.fat,
      sugar: source.item.sugar,
      sodium: source.item.sodium,
    });
  };

  const handleAmountChange = (raw: string) => {
    setDraft((prev) => ({ ...prev, amount: raw }));
    const parsed = parsePositiveAmount(raw);

    if (parsed === null) {
      setForm((prev) => ({ ...prev, amount: 0 }));
      return;
    }

    if (!selectedSource) {
      setForm((prev) => ({ ...prev, amount: parsed }));
      return;
    }

    const scaled = recalcFromSelectedSource(parsed, selectedSource);
    setForm((prev) => {
      const next = { ...prev, amount: parsed, ...scaled };
      setDraft((draftPrev) => ({ ...draftPrev, ...toDraft(next) }));
      return next;
    });
  };

  const handleNutrientChange = (key: Exclude<NumericKey, "amount">, raw: string) => {
    setDraft((prev) => ({ ...prev, [key]: raw }));
    const parsed = parseNumber(raw);
    setForm((prev) => ({ ...prev, [key]: parsed }));
  };

  const resetForm = useCallback(() => {
    setMode(initialMode);
    setQuery("");
    setDbResults([]);
    setSelectedSource(null);
    setForm(initialForm);
    setDraft(toDraft(initialForm));
    setErrorMessage(null);
    setSaveState("idle");
    closeTemplatePreview();
  }, [closeTemplatePreview, initialForm, initialMode]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isOpen]);

  const validate = () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) return "섭취 날짜를 확인해 주세요.";
    if (!form.food_name.trim()) return "음식 이름은 필수입니다.";
    const amount = parsePositiveAmount(draft.amount);
    if (!amount) return "중량은 1g 이상이어야 합니다.";
    return null;
  };

  const handleSaveRecord = async (saveTemplateWithRecord = false) => {
    if (isSavingRef.current) return;

    const validationError = validate();
    if (validationError) {
      setSaveState("error");
      setErrorMessage(validationError);
      return;
    }

    isSavingRef.current = true;
    setSaveState("saving");
    setErrorMessage(null);
    try {
      const payload: Partial<MealRecord> & { saveAsTemplate?: boolean } = {
        date: form.date,
        food_name: form.food_name.trim(),
        amount: parseNumber(draft.amount),
        calories: parseNumber(draft.calories),
        carbs: parseNumber(draft.carbs),
        protein: parseNumber(draft.protein),
        fat: parseNumber(draft.fat),
        sugar: parseNumber(draft.sugar),
        sodium: parseNumber(draft.sodium),
        saveAsTemplate: saveTemplateWithRecord,
      };

      const res = await fetch("/api/sheets/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const result = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "기록 저장에 실패했습니다.");
      }

      const result = (await res.json().catch(() => null)) as { templateId?: string } | null;

      if (selectedSource?.kind === "template") {
        rememberTemplate(selectedSource.item.id);
      }
      if (saveTemplateWithRecord && result?.templateId) {
        rememberTemplate(result.templateId);
      }
      markRecordCacheDirty(form.date);
      if (saveTemplateWithRecord) markCacheDirty(cacheKeys.templates);
      const message = saveTemplateWithRecord
        ? "즐겨찾기 저장 + 등록이 완료되었습니다."
        : "식단 등록이 완료되었습니다.";
      showToast({ message, type: "success" });
      setSaveState("success");
      onSaved?.("식단 기록이 저장되었습니다.");
      await onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "기록 저장에 실패했습니다.");
    } finally {
      isSavingRef.current = false;
    }
  };

  const handleDeleteTemplate = async () => {
    if (!previewSource || previewSource.kind !== "template") return;
    const target = previewSource.item;
    setDeletingTemplateId(target.id);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/sheets/templates?id=${encodeURIComponent(target.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const result = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "즐겨찾기 삭제에 실패했습니다.");
      }

      const nextTemplates = templates.filter((item) => item.id !== target.id);
      setTemplates(nextTemplates);
      setCachedData(cacheKeys.templates, nextTemplates);
      setRecentTemplateIds((prev) => {
        const next = prev.filter((id) => id !== target.id);
        window.localStorage.setItem(RECENT_TEMPLATE_KEY, JSON.stringify(next));
        return next;
      });
      setSelectedSource((prev) =>
        prev?.kind === "template" && prev.item.id === target.id ? null : prev
      );
      closeTemplatePreview();
      showToast({ message: "즐겨찾기 삭제가 완료되었습니다.", type: "success" });
      onSaved?.("즐겨찾기가 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "즐겨찾기 삭제에 실패했습니다.");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const handlePreviewAmountChange = (raw: string) => {
    if (!previewSource || !previewDraft) return;
    const next = { ...previewDraft, amount: raw };
    if (previewSyncByAmount) {
      const parsed = parsePositiveAmount(raw);
      if (parsed) {
        const scaled =
          previewSource.kind === "template"
            ? scaleWithAmount(parsed, normalizeAmount(previewSource.item.base_amount), {
                calories: previewSource.item.calories,
                carbs: previewSource.item.carbs,
                protein: previewSource.item.protein,
                fat: previewSource.item.fat,
                sugar: previewSource.item.sugar,
                sodium: previewSource.item.sodium,
              })
            : scaleWithAmount(parsed, normalizeAmount(previewSource.item.baseAmount), {
                calories: previewSource.item.calories,
                carbs: previewSource.item.carbs,
                protein: previewSource.item.protein,
                fat: previewSource.item.fat,
                sugar: previewSource.item.sugar,
                sodium: previewSource.item.sodium,
              });
        next.calories = String(scaled.calories);
        next.carbs = String(scaled.carbs);
        next.protein = String(scaled.protein);
        next.fat = String(scaled.fat);
        next.sugar = String(scaled.sugar);
        next.sodium = String(scaled.sodium);
      }
    }
    setPreviewDraft(next);
  };

  const handlePreviewSyncToggle = (checked: boolean) => {
    setPreviewSyncByAmount(checked);
    if (!checked || !previewSource || !previewDraft) return;
    const amount = parsePositiveAmount(previewDraft.amount);
    if (!amount) return;
    const scaled =
      previewSource.kind === "template"
        ? scaleWithAmount(amount, normalizeAmount(previewSource.item.base_amount), {
            calories: previewSource.item.calories,
            carbs: previewSource.item.carbs,
            protein: previewSource.item.protein,
            fat: previewSource.item.fat,
            sugar: previewSource.item.sugar,
            sodium: previewSource.item.sodium,
          })
        : scaleWithAmount(amount, normalizeAmount(previewSource.item.baseAmount), {
            calories: previewSource.item.calories,
            carbs: previewSource.item.carbs,
            protein: previewSource.item.protein,
            fat: previewSource.item.fat,
            sugar: previewSource.item.sugar,
            sodium: previewSource.item.sodium,
          });
    setPreviewDraft((prev) =>
      prev
        ? {
            ...prev,
            calories: String(scaled.calories),
            carbs: String(scaled.carbs),
            protein: String(scaled.protein),
            fat: String(scaled.fat),
            sugar: String(scaled.sugar),
            sodium: String(scaled.sodium),
          }
        : prev
    );
  };

  const handleApplyPreview = async () => {
    if (!previewSource || !previewDraft) return;
    const amount = parsePositiveAmount(previewDraft.amount);
    if (!previewDraft.food_name.trim()) {
      setErrorMessage("음식 이름은 필수입니다.");
      return;
    }
    if (!amount) {
      setErrorMessage("중량은 1g 이상이어야 합니다.");
      return;
    }

    if (previewSource.kind === "database") {
      const nextForm: FormState = {
        ...form,
        food_name: previewDraft.food_name.trim(),
        amount,
        calories: parseNumber(previewDraft.calories),
        carbs: parseNumber(previewDraft.carbs),
        protein: parseNumber(previewDraft.protein),
        fat: parseNumber(previewDraft.fat),
        sugar: parseNumber(previewDraft.sugar),
        sodium: parseNumber(previewDraft.sodium),
      };
      setSelectedSource({
        kind: "prefill",
        item: {
          baseAmount: amount,
          calories: nextForm.calories,
          carbs: nextForm.carbs,
          protein: nextForm.protein,
          fat: nextForm.fat,
          sugar: nextForm.sugar,
          sodium: nextForm.sodium,
        },
      });
      setFormAndDraft(nextForm);
      setErrorMessage(null);
      showToast({ message: "식품DB 값을 적용했습니다.", type: "success" });
      closeTemplatePreview();
      return;
    }

    const updatedTemplate: TemplateItem = {
      id: previewSource.item.id,
      food_name: previewDraft.food_name.trim(),
      base_amount: amount,
      calories: parseNumber(previewDraft.calories),
      carbs: parseNumber(previewDraft.carbs),
      protein: parseNumber(previewDraft.protein),
      fat: parseNumber(previewDraft.fat),
      sugar: parseNumber(previewDraft.sugar),
      sodium: parseNumber(previewDraft.sodium),
    };

    setPreviewSaving(true);
    try {
      const res = await fetch("/api/sheets/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTemplate),
      });
      if (!res.ok) {
        const result = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "즐겨찾기 수정에 실패했습니다.");
      }

      const saved = (await res.json()) as TemplateItem;
      const nextTemplates = templates.map((item) => (item.id === saved.id ? saved : item));
      setTemplates(nextTemplates);
      setCachedData(cacheKeys.templates, nextTemplates);

      const nextForm: FormState = {
        ...form,
        food_name: saved.food_name,
        amount: saved.base_amount,
        calories: saved.calories,
        carbs: saved.carbs,
        protein: saved.protein,
        fat: saved.fat,
        sugar: saved.sugar,
        sodium: saved.sodium,
      };

      setSelectedSource({ kind: "template", item: saved });
      setFormAndDraft(nextForm);
      setErrorMessage(null);
      showToast({ message: "즐겨찾기 수정이 완료되었습니다.", type: "success" });
      onSaved?.("즐겨찾기가 수정되었습니다.");
      closeTemplatePreview();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "즐겨찾기 수정에 실패했습니다.");
    } finally {
      setPreviewSaving(false);
    }
  };

  if (!isOpen) return null;

  const isTemplateMode = mode === "template";
  const isBusy = loading || saveState === "saving" || previewSaving || Boolean(deletingTemplateId);
  const busyLabel =
    saveState === "saving"
      ? "식단을 저장하는 중입니다..."
      : previewSaving
        ? "즐겨찾기 수정을 반영하는 중입니다..."
          : deletingTemplateId
          ? "즐겨찾기를 삭제하는 중입니다..."
          : "데이터를 불러오는 중입니다...";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col animate-in slide-in-from-bottom duration-300 bg-background">
      <div className="flex items-center gap-3 border-b border-border p-4">
        <button onClick={handleClose} className="rounded-full p-2 hover:bg-muted" aria-label="식단 등록 닫기">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold">식단 등록</h2>
      </div>

      <div className="border-b border-border p-4">
        <ErrorBanner message={errorMessage} />
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted p-1">
          <button onClick={() => setMode("manual")} className={`rounded-lg py-2 text-sm ${mode === "manual" ? "bg-background" : ""}`}>
            수기
          </button>
          <button onClick={() => setMode("template")} className={`rounded-lg py-2 text-sm ${mode === "template" ? "bg-background" : ""}`}>
            즐겨찾기
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {mode !== "manual" && (
          <div className="border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="즐겨찾기 + 식품 DB 통합 검색"
                className="w-full rounded-full bg-muted/50 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              최근 사용 즐겨찾기 우선 · 식품DB 결과 함께 표시
            </p>

          <div
            className={`mt-3 space-y-2 overflow-y-auto ${
              mode === "template" ? "max-h-[52vh]" : "min-h-[28vh] max-h-[42vh]"
            }`}
          >
              {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
              {!loading && mode === "template" && filteredTemplates.length === 0 && (
                <p className="text-sm text-muted-foreground">즐겨찾기가 없습니다.</p>
              )}
              {!loading && mode === "template" && query.trim() && filteredTemplates.length === 0 && dbResults.length === 0 && (
                <p className="text-sm text-muted-foreground">식품DB 검색 결과가 없습니다.</p>
              )}

              {!loading &&
              mode === "template" &&
              filteredTemplates.map((template) => (
                (() => {
                  const isSelected =
                    selectedSource?.kind === "template" && selectedSource.item.id === template.id;
                  return (
                <div
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") applyTemplate(template);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{template.food_name}</p>
                      <p className={`mt-1 text-xs ${isSelected ? "text-foreground/80" : "text-muted-foreground"}`}>
                        {template.base_amount}g · {template.calories} kcal
                      </p>
                      <p className={`text-xs ${isSelected ? "text-foreground/80" : "text-muted-foreground"}`}>
                        탄수 {template.carbs}g · 단백질 {template.protein}g · 지방 {template.fat}g
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`${template.food_name} 상세 보기`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openTemplatePreview(template);
                      }}
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-background/60 hover:text-foreground ${
                        isSelected ? "border-primary/60 text-primary" : "border-border/80 text-muted-foreground"
                      }`}
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                  );
                })()
              ))}

              {!loading && mode === "template" && dbResults.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">식품DB 결과</p>
                  <div className="space-y-2">
                    {dbResults.map((food) => {
                      const isSelected =
                        selectedSource?.kind === "database" && selectedSource.item.id === food.id;
                      return (
                        <div
                          key={`db-${food.id}`}
                          onClick={() => applyDatabaseFood(food)}
                          className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors ${
                            isSelected ? "border-primary bg-primary/10" : "border-border hover:bg-muted/40"
                          }`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") applyDatabaseFood(food);
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-medium">{food.name}</p>
                                <span className="shrink-0 rounded-full border border-emerald-400/40 bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                                  식품DB
                                </span>
                              </div>
                              <p className={`mt-1 text-xs ${isSelected ? "text-foreground/80" : "text-muted-foreground"}`}>
                                {food.defaultAmount ?? food.baseAmount}g · {food.calories} kcal
                              </p>
                              <p className={`text-xs ${isSelected ? "text-foreground/80" : "text-muted-foreground"}`}>
                                탄수 {food.carbs}g · 단백질 {food.protein}g · 지방 {food.fat}g
                              </p>
                              <p className={`text-[11px] ${isSelected ? "text-foreground/60" : "text-muted-foreground/70"}`}>
                                출처: {food.source} / 영양값: {food.nutritionSourceQuality === "official_db" ? "공식" : "추정"}
                              </p>
                            </div>
                            <button
                              type="button"
                              aria-label={`${food.name} 상세 보기`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDatabasePreview(food);
                              }}
                              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-background/60 hover:text-foreground ${
                                isSelected ? "border-primary/60 text-primary" : "border-border/80 text-muted-foreground"
                              }`}
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {mode !== "template" && (
        <div className="space-y-4 p-4">
        <div>
          <label className="text-sm text-muted-foreground">섭취 날짜 *</label>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
          />
        </div>
        <div>
          <label className="text-sm text-muted-foreground">음식 이름 *</label>
          <input
            type="text"
            value={form.food_name}
            onChange={(e) => setForm((prev) => ({ ...prev, food_name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
          />
        </div>

        {form.ai_summary.trim() && (
          <div>
            <label className="text-sm text-muted-foreground">AI 답변 요약</label>
            <div className="mt-1 rounded-lg border border-cyan-300/40 bg-cyan-500/10 px-3 py-2 text-sm text-foreground">
              {form.ai_summary}
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-muted-foreground">중량(g) *</label>
          <input
            type="number"
            value={draft.amount}
            min={1}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["calories", "칼로리(kcal)"],
              ["carbs", "탄수화물(g)"],
              ["protein", "단백질(g)"],
              ["fat", "지방(g)"],
              ["sugar", "당(g)"],
              ["sodium", "나트륨(mg)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-sm text-muted-foreground">{label}</label>
              <input
                type="number"
                value={draft[key]}
                onChange={(e) => handleNutrientChange(key, e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
              />
            </div>
          ))}
        </div>

        </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 mt-auto grid grid-cols-2 gap-2 border-t border-border bg-background p-4 pb-safe">
        <button
          onClick={() => void handleSaveRecord(true)}
          disabled={saveState === "saving"}
          className="flex items-center justify-center rounded-xl border border-border bg-muted py-3 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          {saveState === "saving" ? "저장 중..." : "즐겨찾기 저장 + 등록"}
        </button>
        <button
          onClick={() => void handleSaveRecord(false)}
          disabled={saveState === "saving"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-5 w-5" />
          {saveState === "saving" ? "저장 중..." : "등록"}
        </button>
      </div>

      {previewSource && previewDraft && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">
                {previewSource.kind === "template" ? "즐겨찾기 수정" : "식품DB 상세"}
              </h3>
              <button
                onClick={closeTemplatePreview}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="즐겨찾기 상세 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="space-y-1 text-sm">
              <span className="text-muted-foreground">음식명</span>
              <input
                value={previewDraft.food_name}
                onChange={(e) => setPreviewDraft((prev) => (prev ? { ...prev, food_name: e.target.value } : prev))}
                className="w-full rounded-lg border border-border bg-input px-3 py-2"
              />
            </label>

            {previewSource.kind === "template" && (
              <label className="flex items-center gap-2 rounded-lg border border-border/70 bg-background/40 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={previewSyncByAmount}
                  onChange={(e) => handlePreviewSyncToggle(e.target.checked)}
                />
                섭취량 대비 영양성분 변동
              </label>
            )}

            <div className="grid grid-cols-2 gap-2">
              <TemplateNumberInput
                label="섭취량(g)"
                value={previewDraft.amount}
                onChange={handlePreviewAmountChange}
              />
              <TemplateNumberInput
                label="칼로리(kcal)"
                value={previewDraft.calories}
                onChange={(value) =>
                  setPreviewDraft((prev) => (prev ? { ...prev, calories: value } : prev))
                }
              />
              <TemplateNumberInput
                label="탄수화물(g)"
                value={previewDraft.carbs}
                onChange={(value) =>
                  setPreviewDraft((prev) => (prev ? { ...prev, carbs: value } : prev))
                }
              />
              <TemplateNumberInput
                label="단백질(g)"
                value={previewDraft.protein}
                onChange={(value) =>
                  setPreviewDraft((prev) => (prev ? { ...prev, protein: value } : prev))
                }
              />
              <TemplateNumberInput
                label="지방(g)"
                value={previewDraft.fat}
                onChange={(value) =>
                  setPreviewDraft((prev) => (prev ? { ...prev, fat: value } : prev))
                }
              />
              <TemplateNumberInput
                label="당(g)"
                value={previewDraft.sugar}
                onChange={(value) =>
                  setPreviewDraft((prev) => (prev ? { ...prev, sugar: value } : prev))
                }
              />
              <TemplateNumberInput
                className="col-span-2"
                label="나트륨(mg)"
                value={previewDraft.sodium}
                onChange={(value) =>
                  setPreviewDraft((prev) => (prev ? { ...prev, sodium: value } : prev))
                }
              />
            </div>

            <button
              onClick={() => void handleApplyPreview()}
              disabled={previewSaving}
              className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {previewSaving ? "적용 중..." : "수정값 적용"}
            </button>

            <button
              onClick={closeTemplatePreview}
              className="w-full rounded-lg border border-border bg-background py-2 text-sm font-semibold text-foreground"
            >
              취소
            </button>

            {previewSource.kind === "template" && (
              <div className="border-t border-border pt-3">
                <button
                  onClick={() => void handleDeleteTemplate()}
                  disabled={deletingTemplateId === previewSource.item.id}
                  className="w-full rounded-lg border border-red-500/60 bg-red-500/10 py-2 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none"
                >
                  {deletingTemplateId === previewSource.item.id ? "삭제 중..." : "즐겨찾기 삭제"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <LoadingOverlay active={isBusy} label={busyLabel} />
    </div>
  );
}

function TemplateNumberInput({
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
