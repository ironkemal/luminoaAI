"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerWithInvitationPin, isAppUnlocked, setCurrentUser } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { AppUser } from "@/types";
import WelcomeOnboardingModal from "@/components/onboarding/WelcomeOnboardingModal";
import { Dumbbell, UserPlus, LogIn, CheckCircle2, KeyRound, Globe } from "lucide-react";

interface PinLockScreenProps {
  children: React.ReactNode;
}

export default function PinLockScreen({ children }: PinLockScreenProps) {
  const { language, setLanguage, t } = useLanguage();
  const [unlocked, setUnlocked] = useState(false);
  const [isMounting, setIsMounting] = useState(true);
  const [activeUser, setActiveUser] = useState<AppUser | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
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
    const user = getCurrentUser();
    if (user) {
      setActiveUser(user);
      setUnlocked(true);
      if (!user.onboarding_completed) {
        setShowOnboarding(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoggingIn(true);
    try {
      const res = await loginUser(loginUsername, loginPassword);
      if (res.success && res.user) {
        setActiveUser(res.user);
        setUnlocked(true);
        if (!res.user.onboarding_completed) {
          setShowOnboarding(true);
        }
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
      if (res.success && res.user) {
        setActiveUser(res.user);
        setUnlocked(true);
        // Brand new users always get the Onboarding Wizard!
        setShowOnboarding(true);
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (unlocked) {
    return (
      <>
        {children}
        {showOnboarding && activeUser && (
          <WelcomeOnboardingModal
            user={activeUser}
            isOpen={showOnboarding}
            onComplete={(updated) => {
              setActiveUser(updated);
              setCurrentUser(updated);
              setShowOnboarding(false);
            }}
          />
        )}
      </>
    );
  }

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "tr", label: "TR", flag: "🇹🇷" },
    { code: "en", label: "EN", flag: "🇬🇧" },
    { code: "de", label: "DE", flag: "🇩🇪" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 flex flex-col items-center justify-center p-4 select-none relative">
      {/* Language Switcher Top Right */}
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-white/90 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
        {languages.map((l) => (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code)}
            className={`px-2.5 py-1 rounded-xl transition-all tap-effect flex items-center gap-1 ${
              language === l.code
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <span>{l.flag}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm bg-white rounded-3xl p-6 md:p-8 shadow-card border border-slate-100 flex flex-col items-center animate-slide-up">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 mb-3">
          <Dumbbell className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight">{t("loginTitle")}</h1>
        <p className="text-xs text-slate-500 mt-0.5 mb-5 text-center">
          {t("loginSubtitle")}
        </p>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-2xl w-full mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setLoginError("");
            }}
            className={`py-2 rounded-xl transition-all tap-effect flex items-center justify-center gap-1.5 ${
              mode === "login"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
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
            className={`py-2 rounded-xl transition-all tap-effect flex items-center justify-center gap-1.5 ${
              mode === "register"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> {t("registerTab")}
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="w-full space-y-4 animate-fade-in">
            {loginError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("usernameLabel")}
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("passwordLabel")}
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm tap-effect flex items-center justify-center gap-2 mt-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? t("loggingIn") : t("loginButton")}
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                {t("noAccountHint")}
              </span>
            </div>
          </form>
        )}

        {/* ── REGISTER FORM (PIN PROTECTED) ── */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="w-full space-y-3.5 animate-fade-in">
            {regError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {regError}
              </div>
            )}

            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{t("registerBadge")}</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("invitationPinLabel")}
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={regPin}
                onChange={(e) => setRegPin(e.target.value)}
                placeholder={t("invitationPinPlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 tracking-widest font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("displayNameLabel")}
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder={t("displayNamePlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("usernameLabel")} *
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder={t("usernamePlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t("passwordLabel")} *
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm tap-effect flex items-center justify-center gap-2 mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isRegistering ? t("registering") : t("registerButton")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
