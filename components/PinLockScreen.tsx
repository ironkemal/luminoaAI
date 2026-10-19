"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerWithInvitationPin, isAppUnlocked, setCurrentUser } from "@/lib/auth-pin";
import { useLanguage, Language } from "@/lib/i18n";
import { AppUser } from "@/types";
import WelcomeOnboardingModal from "@/components/onboarding/WelcomeOnboardingModal";
import { Dumbbell, UserPlus, LogIn, CheckCircle2, KeyRound } from "lucide-react";

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
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#F6F7F5]">
        <span className="spinner !w-8 !h-8" aria-label="Yükleniyor" />
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

  const languages: { code: Language; label: string; name: string }[] = [
    { code: "tr", label: "TR", name: "Türkçe" },
    { code: "en", label: "EN", name: "English" },
    { code: "de", label: "DE", name: "Deutsch" },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F6F7F5] flex flex-col px-4 pt-safe pb-safe select-none">
      {/* Top bar: language switcher (plain text — flag emoji don't render on Windows) */}
      <div className="flex items-center justify-end h-14 shrink-0">
        <div role="group" aria-label="Dil / Language" className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-200/60">
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              title={l.name}
              aria-label={l.name}
              aria-pressed={language === l.code}
              className={`min-w-[44px] h-9 px-2.5 rounded-md text-xs font-bold tracking-wide tap-effect ${
                language === l.code ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 md:hover:text-slate-800"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center pb-8">
        <div className="w-full max-w-sm animate-slide-up">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-sm shadow-emerald-700/20 mb-4">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{t("loginTitle")}</h1>
            <p className="text-sm text-slate-500 mt-1">{t("loginSubtitle")}</p>
          </div>

          <div className="card !p-5">
            {/* Tab Switcher */}
            <div className="segmented mb-5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                data-active={mode === "login"}
                onClick={() => {
                  setMode("login");
                  setLoginError("");
                }}
                className="segmented-item min-h-[40px] text-[13px]"
              >
                <LogIn className="w-4 h-4" /> {t("loginTab")}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                data-active={mode === "register"}
                onClick={() => {
                  setMode("register");
                  setRegError("");
                }}
                className="segmented-item min-h-[40px] text-[13px]"
              >
                <UserPlus className="w-4 h-4" /> {t("registerTab")}
              </button>
            </div>

            {/* ── LOGIN FORM ── */}
            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
                {loginError && (
                  <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
                    {loginError}
                  </div>
                )}

                <div>
                  <label htmlFor="login-username" className="field-label">
                    {t("usernameLabel")}
                  </label>
                  <input
                    id="login-username"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    placeholder={t("usernamePlaceholder")}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="login-password" className="field-label">
                    {t("passwordLabel")}
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="input"
                  />
                </div>

                <button type="submit" disabled={isLoggingIn} className="btn-primary btn-lg btn-block !mt-5">
                  {isLoggingIn ? (
                    <span className="spinner !w-4 !h-4 !border-2 border-white border-t-transparent" />
                  ) : (
                    <LogIn />
                  )}
                  {isLoggingIn ? t("loggingIn") : t("loginButton")}
                </button>

                <p className="text-xs text-slate-400 text-center leading-relaxed">{t("noAccountHint")}</p>
              </form>
            )}

            {/* ── REGISTER FORM (PIN PROTECTED) ── */}
            {mode === "register" && (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
                {regError && (
                  <div role="alert" className="p-3 rounded-xl bg-red-50 text-red-700 text-sm font-medium">
                    {regError}
                  </div>
                )}

                <div className="p-3 rounded-xl bg-emerald-50 text-[13px] leading-relaxed text-emerald-800 flex items-start gap-2.5">
                  <KeyRound className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="min-w-0">{t("registerBadge")}</span>
                </div>

                <div>
                  <label htmlFor="reg-pin" className="field-label">
                    {t("invitationPinLabel")}
                  </label>
                  <input
                    id="reg-pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    required
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder={t("invitationPinPlaceholder")}
                    className={`input ${regPin ? "tracking-widest font-mono" : ""}`}
                  />
                </div>

                <div>
                  <label htmlFor="reg-display" className="field-label">
                    {t("displayNameLabel")}
                  </label>
                  <input
                    id="reg-display"
                    type="text"
                    autoComplete="name"
                    value={regDisplayName}
                    onChange={(e) => setRegDisplayName(e.target.value)}
                    placeholder={t("displayNamePlaceholder")}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="reg-username" className="field-label">
                    {t("usernameLabel")} *
                  </label>
                  <input
                    id="reg-username"
                    type="text"
                    required
                    autoComplete="username"
                    autoCapitalize="none"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder={t("usernamePlaceholder")}
                    className="input"
                  />
                </div>

                <div>
                  <label htmlFor="reg-password" className="field-label">
                    {t("passwordLabel")} *
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t("passwordPlaceholder")}
                    className="input"
                  />
                </div>

                <button type="submit" disabled={isRegistering} className="btn-primary btn-lg btn-block !mt-5">
                  {isRegistering ? (
                    <span className="spinner !w-4 !h-4 !border-2 border-white border-t-transparent" />
                  ) : (
                    <CheckCircle2 />
                  )}
                  {isRegistering ? t("registering") : t("registerButton")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
