"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didOpenPickerRef = useRef(false);
  const waitingPickerResultRef = useRef(false);
  const cancelCloseTimerRef = useRef<number | null>(null);

  const resetState = useCallback(() => {
    setIsAnalyzing(false);
    setImagePreview(null);
    didOpenPickerRef.current = false;
    waitingPickerResultRef.current = false;
    if (cancelCloseTimerRef.current !== null) {
      window.clearTimeout(cancelCloseTimerRef.current);
      cancelCloseTimerRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const analyzeImage = useCallback(
    async (file: File) => {
      waitingPickerResultRef.current = false;
      setIsAnalyzing(true);

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

        const parsedAmount = Number(body?.amount ?? 100);
        const safeAmount = Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : 100;

        onAnalyzed({
          food_name: foodName,
          amount: safeAmount,
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
        handleClose();
      }
    },
    [handleClose, onAnalyzed]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    waitingPickerResultRef.current = false;
    if (cancelCloseTimerRef.current !== null) {
      window.clearTimeout(cancelCloseTimerRef.current);
      cancelCloseTimerRef.current = null;
    }
    const file = e.target.files?.[0];
    if (!file) {
      handleClose();
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      void analyzeImage(file);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (!didOpenPickerRef.current) {
      didOpenPickerRef.current = true;
      waitingPickerResultRef.current = true;
      window.setTimeout(() => {
        if (!fileInputRef.current) return;
        fileInputRef.current.value = "";
        fileInputRef.current.click();
      }, 0);
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    const handleWindowFocus = () => {
      if (!waitingPickerResultRef.current) return;
      if (cancelCloseTimerRef.current !== null) {
        window.clearTimeout(cancelCloseTimerRef.current);
      }
      cancelCloseTimerRef.current = window.setTimeout(() => {
        if (!waitingPickerResultRef.current) return;
        const hasPickedFile = Boolean(fileInputRef.current?.files?.length);
        if (!hasPickedFile && !isAnalyzing && !imagePreview) {
          handleClose();
        }
      }, 300);
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("focus", handleWindowFocus);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("focus", handleWindowFocus);
      if (cancelCloseTimerRef.current !== null) {
        window.clearTimeout(cancelCloseTimerRef.current);
        cancelCloseTimerRef.current = null;
      }
    };
  }, [handleClose, imagePreview, isAnalyzing, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {isAnalyzing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="flex w-full max-w-md flex-col items-center justify-center space-y-4 rounded-2xl border border-border bg-card p-8 shadow-2xl">
            <div className="relative h-32 w-32 overflow-hidden rounded-xl shadow-lg">
              {imagePreview && <Image src={imagePreview} alt="미리보기" fill className="object-cover" />}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            </div>
            <p className="animate-pulse text-sm text-muted-foreground">AI 분석 중...</p>
          </div>
        </div>
      )}
    </>
  );
}
