"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerWithInvitationPin, isAppUnlocked } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { Dumbbell, UserPlus, LogIn, CheckCircle2, KeyRound, Globe, Sparkles } from "lucide-react";

interface PinLockScreenProps {
  children: React.ReactNode;
}

export default function PinLockScreen({ children }: PinLockScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const [unlocked, setUnlocked] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login Form
  const [loginUsername, setLoginUsername] = useState("kemal");
  const [loginPassword, setLoginPassword] = useState("1234");
  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Register Form
  const [regPin, setRegPin] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regError, setRegError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    setIsMounting(false);
    if (isAppUnlocked()) {
      setUnlocked(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await loginUser(loginUsername, loginPassword);
      if (res.success) {
        setUnlocked(true);
      } else {
        setLoginError(res.error || t("userNotFound"));
      }
    } catch (err: any) {
      setLoginError(err.message || "Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setIsRegistering(true);
    try {
      const res = await registerWithInvitationPin(
        regPin,
        regUsername,
        regPassword,
        regDisplayName
      );
      if (res.success) {
        setUnlocked(true);
      } else {
        setRegError(res.error || t("invalidPinError"));
      }
    } catch (err: any) {
      setRegError(err.message || "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  if (isMounting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "tr", label: "TR", flag: "🇹🇷" },
    { code: "en", label: "EN", flag: "🇬🇧" },
    { code: "de", label: "DE", flag: "🇩🇪" },
  ];

  return (
    <div className="min-h-screen bg-[#080C14] text-white flex flex-col items-center justify-center p-4 select-none relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/90 backdrop-blur-xl p-1 rounded-2xl border border-white/[0.08] shadow-lg text-xs font-bold">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`px-2.5 py-1 rounded-xl transition-all tap-effect flex items-center gap-1 ${
              language === l.code
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm bg-slate-900/80 backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/[0.1] flex flex-col items-center animate-slide-up relative z-10">
        {/* Logo Badge */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 mb-4 animate-pulse-slow">
          <Dumbbell className="w-8 h-8 stroke-[2.5]" />
        </div>

        <h1 className="text-2xl font-black text-white tracking-tight">
          Lumino<span className="text-emerald-400">PT</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1 mb-6 text-center font-medium">
          {t("loginSubtitle")}
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-2xl w-full mb-6 text-xs font-bold border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setLoginError("");
            }}
            className={`py-2.5 rounded-xl transition-all tap-effect flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> {t("loginTab")}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setRegError("");
            }}
            className={`py-2.5 rounded-xl transition-all tap-effect flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/25"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> {t("registerTab")}
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="w-full space-y-4 animate-fade-in">
            {loginError && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold animate-shake">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                {t("usernameLabel")}
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/[0.1] rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                {t("passwordLabel")}
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-4 py-3 bg-slate-950/80 border border-white/[0.1] rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 tap-effect flex items-center justify-center gap-2 transition-all mt-3"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              {isLoggingIn ? t("loggingIn") : t("loginButton")}
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                {t("noAccountHint")}
              </span>
            </div>
          </form>
        )}

        {/* ── REGISTER FORM (INVITATION PIN IS HIDDEN) ── */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="w-full space-y-3.5 animate-fade-in">
            {regError && (
              <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs font-bold animate-shake">
                {regError}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{t("registerBadge")}</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {t("invitationPinLabel")}
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={regPin}
                onChange={(e) => setRegPin(e.target.value)}
                placeholder={t("invitationPinPlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/[0.1] rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 tracking-widest transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {t("displayNameLabel")}
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder={t("displayNamePlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/[0.1] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {t("usernameLabel")} *
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/[0.1] rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                {t("passwordLabel")} *
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-white/[0.1] rounded-2xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 tap-effect flex items-center justify-center gap-2 transition-all mt-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              {isRegistering ? t("registering") : t("registerButton")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
