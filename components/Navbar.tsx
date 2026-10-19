"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dumbbell,
  Activity,
  CalendarDays,
  UserCheck,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sliders,
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { AppUser } from "@/types";
import UserSettingsModal from "@/components/settings/UserSettingsModal";
import { OPEN_PROFILE_EVENT } from "@/components/BottomNav";

const LANGUAGES: { code: Language; label: string }[] = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
];

function isLinkActive(pathname: string, href: string) {
  return pathname === href || (href === "/workout" && pathname === "/") || pathname.startsWith(href);
}

function Avatar({ user, size = "sm" }: { user: AppUser; size?: "sm" | "lg" }) {
  const initial = (user.display_name?.[0] || user.username[0] || "?").toUpperCase();
  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center bg-emerald-600 text-white font-bold ${
        size === "lg" ? "w-11 h-11 rounded-2xl text-base" : "w-8 h-8 rounded-xl text-sm"
      }`}
    >
      {initial}
    </span>
  );
}

function BrandMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      className={`shrink-0 inline-flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-700/20 ${
        size === "lg" ? "w-10 h-10 rounded-2xl" : "w-8 h-8 rounded-xl"
      }`}
    >
      <Dumbbell className={size === "lg" ? "w-5 h-5" : "w-4 h-4"} />
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
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

  // Mobile: the bottom nav's "Profil" tab opens this panel
  useEffect(() => {
    const open = () => setIsSidebarOpen(true);
    window.addEventListener(OPEN_PROFILE_EVENT, open);
    return () => window.removeEventListener(OPEN_PROFILE_EVENT, open);
  }, []);

  // Lock body scroll + close on Escape while the drawer is open
  useEffect(() => {
    if (!isSidebarOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsSidebarOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isSidebarOpen]);

  if (pathname.includes("/workout/player")) {
    return null;
  }

  const navLinks = [
    { href: "/workout", label: t("navWorkout"), icon: Dumbbell, desc: "Döngüsel antrenman & sayaç" },
    { href: "/metrics", label: t("navMetrics"), icon: Activity, desc: "Kilo, mezura & fotoğraflar" },
    { href: "/routines", label: t("navRoutines"), icon: CalendarDays, desc: "Programlar & egzersiz rehberi" },
    { href: "/coach", label: t("navCoach"), icon: UserCheck, desc: "Harun Hoca ile sohbet" },
  ];

  const displayName = currentUser?.display_name || currentUser?.username;

  return (
    <>
      {/* Desktop only — on mobile the fixed bottom nav handles navigation */}
      <header className="hidden md:block sticky top-0 z-30 w-full bg-white/85 backdrop-blur-xl border-b border-slate-900/[0.06] pt-safe">
        <div className="max-w-6xl mx-auto h-14 px-2 sm:px-6 flex items-center gap-2">
          {/* Left: menu + brand */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Menüyü aç"
            className="icon-btn text-slate-700"
          >
            <Menu />
          </button>

          <Link href="/workout" className="flex items-center gap-2 min-w-0 select-none">
            <BrandMark />
            <span className="text-[17px] font-extrabold tracking-tight text-slate-900 whitespace-nowrap">
              Lumino<span className="text-emerald-600">PT</span>
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-1 ml-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isLinkActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-semibold transition-colors ${
                    active ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-emerald-600" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right */}
          <div className="ml-auto flex items-center gap-1">
            {/* Language: desktop only — mobile lives in the drawer */}
            <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100 mr-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  title={l.label}
                  className={`h-7 px-2 rounded-md text-[11px] font-bold tracking-wide transition-colors ${
                    language === l.code ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {l.code.toUpperCase()}
                </button>
              ))}
            </div>

            {currentUser && (
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                aria-label="Profil ve ekipman ayarları"
                className="flex items-center gap-2 h-10 pl-1 pr-1 md:pr-3 rounded-xl hover:bg-slate-100 tap-effect transition-colors"
              >
                <Avatar user={currentUser} />
                <span className="hidden md:inline max-w-[9rem] truncate text-sm font-semibold text-slate-800">
                  {displayName}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              title={t("logout")}
              aria-label={t("logout")}
              className="icon-btn hidden md:inline-flex hover:text-red-600"
            >
              <LogOut className="!w-[18px] !h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <UserSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onUserUpdated={(updated) => setCurrentUser(updated)}
      />

      {/* ── Slide-out drawer ── */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menü">
          <div onClick={() => setIsSidebarOpen(false)} className="absolute inset-0 bg-slate-950/50 animate-fade-in" />

          {/* Mobile: bottom sheet · Desktop: left drawer */}
          <aside className="absolute inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl animate-sheet-up md:inset-x-auto md:bottom-auto md:inset-y-0 md:left-0 md:max-h-none md:w-[19rem] md:rounded-none md:animate-drawer-in md:pt-safe bg-white shadow-2xl flex flex-col pb-safe">
            <div className="md:hidden flex justify-center pt-2.5" aria-hidden>
              <span className="w-10 h-1 rounded-full bg-slate-200" />
            </div>
            <div className="flex items-center justify-between gap-2 px-4 h-16 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <BrandMark size="lg" />
                <div className="min-w-0">
                  <p className="text-base font-extrabold leading-tight text-slate-900">
                    Lumino<span className="text-emerald-600">PT</span>
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{t("brandSubtitle")}</p>
                </div>
              </div>
              <button type="button" onClick={() => setIsSidebarOpen(false)} aria-label="Menüyü kapat" className="icon-btn">
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsSettingsOpen(true);
                  }}
                  className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 flex items-center gap-3 tap-effect transition-colors"
                >
                  <Avatar user={currentUser} size="lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate tabular-nums">
                      @{currentUser.username} · {currentUser.current_weight_kg || 100} kg
                    </p>
                  </div>
                  <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              )}

              {/* Page links: desktop drawer only — mobile has them in the bottom nav */}
              <nav className="hidden md:block space-y-1">
                <p className="eyebrow px-2 pb-1">Menü</p>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = isLinkActive(pathname, link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsSidebarOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 p-2.5 rounded-xl tap-effect transition-colors ${
                        active ? "bg-emerald-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 shrink-0 rounded-lg inline-flex items-center justify-center ${
                          active ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm font-semibold ${active ? "text-emerald-800" : "text-slate-800"}`}>
                          {link.label}
                        </span>
                        <span className="block text-xs text-slate-400 truncate">{link.desc}</span>
                      </span>
                      <ChevronRight className={`w-4 h-4 shrink-0 ${active ? "text-emerald-600" : "text-slate-300"}`} />
                    </Link>
                  );
                })}
              </nav>

              <div>
                <p className="eyebrow px-2 pb-2">Dil / Language</p>
                <div className="segmented">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      data-active={language === l.code}
                      onClick={() => setLanguage(l.code)}
                      className="segmented-item"
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100">
              <button type="button" onClick={logout} className="btn-danger btn-block">
                <LogOut />
                {t("logout")}
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
