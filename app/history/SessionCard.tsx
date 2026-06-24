"use client";

import Link from "next/link";
import { formatDate, scoreToColor } from "@/lib/utils";
import { SCENARIO_LABELS } from "@/types";
import type { Session, SessionAnalysis, Difficulty, ScenarioType } from "@/types";

export type SessionWithAnalysis = Session & {
  session_analysis: SessionAnalysis[] | null;
};

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BriefcaseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v2m0 8v2m-4-6h1a2 2 0 0 0 0-4h-1m1 4h3a2 2 0 0 1 0 4h-3" strokeLinecap="round" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
      <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
      <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
    </svg>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const getColors = (s: number) => {
    if (s >= 85) return { bg: "#f0fdf4", border: "#86efac", text: "#15803d" };
    if (s >= 70) return { bg: "#eff6ff", border: "#bfdbfe", text: "#1648c0" };
    if (s >= 55) return { bg: "#fffbeb", border: "#fde68a", text: "#b45309" };
    if (s >= 40) return { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" };
    return { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" };
  };
  const { bg, border, text } = getColors(score);
  return (
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black border"
      style={{ background: bg, borderColor: border, color: text }}
    >
      {score}
    </div>
  );
}

function ScenarioIcon({ type, className }: { type: ScenarioType; className?: string }) {
  switch (type) {
    case "job_interview": return <BriefcaseIcon className={className} />;
    case "salary_negotiation": return <MoneyIcon className={className} />;
    case "performance_review": return <ChartIcon className={className} />;
  }
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const styles: Record<Difficulty, { bg: string; text: string; label: string }> = {
    easy: { bg: "#f0fdf4", text: "#16a34a", label: "Einfach" },
    medium: { bg: "#fffbeb", text: "#d97706", label: "Mittel" },
    hard: { bg: "#fef2f2", text: "#dc2626", label: "Schwer" },
  };
  const { bg, text, label } = styles[difficulty];
  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: bg, color: text }}>
      {label}
    </span>
  );
}

function scenarioBg(type: ScenarioType) {
  switch (type) {
    case "job_interview": return { bg: "#eff6ff", icon: "#1a56db" };
    case "salary_negotiation": return { bg: "#f0fdf4", icon: "#16a34a" };
    case "performance_review": return { bg: "#fff7ed", icon: "#ea580c" };
  }
}

export function SessionCard({ session }: { session: SessionWithAnalysis }) {
  const analysis = session.session_analysis?.[0] ?? null;
  const { bg, icon } = scenarioBg(session.scenario_type);

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:border-blue-200 transition-all duration-200"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <div className="w-6 h-6" style={{ color: icon }}>
          <ScenarioIcon type={session.scenario_type} className="w-full h-full" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-slate-800 truncate">
            {SCENARIO_LABELS[session.scenario_type]}
          </span>
          {session.company_name && (
            <span className="text-xs text-slate-400 truncate">· {session.company_name}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-slate-400">
            {session.completed_at ? formatDate(session.completed_at) : "—"}
          </span>
          <span className="text-slate-200">·</span>
          <DifficultyBadge difficulty={session.difficulty} />
        </div>
      </div>

      {analysis && <ScoreBadge score={analysis.overall_score} />}

      <Link
        href={`/interview/${session.id}/analysis`}
        className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200"
        style={{ background: "#EEF3FF", color: "#1a56db" }}
      >
        Analysieren
        <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
