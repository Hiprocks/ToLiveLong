"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Info, Search, X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";
import { FoodIndexItem, MealRecord, TemplateItem } from "@/lib/types";

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  initialMode?: "manual" | "template" | "database";
  onSaved?: (message: string) => void;
  initialPrefill?: Partial<FormState> | null;
}

interface FormState {
  date: string;
  food_name: string;
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

type SaveState = "idle" | "saving" | "success" | "error";

type SelectedSource =
  | { kind: "template"; item: TemplateItem }
  | { kind: "database"; item: FoodIndexItem };

const getInitialForm = (): FormState => ({
  date: getLocalDateString(),
  food_name: "",
  amount: 100,
  calories: 0,
  carbs: 0,
  protein: 0,
  fat: 0,
  sugar: 0,
  sodium: 0,
});

const RECENT_TEMPLATE_KEY = "toLiveLong.recentTemplates";
let templateCache: TemplateItem[] | null = null;
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
  onSaved,
  initialPrefill = null,
}: FoodSearchModalProps) {
  const initialForm = useMemo(() => getInitialForm(), []);
  const [mode, setMode] = useState<"manual" | "template" | "database">(initialMode);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [dbResults, setDbResults] = useState<FoodIndexItem[]>([]);
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [draft, setDraft] = useState<NumericDraft>(toDraft(initialForm));
  const [selectedSource, setSelectedSource] = useState<SelectedSource | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TemplateItem | null>(null);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    const nextForm: FormState = {
      ...initialForm,
      ...initialPrefill,
      amount:
        typeof initialPrefill.amount === "number" && Number.isFinite(initialPrefill.amount)
          ? initialPrefill.amount
          : initialForm.amount,
    };
    setMode("manual");
    setSelectedSource(null);
    setFormAndDraft(nextForm);
  }, [initialForm, initialPrefill, isOpen]);

  useEffect(() => {
    if (!isOpen || templateCache) {
      if (templateCache) setTemplates(templateCache);
      return;
    }
    let isActive = true;

    const loadTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sheets/templates", { cache: "no-store" });
        if (!res.ok) throw new Error("템플릿을 불러오지 못했습니다.");
        const data = (await res.json()) as TemplateItem[];
        if (!isActive) return;
        templateCache = data;
        setTemplates(data);
        setErrorMessage(null);
      } catch (error) {
        if (!isActive) return;
        console.error(error);
        setErrorMessage("템플릿을 불러오지 못했습니다.");
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
    if (!isOpen || mode !== "database") return;
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
    return [...base].sort((a, b) => {
      const rankA = recentRank.has(a.id) ? (recentRank.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
      const rankB = recentRank.has(b.id) ? (recentRank.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.food_name.localeCompare(b.food_name);
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

    return scaleWithAmount(amount, normalizeAmount(source.item.baseAmount), {
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
  }, [initialForm, initialMode]);

  const handleClose = useCallback(() => {
    setPreviewTemplate(null);
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
    const validationError = validate();
    if (validationError) {
      setSaveState("error");
      setErrorMessage(validationError);
      return;
    }

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

      if (selectedSource?.kind === "template") {
        rememberTemplate(selectedSource.item.id);
      }
      if (saveTemplateWithRecord) templateCache = null;
      setSaveState("success");
      onSaved?.("식단 기록이 저장되었습니다.");
      await onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "기록 저장에 실패했습니다.");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!previewTemplate) return;
    const target = previewTemplate;
    setDeletingTemplateId(target.id);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/sheets/templates?id=${encodeURIComponent(target.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const result = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "템플릿 삭제에 실패했습니다.");
      }

      templateCache = null;
      setTemplates((prev) => prev.filter((item) => item.id !== target.id));
      setRecentTemplateIds((prev) => {
        const next = prev.filter((id) => id !== target.id);
        window.localStorage.setItem(RECENT_TEMPLATE_KEY, JSON.stringify(next));
        return next;
      });
      setSelectedSource((prev) =>
        prev?.kind === "template" && prev.item.id === target.id ? null : prev
      );
      setPreviewTemplate(null);
      onSaved?.("템플릿이 삭제되었습니다.");
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "템플릿 삭제에 실패했습니다.");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  if (!isOpen) return null;

  const isTemplateMode = mode === "template";

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
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted p-1">
          <button onClick={() => setMode("manual")} className={`rounded-lg py-2 text-sm ${mode === "manual" ? "bg-background" : ""}`}>
            수기
          </button>
          <button onClick={() => setMode("template")} className={`rounded-lg py-2 text-sm ${mode === "template" ? "bg-background" : ""}`}>
            템플릿
          </button>
          <button onClick={() => setMode("database")} className={`rounded-lg py-2 text-sm ${mode === "database" ? "bg-background" : ""}`}>
            DB검색
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
                placeholder={mode === "template" ? "템플릿 검색" : "음식 DB 검색"}
                className="w-full rounded-full bg-muted/50 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {mode === "template" ? "최근 사용 템플릿 우선 표시" : "한국 음식 중심 영양 DB 검색"}
            </p>

          <div
            className={`mt-3 space-y-2 overflow-y-auto ${
              mode === "template" ? "max-h-[52vh]" : "max-h-44"
            }`}
          >
              {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
              {!loading && mode === "template" && filteredTemplates.length === 0 && (
                <p className="text-sm text-muted-foreground">템플릿이 없습니다.</p>
              )}
              {!loading && mode === "database" && dbResults.length === 0 && query.trim() && (
                <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
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
                        setPreviewTemplate(template);
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

              {!loading &&
                mode === "database" &&
                dbResults.map((food) => (
                  <button
                    key={food.id}
                    onClick={() => applyDatabaseFood(food)}
                    className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted/40"
                  >
                    <p className="font-medium">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      기본 {food.defaultAmount ?? food.baseAmount}g / 기준 {food.baseAmount}g / {food.calories} kcal / 출처: {food.source}
                    </p>
                  </button>
                ))}
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
          onClick={() => void handleSaveRecord(isTemplateMode ? true : false)}
          disabled={saveState === "saving"}
          className="flex items-center justify-center rounded-xl border border-border bg-muted py-3 text-sm font-semibold text-foreground disabled:opacity-50"
        >
          {saveState === "saving" ? "저장 중..." : isTemplateMode ? "템플릿 저장 + 등록" : "등록"}
        </button>
        <button
          onClick={() => void handleSaveRecord(isTemplateMode ? false : true)}
          disabled={saveState === "saving"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-5 w-5" />
          {saveState === "saving" ? "저장 중..." : isTemplateMode ? "등록" : "템플릿 저장 + 등록"}
        </button>
      </div>

      {previewTemplate && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md space-y-3 rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold">{previewTemplate.food_name}</h3>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="템플릿 상세 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <PreviewItem label="섭취량(g)" value={String(previewTemplate.base_amount)} />
              <PreviewItem label="칼로리(kcal)" value={String(previewTemplate.calories)} />
              <PreviewItem label="탄수화물(g)" value={String(previewTemplate.carbs)} />
              <PreviewItem label="단백질(g)" value={String(previewTemplate.protein)} />
              <PreviewItem label="지방(g)" value={String(previewTemplate.fat)} />
              <PreviewItem label="당(g)" value={String(previewTemplate.sugar)} />
              <PreviewItem className="col-span-2" label="나트륨(mg)" value={String(previewTemplate.sodium)} />
            </div>

            <button
              onClick={() => void handleDeleteTemplate()}
              disabled={deletingTemplateId === previewTemplate.id}
              className="w-full rounded-lg border border-red-400/40 bg-red-500/10 py-2 text-sm font-semibold text-red-200 disabled:opacity-50"
            >
              {deletingTemplateId === previewTemplate.id ? "삭제 중..." : "템플릿 삭제"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`space-y-1 rounded-lg border border-border bg-input px-3 py-2 ${className}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
