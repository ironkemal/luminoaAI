"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Schwach", "Mittel", "Gut", "Stark"][passwordStrength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#22c55e"][passwordStrength];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (authError) {
        if (authError.message.includes("already registered") || authError.message.includes("User already registered")) {
          setError("Diese E-Mail-Adresse ist bereits registriert.");
        } else if (authError.message.includes("Password should be")) {
          setError("Das Passwort erfüllt nicht die Mindestanforderungen.");
        } else {
          setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
        }
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Top accent line */}
      <div
        className="h-[3px] w-full"
        style={{
          background: "linear-gradient(90deg, #1a56db, #818cf8, #1a56db)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s linear infinite",
        }}
      />

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation-delay: 0.05s; opacity: 0; }
        .fade-up-2 { animation-delay: 0.10s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.15s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.20s; opacity: 0; }
        .fade-up-5 { animation-delay: 0.25s; opacity: 0; }
        .fade-up-6 { animation-delay: 0.30s; opacity: 0; }
        .fade-up-7 { animation-delay: 0.35s; opacity: 0; }
        .fade-up-8 { animation-delay: 0.40s; opacity: 0; }
        .input-field {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: #f1f5f9;
          transition: border-color 0.2s, background 0.2s, box-shadow 0.2s;
        }
        .input-field::placeholder { color: rgba(255,255,255,0.25); }
        .input-field:focus {
          outline: none;
          border-color: #1a56db;
          background: rgba(26,86,219,0.08);
          box-shadow: 0 0 0 3px rgba(26,86,219,0.15);
        }
        .btn-primary {
          background: linear-gradient(135deg, #1a56db 0%, #1648c0 100%);
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 24px rgba(26,86,219,0.35);
        }
        .btn-primary:hover:not(:disabled) {
          opacity: 0.92;
          transform: translateY(-1px);
          box-shadow: 0 6px 32px rgba(26,86,219,0.5);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>

      <div className="px-8 pt-10 pb-10">
        {/* Logo */}
        <div className="fade-up fade-up-1 flex justify-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold tracking-tight shadow-lg"
            style={{
              background: "linear-gradient(135deg, #1a56db 0%, #103d96 100%)",
              boxShadow: "0 8px 32px rgba(26,86,219,0.4)",
            }}
          >
            L
          </div>
        </div>

        {/* Heading */}
        <div className="fade-up fade-up-2 text-center mb-8">
          <h1 className="text-2xl font-semibold text-white tracking-tight mb-2">
            Konto erstellen
          </h1>
          <p className="text-sm text-white/40 leading-relaxed">
            Starte dein KI-Karriere-Coaching.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="fade-up fade-up-1 mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="fade-up fade-up-3">
            <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
              Vollständiger Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Max Mustermann"
              required
              autoComplete="name"
              className="input-field w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          {/* Email */}
          <div className="fade-up fade-up-4">
            <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
              E-Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@beispiel.de"
              required
              autoComplete="email"
              className="input-field w-full rounded-xl px-4 py-3 text-sm"
            />
          </div>

          {/* Password */}
          <div className="fade-up fade-up-5">
            <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mindestens 8 Zeichen"
                required
                autoComplete="new-password"
                className="input-field w-full rounded-xl px-4 py-3 pr-11 text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showPassword ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Password strength */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background: i <= passwordStrength ? strengthColor : "rgba(255,255,255,0.1)",
                      }}
                    />
                  ))}
                </div>
                <p className="text-xs" style={{ color: strengthColor }}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="fade-up fade-up-6">
            <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
              Passwort bestätigen
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className="input-field w-full rounded-xl px-4 py-3 pr-11 text-sm"
                style={{
                  borderColor:
                    confirmPassword.length > 0
                      ? confirmPassword === password
                        ? "rgba(34,197,94,0.5)"
                        : "rgba(239,68,68,0.4)"
                      : undefined,
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                aria-label={showConfirm ? "Passwort verbergen" : "Passwort anzeigen"}
              >
                {showConfirm ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              {confirmPassword.length > 0 && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  {confirmPassword === password ? (
                    <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="fade-up fade-up-7 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full rounded-xl py-3 text-sm font-semibold text-white tracking-wide"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Wird registriert…
                </span>
              ) : (
                "Registrieren"
              )}
            </button>
          </div>
        </form>

        {/* Divider + Link */}
        <div className="fade-up fade-up-8 mt-7 text-center">
          <p className="text-sm text-white/30">
            Bereits registriert?{" "}
            <Link
              href="/login"
              className="font-medium text-brand-400 hover:text-white transition-colors"
            >
              Jetzt anmelden
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
