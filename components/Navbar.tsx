"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dumbbell,
  Activity,
  CalendarDays,
  UserCheck,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
  Shield,
  User,
  Sliders
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { AppUser } from "@/types";
import UserSettingsModal from "@/components/settings/UserSettingsModal";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getCurrentUser());
  }, []);

  // Close sidebar on route change
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
    { href: "/coach", label: t("navCoach"), icon: UserCheck, desc: "Harun Hoca ile Canlı Sohbet" },
  ];

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "de", label: "Deutsch", flag: "🇩🇪" },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between">
          {/* Left: Hamburger Button & Brand */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Hamburger Button (3 Çizgi) */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Menüyü Aç"
              className="p-2 -ml-1 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 tap-effect transition-colors"
            >
              <Menu className="w-6 h-6 stroke-[2.2]" />
            </button>

            {/* Brand Logo */}
            <Link
              href="/workout"
              className="flex items-center gap-2 group select-none"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <span className="text-base font-extrabold tracking-tight text-slate-900 flex items-center gap-1">
                  Lumino<span className="text-emerald-600">PT</span>
                </span>
                <span className="hidden sm:block text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
                  {t("brandSubtitle")}
                </span>
              </div>
            </Link>
          </div>

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

          {/* Right: Language Switcher & User Account */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Quick Language Switcher */}
            <div className="flex items-center gap-0.5 bg-slate-100 p-0.5 rounded-xl text-[11px] font-bold">
              {languages.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  title={l.label}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg transition-all tap-effect flex items-center gap-0.5 ${
                    language === l.code
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>{l.flag}</span>
                  <span className="hidden sm:inline text-[10px] font-extrabold">{l.code.toUpperCase()}</span>
                </button>
              ))}
            </div>

            {currentUser && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Profil & Ekipman Ayarları"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-xs tap-effect transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                </div>
                <span className="font-bold text-slate-800 hidden sm:inline">
                  {currentUser.display_name || currentUser.username}
                </span>
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
              </button>
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

      {/* User Settings Modal */}
      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* ── LEFT SLIDE-OUT SIDEBAR / DRAWER MENU ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Dark Backdrop */}
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-fade-in"
          />

          {/* Sidebar Content Panel */}
          <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-slide-right overflow-y-auto">
            <div className="space-y-6">
              {/* Header: Brand & Close */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20">
                    <Dumbbell className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                      Lumino<span className="text-emerald-600">PT</span>
                    </h2>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                      {t("brandSubtitle")}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 tap-effect"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active User Card */}
              {currentUser && (
                <div
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-between gap-3 cursor-pointer tap-effect transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                      {currentUser.display_name?.[0]?.toUpperCase() || currentUser.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {currentUser.display_name || currentUser.username}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        @{currentUser.username} • {currentUser.current_weight_kg || 100} kg • {currentUser.fitness_goal || "Recomp"}
                      </p>
                    </div>
                  </div>
                  <Sliders className="w-4 h-4 text-slate-400" />
                </div>
              )}

              {/* Navigation Links */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Menü & Sayfalar
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
                          ? "bg-emerald-50 text-emerald-800 font-bold border border-emerald-200 shadow-sm"
                          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl transition-colors ${
                            isActive
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
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
                      <ChevronRight className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-300"}`} />
                    </Link>
                  );
                })}
              </div>

              {/* Language Selector */}
              <div className="pt-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">
                  Dil Seçimi / Language
                </p>
                <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl">
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
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
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
            <div className="pt-4 border-t border-slate-100 mt-6">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs tap-effect flex items-center justify-center gap-2 transition-colors"
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
