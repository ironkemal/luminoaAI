"use client";

import { useState, useEffect } from "react";
import { getCurrentUser, loginUser, registerWithInvitationPin, isAppUnlocked, INVITATION_PIN } from "@/lib/auth-pin";
import { Dumbbell, KeyRound, Lock, User, UserPlus, LogIn, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

interface PinLockScreenProps {
  children: React.ReactNode;
}

export default function PinLockScreen({ children }: PinLockScreenProps) {
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
        setLoginError(res.error || "Giriş başarısız.");
      }
    } catch (err: any) {
      setLoginError(err.message || "Giriş yapılamadı.");
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
        setRegError(res.error || "Kayıt başarısız.");
      }
    } catch (err: any) {
      setRegError(err.message || "Kayıt yapılamadı.");
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
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 md:p-8 shadow-card border border-slate-100 flex flex-col items-center animate-slide-up">
        {/* Logo */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-sm shadow-emerald-500/20 mb-3">
          <Dumbbell className="w-7 h-7" />
        </div>

        <h1 className="text-xl font-black text-slate-900 tracking-tight">Lumino Smart PT</h1>
        <p className="text-xs text-slate-500 mt-0.5 mb-5 text-center">
          Kişisel ve Çok Kullanıcılı Fitness Platformu
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
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> Giriş Yap
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
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-emerald-600" /> Hesap Aç (4004)
          </button>
        </div>

        {/* ── LOGIN FORM ── */}
        {mode === "login" && (
          <form onSubmit={handleLogin} className="w-full space-y-3.5 animate-fade-in">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold animate-shake">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kullanıcı Adı (ID)
              </label>
              <input
                type="text"
                required
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="kemal"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Şifre
              </label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center justify-center gap-2 transition-all mt-2"
            >
              <LogIn className="w-4 h-4" />
              {isLoggingIn ? "Giriş Yapılıyor..." : "Giriş Yap"}
            </button>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-slate-400">
                Hesabınız yoksa üstteki <b>&ldquo;Hesap Aç (4004)&rdquo;</b> sekmesine tıklayın.
              </span>
            </div>
          </form>
        )}

        {/* ── REGISTER FORM (INVITATION PIN: 4004) ── */}
        {mode === "register" && (
          <form onSubmit={handleRegister} className="w-full space-y-3 animate-fade-in">
            {regError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-semibold animate-shake">
                {regError}
              </div>
            )}

            <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>
                Yeni hesap açmak için davetiye PIN kodunu (<b>4004</b>) girin.
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Davetiye PIN Kodu *
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={regPin}
                onChange={(e) => setRegPin(e.target.value)}
                placeholder="4004"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                İsim / Görünen Ad
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="Örn: Ahmet"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Kullanıcı Adı (ID) *
              </label>
              <input
                type="text"
                required
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                placeholder="ahmet123"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Şifre *
              </label>
              <input
                type="password"
                required
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="En az 4 karakter"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center justify-center gap-2 transition-all mt-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isRegistering ? "Hesap Oluşturuluyor..." : "Hesap Oluştur ve Başla"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
