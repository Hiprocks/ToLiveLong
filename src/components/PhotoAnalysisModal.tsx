"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";

export interface PhotoAnalysisPrefill {
  food_name: string;
  amount: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  sugar: number;
  sodium: number;
}

interface PhotoAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyzed: (prefill: PhotoAnalysisPrefill) => void;
}

const DEFAULT_FOOD_NAME = "추정 식품";

export default function PhotoAnalysisModal({ isOpen, onClose, onAnalyzed }: PhotoAnalysisModalProps) {
  const [step, setStep] = useState<"upload" | "analyzing">("upload");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = useCallback(() => {
    setStep("upload");
    setImagePreview(null);
    setErrorMessage(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const analyzeImage = useCallback(
    async (file: File) => {
      setStep("analyzing");
      setErrorMessage(null);

      const data = new FormData();
      data.append("image", file);

      try {
        const response = await fetch("/api/analyze", { method: "POST", body: data });
        const body = (await response.json().catch(() => null)) as
          | Partial<PhotoAnalysisPrefill> & { menu_name?: string; error?: string }
          | null;

        if (!response.ok) {
          throw new Error(body?.error || "사진 분석에 실패했습니다.");
        }

        const foodName =
          (typeof body?.food_name === "string" && body.food_name.trim()) ||
          (typeof body?.menu_name === "string" && body.menu_name.trim()) ||
          DEFAULT_FOOD_NAME;

        onAnalyzed({
          food_name: foodName,
          amount: 100,
          calories: Number(body?.calories ?? 0),
          carbs: Number(body?.carbs ?? 0),
          protein: Number(body?.protein ?? 0),
          fat: Number(body?.fat ?? 0),
          sugar: Number(body?.sugar ?? 0),
          sodium: Number(body?.sodium ?? 0),
        });

        handleClose();
      } catch (error) {
        console.error(error);
        setErrorMessage(error instanceof Error ? error.message : "사진 분석에 실패했습니다.");
        setStep("upload");
        setImagePreview(null);
      }
    },
    [handleClose, onAnalyzed]
  );

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
                <p className="text-sm text-muted-foreground">분석 후 수기 입력 폼에 자동으로 채워집니다.</p>
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
              <p className="animate-pulse text-muted-foreground">AI 분석 중...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}