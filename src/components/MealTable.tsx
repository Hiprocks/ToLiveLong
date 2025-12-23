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
        <div className="w-full space-y-6">
            {groupedLogs.map(({ type, items }) => (
                <div key={type} className="space-y-2">
                    <h3 className="text-lg font-semibold capitalize text-primary">{type}</h3>
                    <div className="rounded-lg border border-border bg-card overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Menu</th>
                                    <th className="px-4 py-3 font-medium text-right">Kcal</th>
                                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">C</th>
                                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">P</th>
                                    <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">F</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{item.menu_name}</td>
                                            <td className="px-4 py-3 text-right">{item.calories}</td>
                                            <td className="px-4 py-3 text-right hidden sm:table-cell">{item.carbs}g</td>
                                            <td className="px-4 py-3 text-right hidden sm:table-cell">{item.protein}g</td>
                                            <td className="px-4 py-3 text-right hidden sm:table-cell">{item.fat}g</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground italic">
                                            No food logged yet
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
