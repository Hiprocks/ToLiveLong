"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Check, Loader2, X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { getLocalDateString } from "@/lib/date";

interface PhotoAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  onSaved?: (message: string) => void;
}

interface FormDataState {
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

export default function PhotoAnalysisModal({ isOpen, onClose, onSuccess, onSaved }: PhotoAnalysisModalProps) {
  const [step, setStep] = useState<"upload" | "analyzing" | "confirm">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [saveState, setSaveState] = useState<SaveState>("idle");
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
    setErrorMessage(null);

    const data = new FormData();
    data.append("image", file);

    try {
      const response = await fetch("/api/analyze", { method: "POST", body: data });
      if (!response.ok) throw new Error("사진 분석에 실패했습니다.");
      const result = (await response.json()) as Partial<FormDataState> & { menu_name?: string };
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
      setStep("confirm");
    } catch (error) {
      console.error(error);
      setErrorMessage("사진 분석에 실패했습니다. 다른 사진으로 다시 시도해 주세요.");
      setStep("upload");
      setImagePreview(null);
    }
  };

  const validate = () => {
    if (!formData.food_name.trim()) return "음식 이름은 필수입니다.";
    if (!Number.isFinite(formData.amount) || formData.amount < 1) return "중량은 1g 이상이어야 합니다.";
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
      const response = await fetch("/api/sheets/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: getLocalDateString(), ...formData, saveAsTemplate }),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(result?.error || "저장에 실패했습니다.");
      }

      setSaveState("success");
      onSaved?.("사진 분석 기록이 저장되었습니다.");
      await onSuccess();
      handleClose();
    } catch (error) {
      console.error(error);
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "기록 저장에 실패했습니다.");
    }
  };

  const handleClose = useCallback(() => {
    setStep("upload");
    setImagePreview(null);
    setSaveAsTemplate(true);
    setFormData(initialState);
    setErrorMessage(null);
    setSaveState("idle");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">사진 분석</h2>
          <button onClick={handleClose} className="rounded-full p-1 hover:bg-muted" aria-label="사진 분석 닫기">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto p-4">
          <ErrorBanner message={errorMessage} />

          {step === "upload" && (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-muted-foreground/25 p-12 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Camera className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="font-medium">사진 업로드</p>
                <p className="text-sm text-muted-foreground">음식 사진을 분석해 자동 입력합니다.</p>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {step === "analyzing" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-12">
              <div className="relative h-32 w-32 overflow-hidden rounded-xl shadow-lg">
                {imagePreview && <Image src={imagePreview} alt="미리보기" fill className="object-cover" />}
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
              </div>
              <p className="animate-pulse text-muted-foreground">분석 중...</p>
            </div>
          )}

          {step === "confirm" && (
            <div className="space-y-6">
              <div className="relative h-48 w-full overflow-hidden rounded-xl shadow-sm">
                {imagePreview && <Image src={imagePreview} alt="미리보기" fill className="object-cover" />}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">음식 이름 *</label>
                  <input
                    type="text"
                    value={formData.food_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, food_name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">중량(g) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">칼로리</label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData((prev) => ({ ...prev, calories: Number(e.target.value) || 0 }))}
                    className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
                  />
                </div>
                <FieldNumber label="탄수화물 (g)" value={formData.carbs} onChange={(value) => setFormData((prev) => ({ ...prev, carbs: value }))} />
                <FieldNumber label="단백질 (g)" value={formData.protein} onChange={(value) => setFormData((prev) => ({ ...prev, protein: value }))} />
                <FieldNumber label="지방 (g)" value={formData.fat} onChange={(value) => setFormData((prev) => ({ ...prev, fat: value }))} />
                <FieldNumber label="당 (g)" value={formData.sugar} onChange={(value) => setFormData((prev) => ({ ...prev, sugar: value }))} />
                <FieldNumber label="나트륨 (mg)" value={formData.sodium} onChange={(value) => setFormData((prev) => ({ ...prev, sodium: value }))} />
              </div>

              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} />
                템플릿으로 저장
              </label>

              <button
                onClick={handleSave}
                disabled={saveState === "saving"}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground disabled:opacity-50"
              >
                <Check className="h-5 w-5" />
                {saveState === "saving" ? "저장 중..." : "기록 저장"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldNumber({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2"
      />
    </div>
  );
}
