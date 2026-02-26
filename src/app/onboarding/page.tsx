"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import ErrorBanner from "@/components/ErrorBanner";
import { calculateTargets, DailyTargets, UserStats } from "@/lib/calculations";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"input" | "result">("input");
  const [targets, setTargets] = useState<DailyTargets | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [stats, setStats] = useState<UserStats>({
    gender: "male",
    height: 168,
    weight: 60,
    birthYear: 1984,
    activityLevel: "sedentary",
    goal: "bulk",
  });

  const handleCalculate = () => {
    const result = calculateTargets(stats);
    setTargets(result);
    setStep("result");
    setErrorMessage(null);
  };

  const handleStart = () => {
    if (!targets) return;
    const saveTargets = async () => {
      const response = await fetch("/api/sheets/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targets),
      });
      if (!response.ok) throw new Error("목표 저장에 실패했습니다.");
      router.push("/");
    };

    void saveTargets().catch((error) => {
      console.error(error);
      setErrorMessage("목표 저장에 실패했습니다.");
    });
  };

  if (step === "result" && targets) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center space-y-8 bg-background p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">일일 목표 결과</h1>
          <p className="text-muted-foreground">입력한 정보 기반으로 목표를 계산했습니다.</p>
        </div>
        <ErrorBanner message={errorMessage} />

        <div className="w-full max-w-sm space-y-6 rounded-3xl border border-border bg-card p-8 text-center shadow-xl">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">일일 목표</p>
            <div className="text-5xl font-black tracking-tight text-primary">
              {targets.calories}
              <span className="ml-1 text-lg font-medium text-muted-foreground">kcal</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">탄수화물</p>
              <p className="text-xl font-bold">{targets.carbs}g</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">단백질</p>
              <p className="text-xl font-bold text-emerald-500">{targets.protein}g</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">지방</p>
              <p className="text-xl font-bold">{targets.fat}g</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
            <div>당 &lt; {targets.sugar}g</div>
            <div>나트륨 &lt; {targets.sodium}mg</div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="flex w-full max-w-sm items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground transition-all active:scale-95 hover:bg-primary/90"
        >
          시작하기 <ChevronRight className="h-5 w-5" />
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-background p-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">환영합니다</h1>
        <p className="text-muted-foreground">개인 맞춤 목표를 먼저 계산합니다.</p>
      </div>
      <ErrorBanner message={errorMessage} />

      <div className="space-y-4">
        <label className="text-sm text-muted-foreground">성별</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setStats((prev) => ({ ...prev, gender: "male" }))}
            className={`rounded-lg border px-3 py-2 ${stats.gender === "male" ? "border-primary" : "border-border"}`}
          >
            남성
          </button>
          <button
            onClick={() => setStats((prev) => ({ ...prev, gender: "female" }))}
            className={`rounded-lg border px-3 py-2 ${stats.gender === "female" ? "border-primary" : "border-border"}`}
          >
            여성
          </button>
        </div>

        <label className="text-sm text-muted-foreground">키 (cm)</label>
        <input
          type="number"
          value={stats.height}
          onChange={(e) => setStats((prev) => ({ ...prev, height: Number(e.target.value) || 0 }))}
          className="w-full rounded-lg border border-border bg-input px-3 py-2"
        />

        <label className="text-sm text-muted-foreground">체중 (kg)</label>
        <input
          type="number"
          value={stats.weight}
          onChange={(e) => setStats((prev) => ({ ...prev, weight: Number(e.target.value) || 0 }))}
          className="w-full rounded-lg border border-border bg-input px-3 py-2"
        />

        <label className="text-sm text-muted-foreground">출생연도</label>
        <input
          type="number"
          value={stats.birthYear}
          onChange={(e) => setStats((prev) => ({ ...prev, birthYear: Number(e.target.value) || 0 }))}
          className="w-full rounded-lg border border-border bg-input px-3 py-2"
        />

        <label className="text-sm text-muted-foreground">활동량</label>
        <select
          value={stats.activityLevel}
          onChange={(e) => setStats((prev) => ({ ...prev, activityLevel: e.target.value as UserStats["activityLevel"] }))}
          className="w-full rounded-lg border border-border bg-input px-3 py-2"
        >
          <option value="sedentary">거의 없음</option>
          <option value="light">가벼움</option>
          <option value="moderate">보통</option>
          <option value="active">높음</option>
          <option value="very_active">매우 높음</option>
        </select>

        <label className="text-sm text-muted-foreground">목표</label>
        <div className="grid grid-cols-3 gap-2">
          {(["cut", "maintain", "bulk"] as const).map((goal) => (
            <button
              key={goal}
              onClick={() => setStats((prev) => ({ ...prev, goal }))}
              className={`rounded-lg border px-3 py-2 ${
                stats.goal === goal ? "border-primary bg-primary/5 text-primary" : "border-border"
              }`}
            >
              {goal === "cut" ? "감량" : goal === "maintain" ? "유지" : "증량"}
            </button>
          ))}
        </div>

        <button
          onClick={handleCalculate}
          className="mt-4 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground"
        >
          목표 계산
        </button>
      </div>
    </main>
  );
}
