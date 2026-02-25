"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";
import { MealRecord, MealType, TemplateItem } from "@/lib/types";

interface FoodSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  initialMode?: "manual" | "template";
  onSaved?: (message: string) => void;
}

interface FormState {
  meal_type: MealType;
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
  meal_type: "breakfast",
  food_name: "",
  amount: 100,
  calories: 0,
  carbs: 0,
  protein: 0,
  fat: 0,
  sugar: 0,
  sodium: 0,
};

const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];
const TEMPLATE_CACHE_TTL_MS = 60 * 1000;
const RECENT_TEMPLATE_KEY = "toLiveLong.recentTemplates";
let templateCache: { expiresAt: number; data: TemplateItem[] } | null = null;

type SaveState = "idle" | "saving" | "success" | "error";

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
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(RECENT_TEMPLATE_KEY);
      if (!raw) {
        setRecentTemplateIds([]);
        return;
      }
      const parsed = JSON.parse(raw) as string[];
      setRecentTemplateIds(Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string") : []);
    } catch {
      setRecentTemplateIds([]);
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (!isOpen) return;

    if (templateCache && templateCache.expiresAt > Date.now()) {
      setTemplates(templateCache.data);
      return;
    }

    let isActive = true;
    const loadTemplates = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/sheets/templates", { cache: "no-store" });
        if (!res.ok) throw new Error("Failed to load templates");
        const data = (await res.json()) as TemplateItem[];
        if (isActive) {
          setTemplates(data);
          templateCache = { data, expiresAt: Date.now() + TEMPLATE_CACHE_TTL_MS };
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          console.error(error);
          setErrorMessage("Failed to load templates.");
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
    if (typeof window !== "undefined") {
      window.localStorage.setItem(RECENT_TEMPLATE_KEY, JSON.stringify(next));
    }
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

  const resetForm = () => {
    setMode(initialMode);
    setQuery("");
    setSelectedTemplate(null);
    setForm(initialForm);
    setSaveAsTemplate(true);
    setErrorMessage(null);
    setSaveState("idle");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = () => {
    if (!form.food_name.trim()) {
      return "Food name is required.";
    }
    if (!Number.isFinite(form.amount) || form.amount < 1) {
      return "Amount must be at least 1g.";
    }
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
        meal_type: form.meal_type,
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
        throw new Error(result?.error || "Failed to save record");
      }

      if (saveAsTemplate && mode === "manual") {
        templateCache = null;
      }
      setSaveState("success");
      onSaved?.("Meal record saved.");
      await onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "Failed to save record.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={handleClose} className="p-2 hover:bg-muted rounded-full">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-semibold">Add Meal</h2>
      </div>

      <div className="p-4 border-b border-border">
        <ErrorBanner message={errorMessage} />
        <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl">
          <button
            onClick={() => setMode("manual")}
            className={`py-2 text-sm rounded-lg ${mode === "manual" ? "bg-background" : ""}`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode("template")}
            className={`py-2 text-sm rounded-lg ${mode === "template" ? "bg-background" : ""}`}
          >
            Template
          </button>
        </div>
      </div>

      {mode === "template" && (
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates"
              className="w-full bg-muted/50 rounded-full pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Recently used templates appear first.</p>
          <div className="max-h-40 overflow-y-auto mt-3 space-y-2">
            {loading && <p className="text-sm text-muted-foreground">Loading templates...</p>}
            {!loading &&
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-3 border border-border rounded-lg hover:bg-muted/40"
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

      <div className="p-4 space-y-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          {mealTypes.map((type) => (
            <button
              key={type}
              onClick={() => setForm((prev) => ({ ...prev, meal_type: type }))}
              className={`py-2 rounded-lg capitalize ${
                form.meal_type === type ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Food Name *</label>
          <input
            type="text"
            value={form.food_name}
            onChange={(e) => setForm((prev) => ({ ...prev, food_name: e.target.value }))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">Amount (g) *</label>
          <input
            type="number"
            value={form.amount}
            min={1}
            onChange={(e) => recalculateByAmount(Number(e.target.value))}
            className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
          />
        </div>

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
                value={form[key]}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                }
                className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
              />
            </div>
          ))}
        </div>

        {mode === "manual" && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={saveAsTemplate}
              onChange={(e) => setSaveAsTemplate(e.target.checked)}
            />
            Save as template
          </label>
        )}
      </div>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={saveState === "saving"}
          className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Check className="w-5 h-5" />
          {saveState === "saving" ? "Saving..." : "Save Record"}
        </button>
      </div>
    </div>
  );
}
