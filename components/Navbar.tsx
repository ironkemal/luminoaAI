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
  Sparkles,
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
    { href: "/workout", label: t("navWorkout"), icon: Dumbbell, desc: "Döngüsel Antrenman & Sayaç" },
    { href: "/metrics", label: t("navMetrics"), icon: Activity, desc: "7G Hareketli Ort. & Mezura" },
    { href: "/routines", label: t("navRoutines"), icon: CalendarDays, desc: "Programlar & Egzersiz GIF'leri" },
    { href: "/coach", label: t("navCoach"), icon: Bot, desc: "Canlı PT Sohbeti & Karar Motoru" },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Hamburger Button & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Menüyü Aç"
              className="p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.08] tap-effect transition-colors"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Brand Logo */}
            <Link
              href="/workout"
              className="flex items-center gap-2.5 group select-none"
            >
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-white flex items-center gap-1">
                  Lumino<span className="text-emerald-400">PT</span>
                </span>
                <span className="hidden sm:block text-[9px] font-bold text-slate-400 -mt-1 tracking-widest uppercase">
                  {t("brandSubtitle")}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 border border-white/[0.08] p-1 rounded-2xl">
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 shadow-md shadow-emerald-500/30"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-slate-950 stroke-[2.5]" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Language Switcher & User Account */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Language Switcher */}
            <div className="flex items-center gap-0.5 bg-slate-900/80 border border-white/[0.08] p-0.5 rounded-xl text-[11px] font-bold">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  title={l.label}
                  className={`px-2 py-1 rounded-lg transition-all tap-effect flex items-center gap-0.5 ${
                    language === l.code
                      ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span className="hidden sm:inline text-[10px]">{l.code.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {currentUser && (
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] text-xs">
                <div className="w-5 h-5 rounded-lg bg-emerald-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-sm">
                  {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                </div>
                <span className="font-bold text-slate-200 hidden sm:inline">
                  {currentUser.display_name || currentUser.username}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              title={t("logout")}
              className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-white/[0.08] tap-effect transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── LEFT SLIDE-OUT SIDEBAR / DRAWER MENU ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Dark Backdrop */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-fade-in"
          />

          {/* Sidebar Content Panel */}
          <div className="relative w-80 max-w-[85vw] bg-slate-900 border-r border-white/[0.1] h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-slide-right overflow-y-auto">
            <div className="space-y-6">
              {/* Header: Brand & Close */}
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/30">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white leading-tight">
                      Lumino<span className="text-emerald-400">PT</span>
                    </h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                      {t("brandSubtitle")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] tap-effect"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active User Card */}
              {currentUser && (
                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-white/[0.08] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-md">
                    {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-white truncate">
                      {currentUser.display_name || currentUser.username}
                    </h4>
                    <p className="text-[10px] text-emerald-400 font-semibold truncate flex items-center gap-1 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      100 kg Recomp Modu
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">
                  Navigasyon
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
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all tap-effect group ${
                        isActive
                          ? "bg-emerald-500/15 text-emerald-300 font-black border border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                          : "text-slate-300 hover:bg-white/[0.05] hover:text-white font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl transition-colors ${
                            isActive
                              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30"
                              : "bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs">{link.label}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {link.desc}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-600"}`} />
                    </Link>
                  );
                })}
              </div>

              {/* Language Selector */}
              <div className="pt-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2 mb-2">
                  Dil Seçimi / Language
                </p>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-white/[0.08]">
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLanguage(l.code);
                        setIsSidebarOpen(false);
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center justify-center gap-1.5 ${
                        language === l.code
                          ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/25"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.code.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer / Logout */}
            <div className="pt-4 border-t border-white/[0.08] mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 font-bold text-xs tap-effect flex items-center justify-center gap-2 transition-colors"
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
