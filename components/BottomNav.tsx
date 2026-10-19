"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Activity, CalendarDays, UserCheck, UserRound, LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

// Navbar listens for this to open the profile sheet (settings, language, logout)
export const OPEN_PROFILE_EVENT = "lumino:open-profile";

type TabProps = {
  href?: string;
  onClick?: () => void;
  label: string;
  icon: LucideIcon;
  active: boolean;
};

function Tab({ href, onClick, label, icon: Icon, active }: TabProps) {
  const className = `flex flex-col items-center justify-center gap-1 min-w-0 h-full px-0.5 tap-effect transition-colors ${
    active ? "text-emerald-700" : "text-slate-400 hover:text-slate-600"
  }`;
  const content = (
    <>
      <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.3 : 1.9} />
      <span className={`max-w-full truncate text-[10.5px] leading-none ${active ? "font-bold" : "font-medium"}`}>
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-current={active ? "page" : undefined} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname.includes("/workout/player")) {
    return null;
  }

  const homeActive = pathname === "/" || pathname.startsWith("/workout");

  return (
    <nav
      aria-label="Ana gezinme"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white border-t border-slate-900/[0.06] shadow-[0_-4px_20px_-8px_rgba(15,26,23,0.08)] pb-safe"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
        <Tab href="/routines" label={t("navRoutines")} icon={CalendarDays} active={pathname.startsWith("/routines")} />
        <Tab href="/metrics" label={t("navMetrics")} icon={Activity} active={pathname.startsWith("/metrics")} />

        {/* Center home button, raised above the bar */}
        <Link
          href="/workout"
          aria-current={homeActive ? "page" : undefined}
          aria-label={t("navHome")}
          className="group flex flex-col items-center justify-end gap-1 h-full pb-[9px] tap-effect"
        >
          <span
            className={`-mt-7 flex items-center justify-center w-14 h-14 rounded-full ring-[5px] ring-[#F6F7F5] shadow-lg transition-colors duration-200 ${
              homeActive
                ? "bg-emerald-600 text-white shadow-emerald-700/30"
                : "bg-slate-900 text-white shadow-slate-900/20"
            }`}
          >
            <Home className="w-6 h-6" strokeWidth={2.2} />
          </span>
          <span
            className={`text-[10.5px] leading-none ${homeActive ? "font-bold text-emerald-700" : "font-medium text-slate-400"}`}
          >
            {t("navHome")}
          </span>
        </Link>

        <Tab href="/coach" label={t("navCoach")} icon={UserCheck} active={pathname.startsWith("/coach")} />
        <Tab
          label={t("navProfile")}
          icon={UserRound}
          active={false}
          onClick={() => window.dispatchEvent(new Event(OPEN_PROFILE_EVENT))}
        />
      </div>
    </nav>
  );
}
