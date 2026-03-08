"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import ErrorBanner from "@/components/ErrorBanner";
import LoadingOverlay from "@/components/LoadingOverlay";
import ProfileEditModal from "@/components/my/ProfileEditModal";
import ProfileSummarySection from "@/components/my/ProfileSummarySection";
import { cacheKeys, getCachedData, setCachedData } from "@/lib/clientSyncCache";
import { showToast } from "@/lib/toast";
import { UserProfileInput, UserTargetsResponse } from "@/lib/types";

export default function MyPage() {
  const [data, setData] = useState<UserTargetsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [aiTestMessage, setAiTestMessage] = useState<string | null>(null);
  const [isAiTesting, setIsAiTesting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadData = async () => {
      try {
        const cached = getCachedData<UserTargetsResponse>(cacheKeys.user);
        if (cached) {
          if (!isActive) return;
          setData(cached);
          setErrorMessage(null);
          if (!cached.profileRegistered) setIsEditOpen(true);
          return;
        }

        const response = await fetch("/api/sheets/user", { cache: "no-store" });
        if (!response.ok) throw new Error("내정보를 불러오지 못했습니다.");

        const nextData = (await response.json()) as UserTargetsResponse;
        if (!isActive) return;

        setCachedData(cacheKeys.user, nextData);
        setData(nextData);
        setErrorMessage(null);
        if (!nextData.profileRegistered) setIsEditOpen(true);
      } catch (error) {
        if (!isActive) return;
        console.error(error);
        setErrorMessage("내정보를 불러오지 못했습니다.");
      } finally {
        if (isActive) setLoading(false);
      }
    };

    void loadData();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSave = async (profile: UserProfileInput) => {
    setSaveState("saving");
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/sheets/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (!response.ok) {
        const raw = await response.text();
        let message = "";
        try {
          const result = JSON.parse(raw) as { error?: string };
          message = result?.error ?? "";
        } catch {
          message = raw;
        }
        throw new Error(message || `프로필 저장에 실패했습니다. (HTTP ${response.status})`);
      }

      const nextData = (await response.json()) as UserTargetsResponse;
      setCachedData(cacheKeys.user, nextData);
      setData(nextData);
      setSaveState("success");
      setIsEditOpen(false);
      setErrorMessage(null);
      setSuccessMessage("내정보가 저장되었습니다.");
      showToast({ message: "내 정보 수정이 완료되었습니다.", type: "success" });
      window.setTimeout(() => setSuccessMessage(null), 2000);
    } catch (error) {
      console.error(error);
      setSaveState("error");
      setErrorMessage(error instanceof Error ? error.message : "프로필 저장에 실패했습니다.");
    } finally {
      setSaveState((prev) => (prev === "saving" ? "idle" : prev));
    }
  };

  const handleAiTest = async () => {
    if (isAiTesting) return;
    setIsAiTesting(true);
    setAiTestMessage(null);
    try {
      const response = await fetch("/api/sheets/user?refreshAi=1", { cache: "no-store" });
      if (!response.ok) throw new Error("AI 테스트 요청에 실패했습니다.");

      const result = (await response.json()) as UserTargetsResponse;
      setCachedData(cacheKeys.user, result);
      setData(result);
      const note = result.computed?.aiNotes?.trim();
      if (!note) {
        setAiTestMessage("AI 메모가 비어 있습니다.");
        return;
      }

      const source = result.computed?.aiSource === "ai" ? "AI" : "기본 계산";
      const debug = result.computed?.aiDebug ? ` (${result.computed.aiDebug})` : "";
      setAiTestMessage(`${source}: ${note}${debug}`);
    } catch (error) {
      console.error(error);
      setAiTestMessage("AI 응답 테스트에 실패했습니다.");
    } finally {
      setIsAiTesting(false);
    }
  };

  return (
    <motion.main
      className="space-y-4 p-4 pb-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <h1 className="text-2xl font-bold">내정보</h1>
      <ErrorBanner message={errorMessage} />

      {successMessage && (
        <div className="rounded-lg border border-emerald-300/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {successMessage}
        </div>
      )}

      {!loading && (!data?.profileRegistered || !data.profile) ? (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-sm text-muted-foreground">
            내정보를 등록하면 개인 맞춤 목표 칼로리와 영양소를 자동 계산합니다.
          </p>
          <motion.button
            onClick={() => setIsEditOpen(true)}
            className="mt-4 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
            whileTap={{ scale: 0.99 }}
          >
            등록하기
          </motion.button>
        </div>
      ) : !loading && data?.profile ? (
        <>
          <ProfileSummarySection profile={data.profile} computed={data.computed ?? null} />
          <motion.button
            onClick={() => setIsEditOpen(true)}
            className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-4 right-4 rounded-xl bg-primary py-3 font-semibold text-primary-foreground shadow-lg md:left-auto md:right-6 md:w-52"
            whileTap={{ scale: 0.99 }}
          >
            수정
          </motion.button>
        </>
      ) : null}

      {!loading && !data?.profileRegistered && (
        <div className="rounded-lg border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          등록 전에는 일부 기능 사용이 제한됩니다.
        </div>
      )}

      {!loading && (
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">AI 응답 테스트</p>
            <p className="text-xs text-muted-foreground">Gemini 응답 메모와 디버그 정보를 확인합니다.</p>
          </div>
          <motion.button
            onClick={handleAiTest}
            disabled={isAiTesting}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            whileTap={{ scale: 0.99 }}
          >
            {isAiTesting ? "테스트 중..." : "테스트 실행"}
          </motion.button>
        </div>

        {aiTestMessage && (
          <div className="mt-3 rounded-lg border border-amber-300/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            {aiTestMessage}
          </div>
        )}
        </div>
      )}

      {!loading && isEditOpen && (
        <ProfileEditModal
          key={data?.profileRegistered ? "edit-existing" : "edit-new"}
          isOpen={isEditOpen}
          initialProfile={data?.profile}
          saving={saveState === "saving"}
          errorMessage={saveState === "error" ? errorMessage : null}
          onClose={() => {
            if (!data?.profileRegistered) return;
            setIsEditOpen(false);
          }}
          onSave={handleSave}
        />
      )}

      <LoadingOverlay
        active={loading || saveState === "saving" || isAiTesting}
        label={
          loading
            ? "\ub0b4\uc815\ubcf4\ub97c \ubd88\ub7ec\uc624\ub294 \uc911\uc785\ub2c8\ub2e4..."
            : saveState === "saving"
              ? "\uc800\uc7a5 \ucc98\ub9ac \uc911\uc785\ub2c8\ub2e4..."
              : "AI \uc751\ub2f5\uc744 \ud655\uc778\ud558\ub294 \uc911\uc785\ub2c8\ub2e4..."
        }
      />
    </motion.main>
  );
}
