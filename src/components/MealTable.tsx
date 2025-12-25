"use client";

import { Trash2 } from "lucide-react";

interface MealLog {
    id: string;
    meal_type: string;
    menu_name: string;
    calories: number;
    carbs: number;
    protein: number;
    fat: number;
}

interface MealTableProps {
    logs: MealLog[];
}

export default function MealTable({ logs }: MealTableProps) {
    const mealOrder = ["breakfast", "lunch", "dinner", "snack"];

    // Group logs by meal type
    const groupedLogs = mealOrder.map(type => ({
        type,
        items: logs.filter(log => log.meal_type === type)
    }));

    return (
        <div className="w-full space-y-6 pb-24">
            {groupedLogs.map(({ type, items }) => (
                <div key={type} className="space-y-2">
                    <h3 className="text-lg font-bold capitalize text-primary flex items-center gap-2">
                        {type}
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                            {items.reduce((sum, item) => sum + item.calories, 0)} kcal
                        </span>
                    </h3>
                    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Menu</th>
                                    <th className="px-3 py-3 font-medium text-right">Kcal</th>
                                    <th className="px-2 py-3 font-medium text-right hidden xs:table-cell">C</th>
                                    <th className="px-2 py-3 font-medium text-right hidden xs:table-cell">P</th>
                                    <th className="px-2 py-3 font-medium text-right hidden xs:table-cell">F</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                <div className="line-clamp-1">{item.menu_name}</div>
                                                <div className="text-[10px] text-muted-foreground sm:hidden">
                                                    C:{item.carbs} P:{item.protein} F:{item.fat}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-right font-medium">{item.calories}</td>
                                            <td className="px-2 py-3 text-right hidden xs:table-cell text-muted-foreground">{item.carbs}</td>
                                            <td className="px-2 py-3 text-right hidden xs:table-cell text-emerald-600 font-medium">{item.protein}</td>
                                            <td className="px-2 py-3 text-right hidden xs:table-cell text-muted-foreground">{item.fat}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground text-xs italic">
                                            No food logged
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
}
