"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "오늘", icon: Home },
    { href: "/history", label: "기록", icon: CalendarDays },
    { href: "/my", label: "내정보", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pb-safe">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex h-full w-full flex-col items-center justify-center space-y-1 ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
