"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateTargets, UserStats, DailyTargets } from "@/lib/calculations";
import { ChevronRight, Activity, Ruler, Weight, Calendar, Target } from "lucide-react";

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState<"input" | "result">("input");

    const [stats, setStats] = useState<UserStats>({
        gender: "male",
        height: 168,
        weight: 60,
        birthYear: 1984,
        activityLevel: "sedentary",
        goal: "bulk",
    });

    const [targets, setTargets] = useState<DailyTargets | null>(null);

    const handleCalculate = () => {
        const result = calculateTargets(stats);
        setTargets(result);
        setStep("result");
    };

    const handleStart = () => {
        if (targets) {
            // Save to localStorage for MVP persistence
            localStorage.setItem("user_targets", JSON.stringify(targets));
            localStorage.setItem("user_stats", JSON.stringify(stats));
            router.push("/");
        }
    };

    if (step === "result" && targets) {
        return (
            <main className="min-h-screen bg-background p-6 flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Your Daily Plan</h1>
                    <p className="text-muted-foreground">Based on your stats & goal</p>
                </div>

                <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-8 shadow-xl text-center space-y-6">
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Daily Target</p>
                        <div className="text-5xl font-black text-primary tracking-tight">
                            {targets.calories}
                            <span className="text-lg font-medium text-muted-foreground ml-1">kcal</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Carbs</p>
                            <p className="text-xl font-bold">{targets.carbs}g</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Protein</p>
                            <p className="text-xl font-bold text-emerald-500">{targets.protein}g</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">Fat</p>
                            <p className="text-xl font-bold">{targets.fat}g</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div>Sugar &lt; {targets.sugar}g</div>
                        <div>Sodium &lt; {targets.sodium}mg</div>
                    </div>
                </div>

                <button
                    onClick={handleStart}
                    className="w-full max-w-sm bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    Start Journey <ChevronRight className="w-5 h-5" />
                </button>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-background p-6 flex flex-col justify-center max-w-md mx-auto">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome</h1>
                <p className="text-muted-foreground">Let's calculate your personalized diet plan.</p>
            </div>

            <div className="space-y-6">
                {/* Gender */}
                <div className="grid grid-cols-2 gap-4 p-1 bg-muted rounded-xl">
                    {(["male", "female"] as const).map((g) => (
                        <button
                            key={g}
                            onClick={() => setStats({ ...stats, gender: g })}
                            className={`py-3 rounded-lg text-sm font-medium transition-all capitalize ${stats.gender === g
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Height */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Ruler className="w-4 h-4 text-primary" /> Height (cm)
                        </label>
                        <input
                            type="number"
                            value={stats.height}
                            onChange={(e) => setStats({ ...stats, height: Number(e.target.value) })}
                            className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>

                    {/* Weight */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <Weight className="w-4 h-4 text-primary" /> Weight (kg)
                        </label>
                        <input
                            type="number"
                            value={stats.weight}
                            onChange={(e) => setStats({ ...stats, weight: Number(e.target.value) })}
                            className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                </div>

                {/* Birth Year */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" /> Birth Year
                    </label>
                    <input
                        type="number"
                        value={stats.birthYear}
                        onChange={(e) => setStats({ ...stats, birthYear: Number(e.target.value) })}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none"
                    />
                </div>

                {/* Activity Level */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" /> Activity Level
                    </label>
                    <select
                        value={stats.activityLevel}
                        onChange={(e) => setStats({ ...stats, activityLevel: e.target.value as any })}
                        className="w-full bg-input border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none appearance-none"
                    >
                        <option value="sedentary">Sedentary (Office job, little exercise)</option>
                        <option value="light">Light (Exercise 1-3 times/week)</option>
                        <option value="moderate">Moderate (Exercise 3-5 times/week)</option>
                        <option value="active">Active (Daily exercise)</option>
                        <option value="very_active">Very Active (Physical job + training)</option>
                    </select>
                </div>

                {/* Goal */}
                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-primary" /> Goal
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                        {(["cut", "maintain", "bulk"] as const).map((g) => (
                            <button
                                key={g}
                                onClick={() => setStats({ ...stats, goal: g })}
                                className={`py-3 px-2 rounded-xl text-sm font-medium border transition-all capitalize ${stats.goal === g
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-border bg-card hover:border-primary/50"
                                    }`}
                            >
                                {g}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleCalculate}
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-95 mt-8"
                >
                    Calculate Plan
                </button>
            </div>
        </main>
    );
}
