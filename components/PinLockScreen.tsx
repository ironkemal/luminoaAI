"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerWithInvitationPin, isAppUnlocked } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { Dumbbell, UserPlus, LogIn, CheckCircle2, KeyRound } from "lucide-react";

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
      <div className="min-h-screen flex items-center justify-center bg-[#090B0E]">
        <div className="w-8 h-8 border-2 border-white/20 border-t-[#E2F952] rounded-full animate-spin"></div>
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
    <div className="min-h-screen bg-[#090B0E] text-white flex flex-col items-center justify-center p-4 select-none relative">
      {/* Language Switcher Top Right */}
      <div className="absolute top-4 right-4 z-20 flex items-center bg-[#11151D] border border-white/[0.08] p-0.5 rounded-lg text-xs font-bold">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`px-2 py-1 rounded-md transition-all tap-effect flex items-center gap-1 ${
              language === l.code
                ? "bg-white/[0.12] text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm bg-[#11151D] rounded-2xl p-6 md:p-8 border border-white/[0.08] flex flex-col items-center animate-slide-up shadow-xl">
        {/* Minimalist Logo Badge */}
        <div className="w-12 h-12 rounded-xl bg-[#E2F952] text-black flex items-center justify-center mb-3">
          <Dumbbell className="w-6 h-6 stroke-[2.5]" />
        </div>

        <h1 className="text-xl font-black text-white tracking-tight">
          LUMINO<span className="text-[#E2F952]">PT</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5 mb-6 text-center">
          {t("loginSubtitle")}
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-[#090B0E] p-1 rounded-xl w-full mb-5 text-xs font-bold border border-white/[0.06]">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setLoginError("");
            }}
            className={`py-2 rounded-lg transition-all tap-effect flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-white/[0.12] text-white"
                : "text-slate-500 hover:text-slate-300"
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
            className={`py-2 rounded-lg transition-all tap-effect flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-white/[0.12] text-white"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> {t("registerTab")}
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="w-full space-y-3.5 animate-fade-in">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {t("usernameLabel")}
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="w-full px-3.5 py-2.5 bg-[#090B0E] border border-white/[0.08] rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {t("passwordLabel")}
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-3.5 py-2.5 bg-[#090B0E] border border-white/[0.08] rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 rounded-xl btn-primary text-xs tap-effect flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4 stroke-[2.5]" />
              {isLoggingIn ? t("loggingIn") : t("loginButton")}
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-500">
                {t("noAccountHint")}
              </span>
            </div>
          </form>
        )}

        {/* ── REGISTER FORM ── */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="w-full space-y-3 animate-fade-in">
            {regError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                {regError}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-[11px] text-slate-300 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-[#E2F952] flex-shrink-0 mt-0.5" />
              <span>{t("registerBadge")}</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {t("invitationPinLabel")}
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={regPin}
                onChange={(e) => setRegPin(e.target.value)}
                placeholder={t("invitationPinPlaceholder")}
                className="w-full px-3.5 py-2 bg-[#090B0E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952] tracking-widest font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {t("displayNameLabel")}
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder={t("displayNamePlaceholder")}
                className="w-full px-3.5 py-2 bg-[#090B0E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {t("usernameLabel")} *
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="w-full px-3.5 py-2 bg-[#090B0E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                {t("passwordLabel")} *
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-3.5 py-2 bg-[#090B0E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952]"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3 rounded-xl btn-primary text-xs tap-effect flex items-center justify-center gap-2 mt-2"
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
