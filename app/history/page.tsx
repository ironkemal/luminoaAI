import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, scoreToColor } from "@/lib/utils";
import { SCENARIO_LABELS } from "@/types";
import type { Session, SessionAnalysis, Difficulty, ScenarioType } from "@/types";
import HistoryClient from "./HistoryClient";

// ─── Extended session type with joined analysis ───────────────────────────────
export type SessionWithAnalysis = Session & {
  session_analysis: SessionAnalysis[] | null;
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

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

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ─── Score mini badge ─────────────────────────────────────────────────────────
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

// ─── Scenario icon ────────────────────────────────────────────────────────────
function ScenarioIcon({ type, className }: { type: ScenarioType; className?: string }) {
  switch (type) {
    case "job_interview": return <BriefcaseIcon className={className} />;
    case "salary_negotiation": return <MoneyIcon className={className} />;
    case "performance_review": return <ChartIcon className={className} />;
  }
}

// ─── Difficulty badge ─────────────────────────────────────────────────────────
function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const styles: Record<Difficulty, { bg: string; text: string; label: string }> = {
    easy: { bg: "#f0fdf4", text: "#16a34a", label: "Einfach" },
    medium: { bg: "#fffbeb", text: "#d97706", label: "Mittel" },
    hard: { bg: "#fef2f2", text: "#dc2626", label: "Schwer" },
  };
  const { bg, text, label } = styles[difficulty];
  return (
    <span
      className="text-xs font-semibold px-2 py-0.5 rounded-full"
      style={{ background: bg, color: text }}
    >
      {label}
    </span>
  );
}

// ─── Scenario icon color bg ───────────────────────────────────────────────────
function scenarioBg(type: ScenarioType) {
  switch (type) {
    case "job_interview": return { bg: "#eff6ff", icon: "#1a56db" };
    case "salary_negotiation": return { bg: "#f0fdf4", icon: "#16a34a" };
    case "performance_review": return { bg: "#fff7ed", icon: "#ea580c" };
  }
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "linear-gradient(135deg, #f0f4ff 0%, #e0eaff 100%)" }}
      >
        <MessageCircleIcon className="w-10 h-10 text-brand-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-700 mb-2">Noch keine abgeschlossenen Gespräche</h3>
      <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">
        Starte jetzt dein erstes Gespräch und erhalte eine detaillierte KI-Analyse.
      </p>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
        style={{
          background: "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)",
          boxShadow: "0 4px 12px rgba(26,86,219,0.3)",
        }}
      >
        Erstes Gespräch starten
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}

// ─── Session card ─────────────────────────────────────────────────────────────
export function SessionCard({ session }: { session: SessionWithAnalysis }) {
  const analysis = session.session_analysis?.[0] ?? null;
  const { bg, icon } = scenarioBg(session.scenario_type);

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4 hover:border-brand-200 transition-all duration-200"
      style={{ boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
    >
      {/* Scenario icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: bg }}
      >
        <ScenarioIcon type={session.scenario_type} className="w-6 h-6" style={{ color: icon } as React.CSSProperties} />
      </div>

      {/* Info */}
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

      {/* Score */}
      {analysis && <ScoreBadge score={analysis.overall_score} />}

      {/* CTA */}
      <Link
        href={`/interview/${session.id}/analysis`}
        className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-xl transition-all duration-200 group-hover:shadow-sm"
        style={{ background: "#f0f4ff", color: "#1a56db" }}
      >
        Analysieren
        <ArrowRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function HistoryPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sessions } = await supabase
    .from("sessions")
    .select("*, session_analysis(*)")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false }) as { data: SessionWithAnalysis[] | null };

  const allSessions: SessionWithAnalysis[] = sessions ?? [];

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(150deg, #f8faff 0%, #eef2ff 55%, #f0f7ff 100%)" }}
    >
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #1a56db 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-[0.04]"
          style={{ background: "radial-gradient(circle, #1a56db 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-10">
        {/* Nav */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <SparkleIcon className="w-4 h-4 text-brand-500" />
            <span className="font-semibold text-brand-600">LuminoAI</span>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Deine Gespräche</h1>
          <p className="text-slate-500 text-sm mt-1.5">
            {allSessions.length > 0
              ? `${allSessions.length} abgeschlossene${allSessions.length === 1 ? "s" : ""} Gespräch${allSessions.length === 1 ? "" : "e"}`
              : "Noch keine Gespräche"}
          </p>
        </div>

        {allSessions.length === 0 ? (
          <EmptyState />
        ) : (
          <HistoryClient sessions={allSessions} />
        )}
      </div>
    </div>
  );
}
