"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dumbbell,
  Activity,
  CalendarDays,
  Bot,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  User,
  Zap
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { AppUser } from "@/types";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  if (pathname.includes("/workout/player")) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };

  const navLinks = [
    { href: "/workout", label: t("navWorkout"), icon: Dumbbell, desc: "Döngüsel Antrenman" },
    { href: "/metrics", label: t("navMetrics"), icon: Activity, desc: "Ölçüm, Kilo & Fotoğraflar" },
    { href: "/routines", label: t("navRoutines"), icon: CalendarDays, desc: "Programlar & Kütüphane" },
    { href: "/coach", label: t("navCoach"), icon: Bot, desc: "AI Antrenör Danışmanı" },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "tr", label: "TR", flag: "🇹🇷" },
    { code: "en", label: "EN", flag: "🇬🇧" },
    { code: "de", label: "DE", flag: "🇩🇪" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-[#0C0F15]/95 backdrop-blur-md border-b border-white/[0.07]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between">
          {/* Left: Hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Menü"
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] tap-effect transition-colors"
            >
              <Menu className="w-5 h-5 stroke-[2]" />
            </button>

            <Link
              href="/workout"
              className="flex items-center gap-2.5 group select-none"
            >
              <div className="w-7 h-7 rounded-lg bg-[#E2F952] text-black font-black text-xs flex items-center justify-center">
                <Dumbbell className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-black tracking-tight text-white">
                  LUMINO<span className="text-[#E2F952]">PT</span>
                </span>
                <span className="hidden sm:inline text-[9px] font-bold text-slate-500 uppercase tracking-wider ml-1">
                  PRO
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-white/[0.09] text-white"
                      : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#E2F952]" : "text-slate-500"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Language & User */}
          <div className="flex items-center gap-2">
            {/* Language Switcher */}
            <div className="flex items-center bg-[#141822] border border-white/[0.08] p-0.5 rounded-lg text-[11px] font-bold">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  title={l.label}
                  className={`px-2 py-1 rounded-md transition-all tap-effect flex items-center gap-1 ${
                    language === l.code
                      ? "bg-white/[0.12] text-white font-black"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span className="text-[10px]">{l.label}</span>
                </button>
              ))}
            </div>

            {currentUser && (
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#141822] border border-white/[0.08] text-xs">
                <div className="w-5 h-5 rounded-md bg-[#E2F952] text-black font-black text-[10px] flex items-center justify-center">
                  {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                </div>
                <span className="font-bold text-slate-300 text-xs">
                  {currentUser.display_name || currentUser.username}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title={t("logout")}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/[0.06] tap-effect transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── MINIMALIST LEFT SIDEBAR DRAWER ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
          />

          <div className="relative w-80 max-w-[85vw] bg-[#0E121A] border-r border-white/[0.08] h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-slide-right overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#E2F952] text-black font-black flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">
                      LUMINO<span className="text-[#E2F952]">PT</span>
                    </h2>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">
                      Personal Performance
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] tap-effect"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Profile Info */}
              {currentUser && (
                <div className="p-3 rounded-xl bg-[#141822] border border-white/[0.06] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#E2F952] text-black font-black text-xs flex items-center justify-center">
                    {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">
                      {currentUser.display_name || currentUser.username}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">
                      @{currentUser.username} • Recomp Plan
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                  Sayfalar
                </p>
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
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center justify-between p-2.5 rounded-xl transition-all tap-effect ${
                        isActive
                          ? "bg-white/[0.1] text-white font-bold"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? "text-[#E2F952]" : "text-slate-500"}`} />
                        <div>
                          <div className="text-xs font-semibold">{link.label}</div>
                          <div className="text-[10px] text-slate-500 font-normal">{link.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                    </Link>
                  );
                })}
              </div>

              {/* Language Picker in Drawer */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">
                  Dil
                </p>
                <div className="grid grid-cols-3 gap-1 bg-[#141822] p-1 rounded-xl border border-white/[0.06]">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setIsSidebarOpen(false);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all tap-effect flex items-center justify-center gap-1 ${
                        language === l.code
                          ? "bg-white/[0.12] text-white"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-white/[0.06] mt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-red-500/10 text-slate-400 hover:text-red-400 font-bold text-xs tap-effect flex items-center justify-center gap-2 transition-colors border border-white/[0.06]"
              >
                <LogOut className="w-4 h-4" />
                {t("logout")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
