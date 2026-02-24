"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";
import { MealType } from "@/lib/types";

interface PhotoAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
}

interface FormDataState {
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

const initialState: FormDataState = {
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

export default function PhotoAnalysisModal({ isOpen, onClose, onSuccess }: PhotoAnalysisModalProps) {
  const [step, setStep] = useState<"upload" | "analyzing" | "confirm">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormDataState>(initialState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      void analyzeImage(file);
    };
    reader.readAsDataURL(file);
  };

  const analyzeImage = async (file: File) => {
    setStep("analyzing");
    const data = new FormData();
    data.append("image", file);

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: data });
      if (!response.ok) throw new Error("Analysis failed");
      const result = (await response.json()) as Partial<FormDataState> & {
        menu_name?: string;
      };

      setFormData((prev) => ({
        ...prev,
        food_name: result.food_name ?? result.menu_name ?? "",
        calories: Number(result.calories ?? 0),
        carbs: Number(result.carbs ?? 0),
        protein: Number(result.protein ?? 0),
        fat: Number(result.fat ?? 0),
        sugar: Number(result.sugar ?? 0),
        sodium: Number(result.sodium ?? 0),
      }));
      setErrorMessage(null);
      setStep("confirm");
    } catch (error) {
      console.error(error);
      setErrorMessage("이미지 분석에 실패했습니다.");
      setStep("upload");
      setImagePreview(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/sheets/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: getLocalDateString(),
          ...formData,
          saveAsTemplate,
        }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "Save failed");
      }

      setErrorMessage(null);
      await onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      setErrorMessage(error instanceof Error ? error.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setStep("upload");
    setImagePreview(null);
    setSaveAsTemplate(true);
    setFormData(initialState);
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="text-lg font-semibold">AI Food Analysis</h2>
          <button onClick={handleClose} className="p-1 hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-6">
          <ErrorBanner message={errorMessage} />
          {step === "upload" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="font-medium">Tap to upload</p>
                <p className="text-sm text-muted-foreground">Analyze food photo automatically</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-lg">
                {imagePreview && <Image src={imagePreview} alt="Preview" fill className="object-cover" />}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              </div>
              <p className="text-muted-foreground animate-pulse">Analyzing food...</p>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="relative w-full h-48 rounded-xl overflow-hidden shadow-sm">
                {imagePreview && <Image src={imagePreview} alt="Preview" fill className="object-cover" />}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase">Meal Type</label>
                  <select
                    value={formData.meal_type}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, meal_type: e.target.value as MealType }))
                    }
                    className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase">Food Name</label>
                    <input
                      type="text"
                      value={formData.food_name}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, food_name: e.target.value }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Amount (g)</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Calories</label>
                    <input
                      type="number"
                      value={formData.calories}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, calories: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Carbs (g)</label>
                    <input
                      type="number"
                      value={formData.carbs}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, carbs: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Protein (g)</label>
                    <input
                      type="number"
                      value={formData.protein}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, protein: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Fat (g)</label>
                    <input
                      type="number"
                      value={formData.fat}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, fat: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Sugar (g)</label>
                    <input
                      type="number"
                      value={formData.sugar}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sugar: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Sodium (mg)</label>
                    <input
                      type="number"
                      value={formData.sodium}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, sodium: Number(e.target.value) || 0 }))
                      }
                      className="w-full bg-input border border-border rounded-lg px-3 py-2 mt-1"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={saveAsTemplate}
                    onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  />
                  Save as template
                </label>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check className="w-5 h-5" /> {saving ? "Saving..." : "Save Record"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
