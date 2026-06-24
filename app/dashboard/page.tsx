import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Session, Todo, Profile, SessionAnalysis } from "@/types";
import { SCENARIO_LABELS, DIFFICULTY_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";
import TodoItem from "./TodoItem";

// ─── Icon helpers ─────────────────────────────────────────────────────────────

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8h10M9 4l4 4-4 4" />
    </svg>
  );
}

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

type IconProps = { className?: string; style?: CSSProperties };

function CheckSquareIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polyline points="9 11 12 14 22 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BarChartIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ClockIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function MessageCircleIcon({ className, style }: IconProps) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;

  const ringColor =
    score >= 85 ? "#16a34a" :
    score >= 70 ? "#1a56db" :
    score >= 55 ? "#d97706" :
    score >= 40 ? "#ea580c" : "#dc2626";

  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg viewBox="0 0 44 44" className="w-12 h-12 -rotate-90">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#f1f5f9" strokeWidth={4} />
        <circle
          cx="22" cy="22" r={r}
          fill="none"
          stroke={ringColor}
          strokeWidth={4}
          strokeDasharray={`${fill} ${circ - fill}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-xs font-bold"
        style={{ color: ringColor }}
      >
        {score}
      </span>
    </div>
  );
}

// ─── Scenario badge color ────────────────────────────────────────────────────

function scenarioBadgeStyle(scenario: string) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    job_interview: { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
    salary_negotiation: { bg: "#f0fdf4", color: "#15803d", border: "#bbf7d0" },
    performance_review: { bg: "#faf5ff", color: "#7c3aed", border: "#ddd6fe" },
  };
  return map[scenario] ?? { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" };
}

function difficultyBadgeStyle(diff: string) {
  const map: Record<string, { bg: string; color: string }> = {
    easy: { bg: "#f0fdf4", color: "#16a34a" },
    medium: { bg: "#fffbeb", color: "#d97706" },
    hard: { bg: "#fef2f2", color: "#dc2626" },
  };
  return map[diff] ?? { bg: "#f8fafc", color: "#64748b" };
}

// ─── Session type ─────────────────────────────────────────────────────────────

type SessionWithAnalysis = Session & {
  session_analysis: SessionAnalysis[] | null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Parallel fetches
  const [profileRes, recentSessionsRes, pendingTodosRes, activeSessionsRes, completedCountRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("sessions")
        .select("*, session_analysis(*)")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(3),
      supabase
        .from("todos")
        .select("*")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed"),
    ]);

  const profile = profileRes.data as Profile | null;
  const recentSessions = (recentSessionsRes.data ?? []) as SessionWithAnalysis[];
  const pendingTodos = (pendingTodosRes.data ?? []) as Todo[];
  const activeSession = (activeSessionsRes.data ?? [])[0] as Session | undefined;
  const completedCount = completedCountRes.count ?? 0;

  const firstName = profile?.full_name?.split(" ")[0] ?? user.user_metadata?.full_name?.split(" ")[0] ?? "dort";

  // Average score across recent sessions
  const scoresArr = recentSessions
    .map((s) => s.session_analysis?.[0]?.overall_score)
    .filter((v): v is number => typeof v === "number");
  const avgScore = scoresArr.length
    ? Math.round(scoresArr.reduce((a, b) => a + b, 0) / scoresArr.length)
    : null;

  const completedTodosCountRes = await supabase
    .from("todos")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true);
  const completedTodosCount = completedTodosCountRes.count ?? 0;

  return (
    <div className="space-y-8 animate-fade-up">

      {/* ── Active session banner ── */}
      {activeSession && (
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl border"
          style={{
            background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
            borderColor: "#fbbf24",
            boxShadow: "0 2px 12px rgba(251,191,36,0.2)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "#f59e0b" }}
          >
            <AlertCircleIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-amber-900 text-sm">
              Du hast ein laufendes Gespräch
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              {SCENARIO_LABELS[activeSession.scenario_type]}
              {activeSession.company_name ? ` bei ${activeSession.company_name}` : ""}
              {" · "}Gestartet {formatDate(activeSession.created_at)}
            </p>
          </div>
          <Link
            href={`/interview/${activeSession.id}`}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              background: "#f59e0b",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(245,158,11,0.35)",
            }}
          >
            Fortfahren
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── Welcome + CTA ── */}
      <div
        className="relative overflow-hidden rounded-3xl px-8 py-8"
        style={{
          background: "linear-gradient(135deg, #1a56db 0%, #1648c0 40%, #103d96 100%)",
          boxShadow: "0 8px 40px rgba(26,86,219,0.3)",
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-20"
            style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, #ffffff 0%, transparent 70%)" }}
          />
          {/* Subtle dot grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.2" fill="#ffffff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Willkommen zurück</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
              Guten Tag, {firstName}!
            </h1>
            <p className="text-blue-200 text-sm mt-2">
              Bereit für dein nächstes Training?
            </p>
          </div>

          <Link
            href="/interview/new"
            className="flex-shrink-0 group flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#ffffff",
              border: "1.5px solid rgba(255,255,255,0.3)",
              backdropFilter: "blur(4px)",
            }}
            >
            <ZapIcon className="w-4 h-4" />
            Neues Gespräch starten
            <ArrowRightIcon className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: <MessageCircleIcon className="w-5 h-5" />,
            value: completedCount.toString(),
            label: "Gespräche",
            iconBg: "#eff6ff",
            iconColor: "#1a56db",
          },
          {
            icon: <BarChartIcon className="w-5 h-5" />,
            value: avgScore !== null ? avgScore.toString() : "—",
            label: "Ø Score",
            iconBg: "#f0fdf4",
            iconColor: "#16a34a",
          },
          {
            icon: <CheckSquareIcon className="w-5 h-5" />,
            value: completedTodosCount.toString(),
            label: "Aufgaben erledigt",
            iconBg: "#faf5ff",
            iconColor: "#7c3aed",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{
              background: "#ffffff",
              border: "1px solid #f1f5f9",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: stat.iconBg, color: stat.iconColor }}
            >
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 leading-none">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Todos (2/5) ── */}
        <div
          className="lg:col-span-2 rounded-2xl p-6 flex flex-col"
          style={{
            background: "#ffffff",
            border: "1px solid #f1f5f9",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#faf5ff" }}
              >
                <CheckSquareIcon className="w-4 h-4" style={{ color: "#7c3aed" }} />
              </div>
              <h2 className="font-semibold text-slate-900 text-sm">Deine Aufgaben</h2>
              {pendingTodos.length > 0 && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#7c3aed", color: "#ffffff" }}
                >
                  {pendingTodos.length}
                </span>
              )}
            </div>
            <Link
              href="/todos"
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: "#1a56db" }}
            >
              Alle anzeigen →
            </Link>
          </div>

          {/* Todo list */}
          <div className="flex-1 space-y-1">
            {pendingTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "#f0fdf4" }}
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-700">Keine offenen Aufgaben</p>
                <p className="text-xs text-slate-400 mt-1">Alles erledigt!</p>
              </div>
            ) : (
              pendingTodos.map((todo) => (
                <TodoItem key={todo.id} todo={todo} />
              ))
            )}
          </div>
        </div>

        {/* ── Recent sessions (3/5) ── */}
        <div
          className="lg:col-span-3 rounded-2xl p-6 flex flex-col"
          style={{
            background: "#ffffff",
            border: "1px solid #f1f5f9",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#eff6ff" }}
              >
                <ClockIcon className="w-4 h-4" style={{ color: "#1a56db" }} />
              </div>
              <h2 className="font-semibold text-slate-900 text-sm">Letzte Gespräche</h2>
            </div>
            <Link
              href="/history"
              className="text-xs font-medium transition-colors duration-150"
              style={{ color: "#1a56db" }}
            >
              Alle anzeigen →
            </Link>
          </div>

          {/* Session list */}
          <div className="flex-1 space-y-3">
            {recentSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                  style={{ background: "#eff6ff" }}
                >
                  <MessageCircleIcon className="w-6 h-6" style={{ color: "#1a56db" }} />
                </div>
                <p className="text-sm font-medium text-slate-700">Noch keine Gespräche</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Starte jetzt dein erstes Training!</p>
                <Link
                  href="/interview/new"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200"
                  style={{
                    background: "#1a56db",
                    color: "#ffffff",
                    boxShadow: "0 3px 12px rgba(26,86,219,0.3)",
                  }}
                >
                  <ZapIcon className="w-3.5 h-3.5" />
                  Gespräch starten
                </Link>
              </div>
            ) : (
              recentSessions.map((session) => {
                const analysis = session.session_analysis?.[0];
                const scenStyle = scenarioBadgeStyle(session.scenario_type);
                const diffStyle = difficultyBadgeStyle(session.difficulty);

                return (
                  <Link
                    key={session.id}
                    href={`/interview/${session.id}/results`}
                    className="group flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-pointer"
                    style={{
                      border: "1px solid #f1f5f9",
                      background: "#fafbfc",
                    }}
                  >
                    {/* Scenario + details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <span
                          className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{
                            background: scenStyle.bg,
                            color: scenStyle.color,
                            border: `1px solid ${scenStyle.border}`,
                          }}
                        >
                          {SCENARIO_LABELS[session.scenario_type]}
                        </span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{
                            background: diffStyle.bg,
                            color: diffStyle.color,
                          }}
                        >
                          {DIFFICULTY_LABELS[session.difficulty]}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {session.company_name
                          ? `${session.company_name}${session.job_title ? ` · ${session.job_title}` : ""}`
                          : session.job_title || "Allgemeines Szenario"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {session.completed_at ? formatDate(session.completed_at) : formatDate(session.created_at)}
                      </p>
                    </div>

                    {/* Score ring */}
                    {analysis?.overall_score !== undefined ? (
                      <ScoreRing score={analysis.overall_score} />
                    ) : (
                      <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "#f1f5f9" }}>
                        <span className="text-xs text-slate-400">—</span>
                      </div>
                    )}

                    {/* Arrow */}
                    <ArrowRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
