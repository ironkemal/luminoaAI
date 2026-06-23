"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ScenarioType, Difficulty } from "@/types";
import { SCENARIO_LABELS, DIFFICULTY_LABELS } from "@/types";

// ─── Icon helpers ─────────────────────────────────────────────────────────────

type IconProps = { className?: string; style?: React.CSSProperties };

function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 8H3M7 4 3 8l4 4" />
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

function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 10 10" fill="none">
      <path d="m1.5 5 2.5 2.5 4.5-4.5" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Scenario definitions ─────────────────────────────────────────────────────

const SCENARIOS: {
  type: ScenarioType;
  emoji: string;
  subtitle: string;
  accent: string;
  accentLight: string;
}[] = [
  {
    type: "job_interview",
    emoji: "🎯",
    subtitle: "Überzeuge beim Erstkontakt",
    accent: "#1a56db",
    accentLight: "#eff6ff",
  },
  {
    type: "salary_negotiation",
    emoji: "💰",
    subtitle: "Verhandle deinen Marktwert",
    accent: "#16a34a",
    accentLight: "#f0fdf4",
  },
  {
    type: "performance_review",
    emoji: "📊",
    subtitle: "Führe produktive Feedback-Gespräche",
    accent: "#7c3aed",
    accentLight: "#faf5ff",
  },
];

const DIFFICULTIES: {
  value: Difficulty;
  color: string;
  bg: string;
  border: string;
  hint: string;
}[] = [
  {
    value: "easy",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
    hint: "Freundliche Atmosphäre",
  },
  {
    value: "medium",
    color: "#d97706",
    bg: "#fffbeb",
    border: "#fde68a",
    hint: "Realistische Herausforderung",
  },
  {
    value: "hard",
    color: "#dc2626",
    bg: "#fef2f2",
    border: "#fecaca",
    hint: "Maximaler Stresslevel",
  },
];

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEP_TITLES = ["Szenario", "Details", "Start"];

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEP_TITLES.map((title, i) => {
        const step = (i + 1) as 1 | 2 | 3;
        const isDone = step < current;
        const isActive = step === current;
        const isUpcoming = step > current;

        return (
          <div key={step} className="flex items-center">
            {i > 0 && (
              <div
                className="w-12 h-px transition-all duration-500"
                style={{ background: isDone || isActive ? "#1a56db" : "#e2e8f0" }}
              />
            )}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-500"
                style={{
                  background: isActive || isDone ? "#1a56db" : "#f1f5f9",
                  color: isActive || isDone ? "#ffffff" : "#94a3b8",
                  boxShadow: isActive ? "0 0 0 4px rgba(26,86,219,0.15)" : "none",
                }}
              >
                {isDone ? <CheckIcon /> : step}
              </div>
              <span
                className="text-xs font-medium transition-colors duration-300"
                style={{
                  color: isActive ? "#1a56db" : isUpcoming ? "#94a3b8" : "#64748b",
                }}
              >
                {title}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function NewInterviewPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [scenario, setScenario] = useState<ScenarioType | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedScenarioDef = SCENARIOS.find((s) => s.type === scenario);

  const handleSubmit = async () => {
    if (!scenario) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/sessions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioType: scenario,
          companyName: companyName.trim() || null,
          jobTitle: scenario === "job_interview" ? jobTitle.trim() || null : null,
          sector: null,
          difficulty,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Unbekannter Fehler");
      }

      const { sessionId } = await res.json();
      router.push(`/interview/${sessionId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Ein Fehler ist aufgetreten.";
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const cardBase =
    "w-full max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-400";

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #f0f7ff 100%)",
      }}
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
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a56db" }}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          Lumino<span style={{ color: "#1a56db" }}>AI</span>
        </span>
      </div>

      {/* Step indicator */}
      <div className="relative">
        <StepIndicator current={step} />
      </div>

      {/* ── STEP 1: Scenario selection ── */}
      {step === 1 && (
        <div key="step1" className={cardBase}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Was möchtest du heute üben?
            </h1>
            <p className="text-slate-500 text-sm">
              Wähle ein Szenario für dein nächstes Training.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            {SCENARIOS.map((s) => {
              const isSelected = scenario === s.type;
              return (
                <button
                  key={s.type}
                  onClick={() => setScenario(s.type)}
                  className="relative w-full flex items-center gap-5 p-5 rounded-2xl border-2 text-left transition-all duration-300"
                  style={{
                    borderColor: isSelected ? s.accent : "#e2e8f0",
                    background: isSelected
                      ? `linear-gradient(135deg, ${s.accentLight} 0%, white 100%)`
                      : "#ffffff",
                    boxShadow: isSelected
                      ? `0 0 0 1px ${s.accent}, 0 8px 24px ${s.accent}1a`
                      : "0 1px 4px rgba(0,0,0,0.06)",
                    transform: isSelected ? "translateY(-1px)" : "none",
                  }}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: s.accent }}
                    >
                      <CheckIcon />
                    </div>
                  )}

                  {/* Emoji */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-all duration-300"
                    style={{ background: isSelected ? s.accent + "18" : "#f8fafc" }}
                  >
                    {s.emoji}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">
                        {SCENARIO_LABELS[s.type]}
                      </span>
                      {/* Advanced badge for salary_negotiation */}
                      {s.type === "salary_negotiation" && (
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: "#fffbeb",
                            color: "#d97706",
                            border: "1px solid #fde68a",
                          }}
                        >
                          Fortgeschritten
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{s.subtitle}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            disabled={!scenario}
            onClick={() => setStep(2)}
            className="w-full py-3.5 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: scenario ? "#1a56db" : "#e2e8f0",
              color: scenario ? "#ffffff" : "#94a3b8",
              cursor: scenario ? "pointer" : "not-allowed",
              boxShadow: scenario ? "0 4px 16px rgba(26,86,219,0.3)" : "none",
            }}
          >
            Weiter
            <ArrowRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── STEP 2: Details ── */}
      {step === 2 && (
        <div key="step2" className={cardBase}>
          <div className="text-center mb-8">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3"
              style={{ background: selectedScenarioDef?.accentLight ?? "#f8fafc" }}
            >
              {selectedScenarioDef?.emoji}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Erzähl uns mehr</h1>
            <p className="text-slate-500 text-sm">
              Je mehr Details, desto realistischer das Training.
            </p>
          </div>

          <div className="space-y-5 mb-8">
            {/* Company name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Unternehmen
                <span className="normal-case font-normal text-slate-400 ml-1">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <BuildingIcon className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="z.B. Google, BMW, Siemens…"
                  maxLength={80}
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200"
                  style={{
                    border: "2px solid #e2e8f0",
                    background: "#ffffff",
                  }}
                  onFocus={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "#1a56db";
                    (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(26,86,219,0.1)";
                  }}
                  onBlur={(e) => {
                    (e.currentTarget as HTMLInputElement).style.borderColor = "#e2e8f0";
                    (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
                  }}
                />
              </div>
            </div>

            {/* Job title — only for job_interview */}
            {scenario === "job_interview" && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                  Stelle / Position
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg viewBox="0 0 24 24" className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
                      <rect x="2" y="7" width="20" height="14" rx="2" />
                      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="z.B. Product Manager, Software Engineer…"
                    maxLength={80}
                    className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-slate-900 placeholder-slate-400 outline-none transition-all duration-200"
                    style={{
                      border: "2px solid #e2e8f0",
                      background: "#ffffff",
                    }}
                    onFocus={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor = "#1a56db";
                      (e.currentTarget as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(26,86,219,0.1)";
                    }}
                    onBlur={(e) => {
                      (e.currentTarget as HTMLInputElement).style.borderColor = "#e2e8f0";
                      (e.currentTarget as HTMLInputElement).style.boxShadow = "none";
                    }}
                  />
                </div>
              </div>
            )}

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">
                Schwierigkeitsgrad
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {DIFFICULTIES.map((d) => {
                  const isSelected = difficulty === d.value;
                  return (
                    <button
                      key={d.value}
                      onClick={() => setDifficulty(d.value)}
                      className="relative flex flex-col items-center gap-1.5 py-4 rounded-xl text-center transition-all duration-200"
                      style={{
                        background: isSelected ? d.bg : "#ffffff",
                        border: isSelected ? `2px solid ${d.color}` : "2px solid #e2e8f0",
                        color: isSelected ? d.color : "#64748b",
                        boxShadow: isSelected ? `0 3px 12px ${d.color}22` : "none",
                        transform: isSelected ? "translateY(-1px)" : "none",
                      }}
                    >
                      {isSelected && (
                        <div
                          className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                          style={{ background: d.color }}
                        >
                          <CheckIcon />
                        </div>
                      )}
                      <span className="font-semibold text-sm">{DIFFICULTY_LABELS[d.value]}</span>
                      <span className="text-xs opacity-70">{d.hint}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 border-2"
              style={{ borderColor: "#e2e8f0", color: "#64748b", background: "#ffffff" }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Zurück
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: "#1a56db",
                color: "#ffffff",
                boxShadow: "0 4px 16px rgba(26,86,219,0.3)",
              }}
            >
              Weiter
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Confirmation ── */}
      {step === 3 && scenario && (
        <div key="step3" className={cardBase}>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Bereit zum Start?</h1>
            <p className="text-slate-500 text-sm">Prüfe deine Einstellungen nochmal durch.</p>
          </div>

          {/* Summary card */}
          <div
            className="rounded-2xl p-6 mb-6"
            style={{
              background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)",
              border: "1.5px solid #c7d7fe",
            }}
          >
            <div className="space-y-4">
              {[
                {
                  label: "Szenario",
                  value: SCENARIO_LABELS[scenario],
                  icon: selectedScenarioDef?.emoji,
                },
                ...(companyName
                  ? [{ label: "Unternehmen", value: companyName, icon: "🏢" }]
                  : []),
                ...(scenario === "job_interview" && jobTitle
                  ? [{ label: "Position", value: jobTitle, icon: "💼" }]
                  : []),
                {
                  label: "Schwierigkeitsgrad",
                  value: DIFFICULTY_LABELS[difficulty],
                  icon: difficulty === "easy" ? "🟢" : difficulty === "medium" ? "🟡" : "🔴",
                },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <span>{row.icon}</span>
                    {row.label}
                  </span>
                  <span className="text-sm font-semibold text-slate-800">{row.value}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-blue-100 mt-4 pt-4">
              <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1.5">
                <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                  <rect x="3" y="7" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth={1.4} />
                  <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" />
                </svg>
                DSGVO-konform · Ende-zu-Ende verschlüsselt
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4 text-center"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 border-2"
              style={{
                borderColor: "#e2e8f0",
                color: isSubmitting ? "#94a3b8" : "#64748b",
                background: "#ffffff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Zurück
            </button>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200"
              style={{
                background: isSubmitting ? "#93c5fd" : "#1a56db",
                color: "#ffffff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                boxShadow: isSubmitting ? "none" : "0 4px 16px rgba(26,86,219,0.3)",
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeOpacity={0.3} />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                  </svg>
                  Wird vorbereitet…
                </>
              ) : (
                <>
                  Gespräch starten
                  <ArrowRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
