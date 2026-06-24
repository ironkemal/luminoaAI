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
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

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
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-[1.85rem] font-extrabold text-slate-900 tracking-tight mb-2">
          Willkommen zurück
        </h1>
        <p className="text-[15px] text-slate-500">
          Melde dich an, um dein Coaching fortzusetzen.
        </p>
      </div>

      {error && (
        <div
          className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3.5 text-sm"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">E-Mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@beispiel.de"
            required
            autoComplete="email"
            style={{
              width: "100%",
              padding: "11px 14px",
              borderRadius: "10px",
              border: "1.5px solid #E2E8F0",
              background: "#F8FAFC",
              fontSize: "14px",
              color: "#0F172A",
              outline: "none",
              transition: "border-color 0.15s, box-shadow 0.15s",
              fontFamily: "var(--font-jakarta)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "#1a56db";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.12)";
              e.currentTarget.style.background = "#fff";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "#E2E8F0";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.background = "#F8FAFC";
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Passwort</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                padding: "11px 44px 11px 14px",
                borderRadius: "10px",
                border: "1.5px solid #E2E8F0",
                background: "#F8FAFC",
                fontSize: "14px",
                color: "#0F172A",
                outline: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
                fontFamily: "var(--font-jakarta)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#1a56db";
                e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.12)";
                e.currentTarget.style.background = "#fff";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#E2E8F0";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.background = "#F8FAFC";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "10px",
              border: "none",
              background: loading ? "#93c5fd" : "linear-gradient(135deg, #1a56db 0%, #1340b8 100%)",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 20px rgba(26,86,219,0.35)",
              transition: "opacity 0.15s, transform 0.1s, box-shadow 0.15s",
              fontFamily: "var(--font-jakarta)",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.opacity = "0.93"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = "scale(0.99)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Anmelden…
              </span>
            ) : "Anmelden"}
          </button>
        </div>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center">
        <p className="text-sm text-slate-500">
          Noch kein Konto?{" "}
          <Link href="/register" className="font-semibold" style={{ color: "#1a56db" }}>
            Jetzt registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
