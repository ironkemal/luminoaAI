"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes("Invalid login credentials")) {
          setError("E-Mail oder Passwort ist falsch.");
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Bitte bestätige zuerst deine E-Mail-Adresse.");
        } else {
          setError("Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
        }
        return;
      }

      router.push("/dashboard");
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
        .fade-up-2 { animation-delay: 0.12s; opacity: 0; }
        .fade-up-3 { animation-delay: 0.19s; opacity: 0; }
        .fade-up-4 { animation-delay: 0.26s; opacity: 0; }
        .fade-up-5 { animation-delay: 0.33s; opacity: 0; }
        .fade-up-6 { animation-delay: 0.40s; opacity: 0; }
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
            Willkommen zurück
          </h1>
          <p className="text-sm text-white/40 leading-relaxed">
            Melde dich an, um dein Coaching fortzusetzen.
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
          {/* Email */}
          <div className="fade-up fade-up-3">
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
          <div className="fade-up fade-up-4">
            <label className="block text-xs font-medium text-white/50 mb-2 tracking-wide uppercase">
              Passwort
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
          </div>

          {/* Submit */}
          <div className="fade-up fade-up-5 pt-2">
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
                  Wird angemeldet…
                </span>
              ) : (
                "Anmelden"
              )}
            </button>
          </div>
        </form>

        {/* Divider + Link */}
        <div className="fade-up fade-up-6 mt-7 text-center">
          <p className="text-sm text-white/30">
            Noch kein Konto?{" "}
            <Link
              href="/register"
              className="font-medium text-brand-400 hover:text-white transition-colors"
            >
              Jetzt registrieren
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
