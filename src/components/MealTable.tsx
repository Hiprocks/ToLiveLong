"use client";

import { MealRecord } from "@/lib/types";

interface MealTableProps {
  logs: MealRecord[];
}

export default function MealTable({ logs }: MealTableProps) {
  if (logs.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
        오늘 등록된 식단이 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full pb-24">
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
            {logs.map((item) => (
              <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3 font-medium">
                  <div className="line-clamp-1">{item.food_name}</div>
                  <div className="text-[10px] text-muted-foreground sm:hidden">
                    {item.amount}g | C:{item.carbs} P:{item.protein} F:{item.fat}
                  </div>
                </td>
                <td className="px-3 py-3 text-right font-medium">{item.calories}</td>
                <td className="px-2 py-3 text-right hidden xs:table-cell text-muted-foreground">{item.carbs}</td>
                <td className="px-2 py-3 text-right hidden xs:table-cell text-emerald-600 font-medium">{item.protein}</td>
                <td className="px-2 py-3 text-right hidden xs:table-cell text-muted-foreground">{item.fat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

