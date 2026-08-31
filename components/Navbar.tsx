"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Dumbbell, Activity, CalendarDays, Bot, LogOut, Globe } from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { AppUser } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  if (pathname.includes("/workout/player")) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const navLinks = [
    { href: "/workout", label: t("navWorkout"), icon: Dumbbell },
    { href: "/metrics", label: t("navMetrics"), icon: Activity },
    { href: "/routines", label: t("navRoutines"), icon: CalendarDays },
    { href: "/coach", label: t("navCoach"), icon: Bot },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "tr", label: "TR", flag: "🇹🇷" },
    { code: "en", label: "EN", flag: "🇬🇧" },
    { code: "de", label: "DE", flag: "🇩🇪" },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/workout"
          className="flex items-center gap-2.5 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1">
              Lumino<span className="text-emerald-600">PT</span>
            </span>
            <span className="hidden sm:block text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
              {t("brandSubtitle")}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href === "/workout" && pathname === "/") ||
              pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Account / Profile Info & Language Picker */}
        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
            {languages.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                title={l.label}
                className={`px-2 py-1 rounded-lg transition-all tap-effect flex items-center gap-0.5 ${
                  language === l.code
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                <span>{l.flag}</span>
                <span className="hidden sm:inline">{l.label}</span>
              </button>
            ))}
          </div>

          {currentUser && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
              <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
              </div>
              <span className="font-bold text-slate-800 hidden sm:inline">
                {currentUser.display_name || currentUser.username}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={t("logout")}
            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-slate-100 tap-effect"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
