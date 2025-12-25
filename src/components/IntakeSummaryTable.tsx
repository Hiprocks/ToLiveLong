"use client";

import { DailyTargets } from "@/lib/calculations";

interface IntakeSummaryTableProps {
    targets: DailyTargets;
    totals: {
        calories: number;
        carbs: number;
        protein: number;
        fat: number;
        sugar: number;
        sodium: number;
    };
}

export default function IntakeSummaryTable({ targets, totals }: IntakeSummaryTableProps) {
    const dateStr = new Date().toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });

    const rows = [
        {
            label: "목표량",
            calories: targets.calories,
            carbs: targets.carbs,
            protein: targets.protein,
            fat: targets.fat,
            sugar: targets.sugar,
            sodium: targets.sodium,
            className: "text-muted-foreground",
        },
        {
            label: "섭취량",
            calories: totals.calories,
            carbs: totals.carbs,
            protein: totals.protein,
            fat: totals.fat,
            sugar: totals.sugar,
            sodium: totals.sodium,
            className: "font-bold text-foreground",
        },
        {
            label: "잔여량",
            calories: targets.calories - totals.calories,
            carbs: targets.carbs - totals.carbs,
            protein: targets.protein - totals.protein,
            fat: targets.fat - totals.fat,
            sugar: targets.sugar - totals.sugar,
            sodium: targets.sodium - totals.sodium,
            className: (val: number) => (val < 0 ? "text-red-500 font-medium" : "text-emerald-500 font-medium"),
        },
    ];

    return (
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-center whitespace-nowrap">
                    <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                            <th className="px-3 py-2 font-medium sticky left-0 bg-muted/50">구분</th>
                            <th className="px-2 py-2 font-medium">칼로리</th>
                            <th className="px-2 py-2 font-medium">탄수</th>
                            <th className="px-2 py-2 font-medium">단백</th>
                            <th className="px-2 py-2 font-medium">지방</th>
                            <th className="px-2 py-2 font-medium">당</th>
                            <th className="px-2 py-2 font-medium">나트륨</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-muted/20 transition-colors">
                                <td className={`px-3 py-2 text-left sticky left-0 bg-card ${row.className}`}>
                                    {idx === 0 ? dateStr : ""} <span className="ml-1">{row.label}</span>
                                </td>
                                <td className="px-2 py-2">
                                    {typeof row.className === "function" ? (
                                        <span className={row.className(row.calories)}>{row.calories}</span>
                                    ) : (
                                        <span className={row.className}>{row.calories}</span>
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    {typeof row.className === "function" ? (
                                        <span className={row.className(row.carbs)}>{row.carbs}</span>
                                    ) : (
                                        <span className={row.className}>{row.carbs}</span>
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    {typeof row.className === "function" ? (
                                        <span className={row.className(row.protein)}>{row.protein}</span>
                                    ) : (
                                        <span className={row.className}>{row.protein}</span>
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    {typeof row.className === "function" ? (
                                        <span className={row.className(row.fat)}>{row.fat}</span>
                                    ) : (
                                        <span className={row.className}>{row.fat}</span>
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    {typeof row.className === "function" ? (
                                        <span className={row.className(row.sugar)}>{row.sugar}</span>
                                    ) : (
                                        <span className={row.className}>{row.sugar}</span>
                                    )}
                                </td>
                                <td className="px-2 py-2">
                                    {typeof row.className === "function" ? (
                                        <span className={row.className(row.sodium)}>{row.sodium}</span>
                                    ) : (
                                        <span className={row.className}>{row.sodium}</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
