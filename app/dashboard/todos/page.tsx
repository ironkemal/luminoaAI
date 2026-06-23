"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SCENARIO_LABELS } from "@/types";
import { formatDate } from "@/lib/utils";
import type { Todo, Session, ScenarioType } from "@/types";

// ─── Types ─────────────────────────────────────────────────────────────────────
type TodoWithSession = Todo & { sessions?: Session | null };
type Tab = "open" | "done";

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

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4M12 15h4M8 11h.01M8 15h.01" strokeLinecap="round" />
    </svg>
  );
}

function BotIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M12 11V7M9 7h6M7 15h.01M17 15h.01M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M23 4v6h-6M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #1a56db 0%, #60a5fa 100%)",
          }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-500 w-12 text-right">
        {done}/{total}
      </span>
    </div>
  );
}

// ─── Mentor modal ─────────────────────────────────────────────────────────────
function MentorModal({ feedback, onClose }: { feedback: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
        style={{ boxShadow: "0 24px 64px rgba(26,86,219,0.2)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)" }}
        >
          <BotIcon className="w-6 h-6 text-white" />
        </div>

        <h2 className="text-lg font-black text-slate-900 mb-1">Fortschrittsanalyse</h2>
        <p className="text-xs text-slate-400 mb-5">Personalisiertes Mentor-Feedback von LuminoAI</p>

        {/* Accent line */}
        <div
          className="h-0.5 w-full mb-5 rounded-full"
          style={{ background: "linear-gradient(90deg, #1a56db 0%, transparent 100%)" }}
        />

        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
          {feedback}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)" }}
        >
          Schließen
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "#f0f4ff" }}
      >
        <ClipboardIcon className="w-8 h-8 text-brand-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-1">
        {tab === "open" ? "Keine offenen Aufgaben" : "Noch nichts erledigt"}
      </p>
      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
        {tab === "open"
          ? "Alle Aufgaben sind erledigt. Super! Führe ein neues Gespräch, um weitere zu erhalten."
          : "Erledige eine Aufgabe, um sie hier zu sehen."}
      </p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TodosPage() {
  const router = useRouter();
  const supabase = createClient();

  const [todos, setTodos] = useState<TodoWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("open");
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorFeedback, setMentorFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load todos with session join
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("todos")
        .select("*, sessions(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setTodos((data as TodoWithSession[]) ?? []);
      setLoading(false);
    };
    load();
  }, [supabase, router]);

  // Toggle todo
  const handleToggle = useCallback(async (id: string, completed: boolean) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed } : t));
    await supabase.from("todos").update({ completed }).eq("id", id);
  }, [supabase]);

  // Request mentor feedback
  const requestMentorFeedback = async () => {
    setMentorLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mentor/progress", { method: "POST" });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setMentorFeedback(data.feedback ?? data.message ?? JSON.stringify(data));
    } catch {
      setError("Mentor-Feedback konnte nicht geladen werden.");
    } finally {
      setMentorLoading(false);
    }
  };

  const openTodos = todos.filter(t => !t.completed);
  const doneTodos = todos.filter(t => t.completed);
  const displayed = tab === "open" ? openTodos : doneTodos;

  return (
    <>
      <div
        className="min-h-screen"
        style={{ background: "linear-gradient(150deg, #f8faff 0%, #eef2ff 55%, #f0f7ff 100%)" }}
      >
        {/* Ambient */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
            style={{ background: "radial-gradient(circle, #1a56db 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative max-w-2xl mx-auto px-4 py-10">
          {/* Nav */}
          <div className="flex items-center justify-between mb-10">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors group"
            >
              <ArrowLeftIcon className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Dashboard
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <SparkleIcon className="w-4 h-4 text-brand-500" />
              <span className="font-semibold text-brand-600">LuminoAI</span>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Alle Aufgaben</h1>
                <p className="text-slate-500 text-sm mt-1">
                  Aufgaben aus deinen Gesprächen
                </p>
              </div>

              {/* Mentor CTA */}
              <button
                onClick={requestMentorFeedback}
                disabled={mentorLoading || todos.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)",
                  boxShadow: "0 3px 12px rgba(26,86,219,0.3)",
                }}
              >
                {mentorLoading ? (
                  <>
                    <RefreshIcon className="w-4 h-4 animate-spin" />
                    Analysiert…
                  </>
                ) : (
                  <>
                    <BotIcon className="w-4 h-4" />
                    Fortschrittsanalyse anfragen
                  </>
                )}
              </button>
            </div>

            {/* Progress bar */}
            {!loading && todos.length > 0 && (
              <div className="mt-5">
                <ProgressBar done={doneTodos.length} total={todos.length} />
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-5">
            {[
              { value: "open" as Tab, label: "Offen", count: openTodos.length },
              { value: "done" as Tab, label: "Erledigt", count: doneTodos.length },
            ].map(t => {
              const active = tab === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setTab(t.value)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
                  style={{
                    background: active ? "#ffffff" : "transparent",
                    color: active ? "#1a56db" : "#64748b",
                    boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                  }}
                >
                  {t.label}
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: active ? "#e0eaff" : "#e2e8f0",
                      color: active ? "#1a56db" : "#64748b",
                    }}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div
            className="rounded-2xl bg-white border border-slate-100"
            style={{ boxShadow: "0 2px 16px rgba(26,86,219,0.06)" }}
          >
            {loading ? (
              <div className="p-6 space-y-4">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-md bg-slate-200 animate-pulse flex-shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-4 bg-slate-200 rounded animate-pulse" style={{ width: `${55 + i * 10}%` }} />
                      <div className="h-3 bg-slate-100 rounded animate-pulse w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : displayed.length === 0 ? (
              <EmptyState tab={tab} />
            ) : (
              <div className="divide-y divide-slate-50">
                {displayed.map(todo => {
                  const session = todo.sessions;
                  return (
                    <TodoRow
                      key={todo.id}
                      todo={todo}
                      session={session ?? null}
                      onToggle={handleToggle}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mentor modal */}
      {mentorFeedback && (
        <MentorModal feedback={mentorFeedback} onClose={() => setMentorFeedback(null)} />
      )}
    </>
  );
}

// ─── TodoRow ─────────────────────────────────────────────────────────────────
function TodoRow({
  todo,
  session,
  onToggle,
}: {
  todo: TodoWithSession;
  session: Session | null;
  onToggle: (id: string, completed: boolean) => void;
}) {
  const [optimistic, setOptimistic] = useState(todo.completed);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const next = !optimistic;
    setOptimistic(next);
    setLoading(true);
    await onToggle(todo.id, next);
    setLoading(false);
  };

  const scenarioLabel = session
    ? (SCENARIO_LABELS[session.scenario_type as ScenarioType] ?? session.scenario_type)
    : null;

  return (
    <label className="flex items-start gap-3.5 px-5 py-4 cursor-pointer group hover:bg-slate-50 transition-colors">
      {/* Custom checkbox */}
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={optimistic}
          onChange={handleToggle}
          className="sr-only"
          disabled={loading}
        />
        <div
          className="w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200"
          style={{
            borderColor: optimistic ? "#1a56db" : "#cbd5e1",
            background: optimistic ? "#1a56db" : "transparent",
          }}
        >
          {optimistic && (
            <svg viewBox="0 0 12 12" className="w-3 h-3">
              <path d="m2 6 2.5 2.5L10 4" stroke="white" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </div>
      </div>

      {/* Text + meta */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm leading-relaxed transition-all duration-200"
          style={{
            color: optimistic ? "#94a3b8" : "#1e293b",
            textDecoration: optimistic ? "line-through" : "none",
          }}
        >
          {todo.content}
        </p>

        {/* Session badge */}
        {session && (
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {scenarioLabel && (
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "#f0f4ff", color: "#1a56db" }}
              >
                {scenarioLabel}
              </span>
            )}
            {session.company_name && (
              <span className="text-xs text-slate-400">{session.company_name}</span>
            )}
            {session.completed_at && (
              <span className="text-xs text-slate-300">{formatDate(session.completed_at)}</span>
            )}
          </div>
        )}
      </div>
    </label>
  );
}
