"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { extractTextFromPdf } from "@/lib/utils";
import { SECTORS, JobStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3;

// ─── Inline SVG icons (no external dep) ──────────────────────────────────────
type IconProps = { className?: string; style?: React.CSSProperties };

function BriefcaseIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="12.01" strokeWidth={3} />
    </svg>
  );
}

function BuildingIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 21h18M3 7v14M21 7v14M6 21V7a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v14" />
      <path d="M9 11h.01M12 11h.01M15 11h.01M9 15h.01M12 15h.01M15 15h.01" strokeWidth={2.5} strokeLinecap="round" />
    </svg>
  );
}

function CheckCircleIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UploadCloudIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polyline points="16 16 12 12 8 16" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="12" x2="12" y2="21" strokeLinecap="round" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function XIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: Step; total: number }) {
  const titles: Record<Step, string> = {
    1: "Situation",
    2: "Branche",
    3: "Lebenslauf",
  };

  return (
    <div className="flex items-center gap-0 mb-10">
      {Array.from({ length: total }, (_, i) => {
        const step = (i + 1) as Step;
        const isDone = step < current;
        const isActive = step === current;
        const isUpcoming = step > current;

        return (
          <div key={step} className="flex items-center">
            {/* Connector line */}
            {i > 0 && (
              <div
                className="w-12 h-px transition-all duration-500"
                style={{
                  background: isDone || isActive ? "#1a56db" : "#e2e8f0",
                }}
              />
            )}

            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500"
                style={{
                  background: isActive
                    ? "#1a56db"
                    : isDone
                    ? "#1a56db"
                    : "#f1f5f9",
                  color: isActive || isDone ? "#ffffff" : "#94a3b8",
                  boxShadow: isActive
                    ? "0 0 0 4px rgba(26,86,219,0.15)"
                    : "none",
                }}
              >
                {isDone ? (
                  <svg viewBox="0 0 12 12" fill="none" className="w-3.5 h-3.5">
                    <path d="m2 6 2.5 2.5L10 4" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className="text-xs font-medium transition-colors duration-300"
                style={{ color: isActive ? "#1a56db" : isUpcoming ? "#94a3b8" : "#64748b" }}
              >
                {titles[step]}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [sector, setSector] = useState<string | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Drag & drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setIsDragging(false), []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === "application/pdf") setCvFile(file);
  }, []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file?.type === "application/pdf") setCvFile(file);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Final submit
  const handleFinish = async (skip: boolean) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      await supabase.from("profiles").upsert({
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        job_status: jobStatus,
        sector: sector,
      });

      if (!skip && cvFile) {
        const cvText = await extractTextFromPdf(cvFile);
        await supabase.from("cv_data").upsert({
          user_id: user.id,
          file_name: cvFile.name,
          extracted_text: cvText,
        });
      }

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Ein Fehler ist aufgetreten. Bitte versuche es erneut.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Slide direction classes — simple fade approach via key-based remount
  const cardBase =
    "w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #f0f7ff 100%)" }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #1a56db 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #1a56db 0%, transparent 70%)" }}
        />
        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a56db" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Logo */}
      <div className="relative mb-8 flex items-center gap-2.5 select-none">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "#1a56db" }}
        >
          <SparkleIcon className="w-4 h-4 text-white" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Lumino<span style={{ color: "#1a56db" }}>AI</span>
        </span>
      </div>

      {/* Step indicator */}
      <div className="relative">
        <StepIndicator current={step} total={3} />
      </div>

      {/* ── STEP 1 ── */}
      {step === 1 && (
        <div key="step1" className={cardBase}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Wie ist deine aktuelle Situation?
            </h1>
            <p className="text-slate-500 text-sm">
              Das hilft uns, die richtigen Szenarien für dich vorzubereiten.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* Job seeking */}
            <button
              onClick={() => setJobStatus("job_seeking")}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left"
              style={{
                borderColor: jobStatus === "job_seeking" ? "#1a56db" : "#e2e8f0",
                background:
                  jobStatus === "job_seeking"
                    ? "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)"
                    : "#ffffff",
                boxShadow:
                  jobStatus === "job_seeking"
                    ? "0 0 0 1px #1a56db, 0 8px 24px rgba(26,86,219,0.12)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                transform: jobStatus === "job_seeking" ? "translateY(-2px)" : "none",
              }}
            >
              {/* Selected check */}
              {jobStatus === "job_seeking" && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#1a56db" }}
                >
                  <svg viewBox="0 0 10 10" className="w-3 h-3">
                    <path d="m2 5 2 2 4-4" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: jobStatus === "job_seeking" ? "#1a56db" : "#f1f5f9",
                }}
              >
                <BriefcaseIcon
                  className="w-7 h-7 transition-colors duration-300"
                  style={{ color: jobStatus === "job_seeking" ? "#ffffff" : "#64748b" }}
                />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm text-center">
                  Ich suche einen Job
                </div>
                <div className="text-xs text-slate-500 mt-1 text-center leading-relaxed">
                  Vorbereitung auf Vorstellungsgespräche
                </div>
              </div>
            </button>

            {/* Employed */}
            <button
              onClick={() => setJobStatus("employed")}
              className="group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left"
              style={{
                borderColor: jobStatus === "employed" ? "#1a56db" : "#e2e8f0",
                background:
                  jobStatus === "employed"
                    ? "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)"
                    : "#ffffff",
                boxShadow:
                  jobStatus === "employed"
                    ? "0 0 0 1px #1a56db, 0 8px 24px rgba(26,86,219,0.12)"
                    : "0 1px 4px rgba(0,0,0,0.06)",
                transform: jobStatus === "employed" ? "translateY(-2px)" : "none",
              }}
            >
              {jobStatus === "employed" && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "#1a56db" }}
                >
                  <svg viewBox="0 0 10 10" className="w-3 h-3">
                    <path d="m2 5 2 2 4-4" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
              )}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: jobStatus === "employed" ? "#1a56db" : "#f1f5f9",
                }}
              >
                <BuildingIcon
                  className="w-7 h-7 transition-colors duration-300"
                  style={{ color: jobStatus === "employed" ? "#ffffff" : "#64748b" }}
                />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm text-center">
                  Ich bin berufstätig
                </div>
                <div className="text-xs text-slate-500 mt-1 text-center leading-relaxed">
                  Gehalts- & Leistungsgespräche meistern
                </div>
              </div>
            </button>
          </div>

          <button
            disabled={!jobStatus}
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: jobStatus ? "#1a56db" : "#e2e8f0",
              color: jobStatus ? "#ffffff" : "#94a3b8",
              cursor: jobStatus ? "pointer" : "not-allowed",
              boxShadow: jobStatus ? "0 4px 16px rgba(26,86,219,0.3)" : "none",
            }}
          >
            Weiter
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      )}

      {/* ── STEP 2 ── */}
      {step === 2 && (
        <div key="step2" className={cardBase}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              In welcher Branche bist du tätig / interessiert?
            </h1>
            <p className="text-slate-500 text-sm">
              Die KI passt ihre Fragen an deine Branche an.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 mb-8">
            {SECTORS.map((s) => {
              const selected = sector === s;
              return (
                <button
                  key={s}
                  onClick={() => setSector(s)}
                  className="relative px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 text-center leading-tight"
                  style={{
                    background: selected
                      ? "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)"
                      : "#ffffff",
                    color: selected ? "#ffffff" : "#475569",
                    border: selected ? "2px solid #1a56db" : "2px solid #e2e8f0",
                    boxShadow: selected
                      ? "0 4px 12px rgba(26,86,219,0.25)"
                      : "0 1px 3px rgba(0,0,0,0.05)",
                    transform: selected ? "scale(1.02)" : "scale(1)",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 border-2"
              style={{
                borderColor: "#e2e8f0",
                color: "#64748b",
                background: "#ffffff",
              }}
            >
              ← Zurück
            </button>
            <button
              disabled={!sector}
              onClick={() => setStep(3)}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: sector ? "#1a56db" : "#e2e8f0",
                color: sector ? "#ffffff" : "#94a3b8",
                cursor: sector ? "pointer" : "not-allowed",
                boxShadow: sector ? "0 4px 16px rgba(26,86,219,0.3)" : "none",
              }}
            >
              Weiter
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3 ── */}
      {step === 3 && (
        <div key="step3" className={cardBase}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Lade deinen Lebenslauf hoch{" "}
              <span className="text-slate-400 font-normal text-xl">(optional)</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed">
              Mit deinem Lebenslauf stellt die KI personalisierte Fragen zu deiner Erfahrung.
            </p>
          </div>

          {/* Drop zone */}
          {!cvFile ? (
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center gap-4 p-12 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 mb-8 group"
              style={{
                borderColor: isDragging ? "#1a56db" : "#cbd5e1",
                background: isDragging
                  ? "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)"
                  : "#fafbfc",
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={onFileChange}
              />

              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300"
                style={{
                  background: isDragging ? "#1a56db" : "#f1f5f9",
                }}
              >
                <UploadCloudIcon
                  className="w-8 h-8 transition-colors duration-300"
                  style={{ color: isDragging ? "#ffffff" : "#94a3b8" }}
                />
              </div>

              <div className="text-center">
                <p className="font-semibold text-slate-700 text-sm">
                  PDF hierher ziehen oder klicken
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Nur PDF-Dateien · Max. 10 MB
                </p>
              </div>

              {/* Hover shimmer */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: "linear-gradient(135deg, rgba(26,86,219,0.03) 0%, rgba(26,86,219,0.06) 100%)",
                }}
              />
            </div>
          ) : (
            /* File preview */
            <div
              className="flex items-center gap-4 p-5 rounded-2xl border-2 mb-8 relative"
              style={{
                borderColor: "#1a56db",
                background: "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 100%)",
                boxShadow: "0 4px 16px rgba(26,86,219,0.1)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "#1a56db" }}
              >
                <FileIcon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm truncate">{cvFile.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{formatFileSize(cvFile.size)}</p>
              </div>

              <CheckCircleIcon className="w-6 h-6 flex-shrink-0" style={{ color: "#16a34a" }} />

              <button
                onClick={() => setCvFile(null)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 hover:bg-white/60"
                style={{ color: "#94a3b8" }}
              >
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-center"
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 border-2"
              style={{
                borderColor: "#e2e8f0",
                color: "#64748b",
                background: "#ffffff",
              }}
            >
              ← Zurück
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleFinish(true)}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 border-2"
              style={{
                borderColor: "#e2e8f0",
                color: "#64748b",
                background: "#ffffff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              Überspringen
            </button>

            <button
              disabled={isSubmitting}
              onClick={() => handleFinish(false)}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              style={{
                background: "#1a56db",
                color: "#ffffff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
                boxShadow: "0 4px 16px rgba(26,86,219,0.3)",
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeOpacity={0.3} />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Wird gespeichert…
                </>
              ) : (
                <>
                  Fertigstellen
                  <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Privacy hint */}
          <p className="text-center text-xs text-slate-400 mt-5 flex items-center justify-center gap-1.5">
            <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
              <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth={1.4} />
              <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
            </svg>
            DSGVO-konform · Deine Daten werden sicher verarbeitet
          </p>
        </div>
      )}
    </div>
  );
}
