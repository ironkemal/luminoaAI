"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Activity, CalendarDays, Bot, Lock } from "lucide-react";
import { lockApp } from "@/lib/auth-pin";

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav in active workout player mode to preserve focus
  if (pathname.includes("/workout/player")) {
    return null;
  }

  const navItems = [
    {
      href: "/workout",
      label: "Antrenman",
      icon: Dumbbell,
      active: pathname === "/" || pathname.startsWith("/workout"),
    },
    {
      href: "/metrics",
      label: "Ölçüm & Kilo",
      icon: Activity,
      active: pathname.startsWith("/metrics"),
    },
    {
      href: "/routines",
      label: "Programlar",
      icon: CalendarDays,
      active: pathname.startsWith("/routines"),
    },
    {
      href: "/coach",
      label: "AI PT",
      icon: Bot,
      active: pathname.startsWith("/coach"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all tap-effect ${
                item.active
                  ? "text-emerald-600 font-semibold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <div
                className={`p-1 rounded-lg ${
                  item.active ? "bg-emerald-50 text-emerald-600" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
