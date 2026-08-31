"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Activity, CalendarDays, Bot } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname.includes("/workout/player")) {
    return null;
  }

  const navItems = [
    {
      href: "/workout",
      label: t("navWorkout"),
      icon: Dumbbell,
      active: pathname === "/" || pathname.startsWith("/workout"),
    },
    {
      href: "/metrics",
      label: t("navMetrics"),
      icon: Activity,
      active: pathname.startsWith("/metrics"),
    },
    {
      href: "/routines",
      label: t("navRoutines"),
      icon: CalendarDays,
      active: pathname.startsWith("/routines"),
    },
    {
      href: "/coach",
      label: t("navCoach"),
      icon: Bot,
      active: pathname.startsWith("/coach"),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/85 backdrop-blur-2xl border-t border-white/[0.08] px-3 py-2 md:hidden shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3.5 rounded-2xl transition-all tap-effect ${
                item.active
                  ? "text-emerald-400 font-extrabold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  item.active
                    ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30 scale-110"
                    : "bg-transparent text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[10px] mt-1 tracking-tight font-bold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
