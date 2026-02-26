"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";
import { MealRecord, TemplateItem } from "@/lib/types";

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  initialMode?: "manual" | "template";
  onSaved?: (message: string) => void;
}

interface FormState {
  food_name: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

const initialForm: FormState = {
  food_name: "",
  amount: 100,
  calories: 0,
  carbs: 0,
  protein: 0,
  fat: 0,
  sugar: 0,
  sodium: 0,
};

type SaveState = "idle" | "saving" | "success" | "error";
const RECENT_TEMPLATE_KEY = "toLiveLong.recentTemplates";
let templateCache: TemplateItem[] | null = null;

export default function FoodSearchModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "manual",
  onSaved,
}: FoodSearchModalProps) {
  const [mode, setMode] = useState<"manual" | "template">(initialMode);
  const [loading, setLoading] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [query, setQuery] = useState("");
  const [templates, setTemplates] = useState<TemplateItem[]>([]);
  const [recentTemplateIds, setRecentTemplateIds] = useState<string[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    if (templateCache) {
      setTemplates(templateCache);
      return;
    }

    let isActive = true;
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sheets/templates", { cache: "no-store" });
        if (!res.ok) throw new Error("템플릿을 불러오지 못했습니다.");
        const data = (await res.json()) as TemplateItem[];
        if (isActive) {
          setTemplates(data);
          templateCache = data;
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          console.error(error);
          setErrorMessage("템플릿을 불러오지 못했습니다.");
        }
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadTemplates();
    return () => {
      isActive = false;
    };
  }, [isOpen]);

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
    const ratio = form.amount / template.base_amount;
    rememberTemplate(template.id);
    setSelectedTemplate(template);
    setForm((prev) => ({
      ...prev,
      food_name: template.food_name,
      calories: Math.round(template.calories * ratio),
      carbs: Math.round(template.carbs * ratio),
      protein: Math.round(template.protein * ratio),
      fat: Math.round(template.fat * ratio),
      sugar: Math.round(template.sugar * ratio),
      sodium: Math.round(template.sodium * ratio),
    }));
  };

  const recalculateByAmount = (nextAmount: number) => {
    const safeAmount = Number.isFinite(nextAmount) && nextAmount > 0 ? nextAmount : 0;
    setForm((prev) => ({ ...prev, amount: safeAmount }));
    if (!selectedTemplate || safeAmount <= 0) return;
    const ratio = safeAmount / selectedTemplate.base_amount;
    setForm((prev) => ({
      ...prev,
      amount: safeAmount,
      calories: Math.round(selectedTemplate.calories * ratio),
      carbs: Math.round(selectedTemplate.carbs * ratio),
      protein: Math.round(selectedTemplate.protein * ratio),
      fat: Math.round(selectedTemplate.fat * ratio),
      sugar: Math.round(selectedTemplate.sugar * ratio),
      sodium: Math.round(selectedTemplate.sodium * ratio),
    }));
  };

  const resetForm = useCallback(() => {
    setMode(initialMode);
    setQuery("");
    setSelectedTemplate(null);
    setForm(initialForm);
    setSaveAsTemplate(true);
    setErrorMessage(null);
    setSaveState("idle");
  }, [initialMode]);

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
    if (!form.food_name.trim()) return "음식 이름은 필수입니다.";
    if (!Number.isFinite(form.amount) || form.amount < 1) return "중량은 1g 이상이어야 합니다.";
    return null;
  };

  const handleSave = async () => {
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
        date: getLocalDateString(),
        food_name: form.food_name.trim(),
        amount: form.amount,
        calories: form.calories,
        carbs: form.carbs,
        protein: form.protein,
        fat: form.fat,
        sugar: form.sugar,
        sodium: form.sodium,
        saveAsTemplate: saveAsTemplate && mode === "manual",
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
      if (saveAsTemplate && mode === "manual") {
        templateCache = null;
      }
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-in slide-in-from-bottom duration-300 bg-background">
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
            템플릿
          </button>
        </div>
      </div>

      {mode === "template" && (
        <div className="border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="템플릿 검색"
              className="w-full rounded-full bg-muted/50 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">최근 사용 템플릿이 먼저 표시됩니다.</p>
          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto">
            {loading && <p className="text-sm text-muted-foreground">템플릿 불러오는 중...</p>}
            {!loading && filteredTemplates.length === 0 && <p className="text-sm text-muted-foreground">템플릿이 없습니다.</p>}
            {!loading &&
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="w-full rounded-lg border border-border p-3 text-left hover:bg-muted/40"
                >
                  <p className="font-medium">{template.food_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.base_amount}g / {template.calories} kcal
                  </p>
                </button>
              ))}
          </div>
        </div>
      )}

      <div className="space-y-4 overflow-y-auto p-4">
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
            value={form.amount}
            min={1}
            onChange={(e) => recalculateByAmount(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {(
            [
              ["calories", "칼로리"],
              ["carbs", "탄수화물 (g)"],
              ["protein", "단백질 (g)"],
              ["fat", "지방 (g)"],
              ["sugar", "당 (g)"],
              ["sodium", "나트륨 (mg)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="text-sm text-muted-foreground">{label}</label>
              <input
                type="number"
                value={form[key]}
                onChange={(e) => setForm((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))}
                className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
              />
            </div>
          ))}
        </div>

        {mode === "manual" && (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />
            템플릿으로 저장
          </label>
        )}
      </div>

      <div className="border-t border-border p-4">
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground disabled:opacity-50"
        >
          <Check className="h-5 w-5" />
          {saveState === "saving" ? "저장 중..." : "기록 저장"}
        </button>
      </div>
    </div>
  );
}
