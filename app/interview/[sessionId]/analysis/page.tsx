import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { formatDate, scoreToLabel, scoreToColor } from "@/lib/utils";
import { SCENARIO_LABELS } from "@/types";
import type { Session, SessionAnalysis, Todo, Message } from "@/types";
import AnalysisClient from "./AnalysisClient";

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
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

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M6 9H4a2 2 0 0 1-2-2V5h4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 9h2a2 2 0 0 0 2-2V5h-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17v4" strokeLinecap="round" />
      <path d="M8 21h8" strokeLinecap="round" />
      <path d="M6 3h12v8a6 6 0 0 1-12 0V3Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeWidth={3} />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 15h4M8 11h.01M8 15h.01" strokeLinecap="round" />
    </svg>
  );
}

// ─── Score circle SVG ─────────────────────────────────────────────────────────
function ScoreCircle({ score }: { score: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const gap = circumference - progress;

  const getGradient = (s: number) => {
    if (s >= 85) return { from: "#16a34a", to: "#22c55e", text: "#15803d" };
    if (s >= 70) return { from: "#1a56db", to: "#60a5fa", text: "#1648c0" };
    if (s >= 55) return { from: "#d97706", to: "#fbbf24", text: "#b45309" };
    if (s >= 40) return { from: "#ea580c", to: "#fb923c", text: "#c2410c" };
    return { from: "#dc2626", to: "#f87171", text: "#b91c1c" };
  };

  const { from, to, text } = getGradient(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 192, height: 192 }}>
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-20 blur-xl"
        style={{ background: `radial-gradient(circle, ${from} 0%, transparent 70%)` }}
      />

      <svg width="192" height="192" className="rotate-[-90deg]">
        <defs>
          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx="96" cy="96" r={radius}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="10"
        />
        {/* Progress */}
        <circle
          cx="96" cy="96" r={radius}
          fill="none"
          stroke="url(#scoreGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${gap}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>

      {/* Score text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-5xl font-black tracking-tight leading-none"
          style={{ color: text }}
        >
          {score}
        </span>
        <span className="text-sm font-medium text-slate-400 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #f0f7ff 100%)" }}>
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-10">
          <div className="h-6 w-44 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-6 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>

        {/* Hero skeleton */}
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-10 mb-6 flex flex-col items-center gap-6">
          <div className="w-48 h-48 rounded-full bg-slate-100 animate-pulse" />
          <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
          <div className="h-11 w-64 bg-slate-100 rounded-xl animate-pulse" />
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[0, 1].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 p-6 space-y-3">
              <div className="h-5 w-28 bg-slate-200 rounded animate-pulse" />
              {[0, 1, 2].map(j => (
                <div key={j} className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${70 + j * 10}%` }} />
              ))}
            </div>
          ))}
        </div>

        {/* Generating notice */}
        <div className="flex items-center justify-center gap-3 py-6">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-500 animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <span className="text-sm text-slate-500">Analyse wird erstellt…</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function AnalysisPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = await createClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch session
  const { data: session } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .single() as { data: Session | null };

  if (!session) redirect("/dashboard");

  // Fetch analysis
  const { data: analysis } = await supabase
    .from("session_analysis")
    .select("*")
    .eq("session_id", sessionId)
    .single() as { data: SessionAnalysis | null };

  // Fetch todos
  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at") as { data: Todo[] | null };

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at") as { data: Message[] | null };

  // If analysis not ready → show skeleton + trigger generation
  if (!analysis) {
    return (
      <AnalysisClient
        sessionId={sessionId}
        session={session}
        analysis={null}
        todos={todos ?? []}
        messages={messages ?? []}
      />
    );
  }

  const scenarioLabel = SCENARIO_LABELS[session.scenario_type] ?? session.scenario_type;
  const scoreLabel = scoreToLabel(analysis.overall_score);
  const scoreTextColor = scoreToColor(analysis.overall_score);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(150deg, #f8faff 0%, #eef2ff 55%, #f0f7ff 100%)" }}
    >
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #1a56db 0%, transparent 70%)" }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #1a56db 0%, transparent 70%)" }}
        />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 py-10">
        {/* ── Top nav ── */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
          >
            <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            Zurück zum Dashboard
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <SparkleIcon className="w-4 h-4 text-brand-500" />
            <span className="font-semibold text-brand-600">LuminoAI</span>
          </div>
        </div>

        {/* ── Hero card ── */}
        <div
          className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden mb-5"
          style={{ boxShadow: "0 4px 32px rgba(26,86,219,0.07)" }}
        >
          {/* Top accent strip */}
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(90deg, #1a56db 0%, #60a5fa 100%)" }}
          />

          <div className="p-10 flex flex-col items-center text-center gap-5">
            <ScoreCircle score={analysis.overall_score} />

            <div>
              <p className={`text-2xl font-black tracking-tight ${scoreTextColor}`}>{scoreLabel}</p>
              <p className="text-slate-500 text-sm mt-1.5">
                {scenarioLabel}
                {session.company_name && ` · ${session.company_name}`}
                {session.completed_at && ` · ${formatDate(session.completed_at)}`}
              </p>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)",
                boxShadow: "0 4px 16px rgba(26,86,219,0.3)",
              }}
            >
              Nächstes Gespräch starten
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* ── Best Moment ── */}
        {analysis.best_moment && (
          <div
            className="rounded-2xl p-6 mb-5 border"
            style={{
              background: "linear-gradient(135deg, #fffbeb 0%, #fef9c3 100%)",
              borderColor: "#fbbf24",
              boxShadow: "0 2px 12px rgba(251,191,36,0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">✨</span>
              <h2 className="text-sm font-bold text-amber-800 uppercase tracking-wider">
                Dein bester Moment
              </h2>
            </div>
            <blockquote
              className="text-slate-700 text-sm leading-relaxed italic pl-4 border-l-2"
              style={{ borderColor: "#fbbf24" }}
            >
              &ldquo;{analysis.best_moment}&rdquo;
            </blockquote>
          </div>
        )}

        {/* ── Stärken + Schwächen ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Stärken */}
          <div
            className="rounded-2xl p-6 border"
            style={{
              background: "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)",
              borderColor: "#86efac",
              boxShadow: "0 2px 12px rgba(22,163,74,0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#16a34a" }}
              >
                <TrophyIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-green-800 uppercase tracking-wider">Stärken</h2>
            </div>
            <ul className="space-y-2.5">
              {(analysis.strengths ?? []).map((s, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#16a34a" }}
                  >
                    <CheckIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-green-900 leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Schwächen */}
          <div
            className="rounded-2xl p-6 border"
            style={{
              background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
              borderColor: "#fdba74",
              boxShadow: "0 2px 12px rgba(234,88,12,0.08)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "#ea580c" }}
              >
                <WarningIcon className="w-3.5 h-3.5 text-white" />
              </div>
              <h2 className="text-sm font-bold text-orange-800 uppercase tracking-wider">Verbesserungen</h2>
            </div>
            <ul className="space-y-2.5">
              {(analysis.weaknesses ?? []).map((w, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: "#ea580c" }}
                  >
                    <WarningIcon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm text-orange-900 leading-relaxed">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Todos ── */}
        {todos && todos.length > 0 && (
          <div
            className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6 mb-5"
            style={{ boxShadow: "0 2px 16px rgba(26,86,219,0.06)" }}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "#1a56db" }}
                >
                  <ClipboardIcon className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Aufgaben für deine nächste Vorbereitung
                </h2>
              </div>
              <span
                className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: "#e0eaff", color: "#1a56db" }}
              >
                {todos.length} Aufgaben
              </span>
            </div>

            {/* Interactive todo list rendered client-side */}
            <AnalysisClient
              sessionId={sessionId}
              session={session}
              analysis={analysis}
              todos={todos}
              messages={messages ?? []}
              todosOnly
            />
          </div>
        )}

        {/* ── Conversation ── */}
        {messages && messages.length > 0 && (
          <AnalysisClient
            sessionId={sessionId}
            session={session}
            analysis={analysis}
            todos={todos ?? []}
            messages={messages}
            conversationOnly
          />
        )}
      </div>
    </div>
  );
}
