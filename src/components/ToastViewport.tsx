"use client";

import { useEffect, useRef, useState } from "react";
import { toastEventName, ToastPayload } from "@/lib/toast";

const TOAST_DURATION_MS = 3000;

export default function ToastViewport() {
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const clearTimer = () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const handleToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastPayload>;
      setToast(customEvent.detail);
      clearTimer();
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, TOAST_DURATION_MS);
    };

    window.addEventListener(toastEventName, handleToast as EventListener);
    return () => {
      window.removeEventListener(toastEventName, handleToast as EventListener);
      clearTimer();
    };
  }, []);

  if (!toast) return null;

  const toneClass =
    toast.type === "error"
      ? "border-red-400/50 bg-red-500/90"
      : toast.type === "info"
        ? "border-sky-400/50 bg-sky-500/90"
        : "border-emerald-400/50 bg-emerald-500/90";

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4">
      <div className={`w-full max-w-md rounded-lg border px-4 py-3 text-sm font-semibold text-white shadow-2xl ${toneClass}`}>
        {toast.message}
      </div>
    </div>
  );
}
