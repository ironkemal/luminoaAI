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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#0C0F15]/95 backdrop-blur-lg border-t border-white/[0.08] px-3 py-1.5 md:hidden">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all tap-effect ${
                item.active
                  ? "text-[#E2F952] font-bold"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon className={`w-5 h-5 stroke-[2] ${item.active ? "text-[#E2F952]" : "text-slate-500"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
