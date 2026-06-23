"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Session, SessionAnalysis, Todo, Message } from "@/types";

// ─── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  sessionId: string;
  session: Session;
  analysis: SessionAnalysis | null;
  todos: Todo[];
  messages: Message[];
  todosOnly?: boolean;
  conversationOnly?: boolean;
}

// ─── Inline icons ─────────────────────────────────────────────────────────────
function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M23 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Individual todo item ─────────────────────────────────────────────────────
function TodoItem({ todo, onToggle }: { todo: Todo; onToggle: (id: string, completed: boolean) => void }) {
  const [optimistic, setOptimistic] = useState(todo.completed);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    const next = !optimistic;
    setOptimistic(next);
    setLoading(true);
    await onToggle(todo.id, next);
    setLoading(false);
  };

  return (
    <label
      className="flex items-start gap-3 cursor-pointer group py-2.5 px-1 rounded-lg transition-colors hover:bg-slate-50"
    >
      {/* Checkbox */}
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
      <span
        className="text-sm leading-relaxed transition-all duration-200"
        style={{
          color: optimistic ? "#94a3b8" : "#374151",
          textDecoration: optimistic ? "line-through" : "none",
        }}
      >
        {todo.content}
      </span>
    </label>
  );
}

// ─── Skeleton for loading state ───────────────────────────────────────────────
function AnalysisSkeleton({ sessionId }: { sessionId: string }) {
  const [triggered, setTriggered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (triggered) return;
    setTriggered(true);
    fetch("/api/interview/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    })
      .then((res) => {
        if (res.ok) {
          // Reload to show fresh data
          setTimeout(() => window.location.reload(), 1000);
        } else {
          setError("Analyse konnte nicht erstellt werden.");
        }
      })
      .catch(() => setError("Netzwerkfehler. Bitte Seite neu laden."));
  }, [sessionId, triggered]);

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 50%, #f0f7ff 100%)" }}
    >
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-10 text-sm font-medium text-slate-500">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Zurück zum Dashboard
        </div>

        {/* Pulsing hero */}
        <div className="rounded-3xl bg-white border border-slate-100 p-10 mb-5 flex flex-col items-center gap-6"
          style={{ boxShadow: "0 4px 32px rgba(26,86,219,0.07)" }}>
          <div className="w-48 h-48 rounded-full bg-slate-100 animate-pulse" />
          <div className="space-y-2 text-center">
            <div className="h-6 w-40 bg-slate-200 rounded-lg animate-pulse mx-auto" />
            <div className="h-4 w-64 bg-slate-100 rounded animate-pulse mx-auto" />
          </div>
          <div className="h-11 w-56 bg-slate-100 rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-5">
          {[0, 1].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-slate-100 p-6 space-y-3">
              <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
              {[0, 1, 2].map(j => (
                <div key={j} className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${65 + j * 12}%` }} />
              ))}
            </div>
          ))}
        </div>

        {/* Status notice */}
        <div
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: "#f0f4ff", border: "1px solid #c7d7fe" }}
        >
          {error ? (
            <>
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-red-600 text-sm font-bold">!</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-xs text-red-500 mt-1 underline"
                >
                  Seite neu laden
                </button>
              </div>
            </>
          ) : (
            <>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: "#1a56db" }}
              >
                <RefreshIcon className="w-4 h-4 text-white animate-spin" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-700">Analyse wird erstellt…</p>
                <p className="text-xs text-slate-400 mt-0.5">KI wertet dein Gespräch aus — dauert ca. 10 Sekunden.</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function AnalysisClient({
  sessionId,
  session,
  analysis,
  todos,
  messages,
  todosOnly = false,
  conversationOnly = false,
}: Props) {
  const supabase = createClient();
  const [localTodos, setLocalTodos] = useState<Todo[]>(todos);
  const [showConversation, setShowConversation] = useState(false);

  // Sync if parent passes new todos
  useEffect(() => {
    setLocalTodos(todos);
  }, [todos]);

  const handleToggle = useCallback(async (id: string, completed: boolean) => {
    setLocalTodos(prev =>
      prev.map(t => t.id === id ? { ...t, completed } : t)
    );
    await supabase
      .from("todos")
      .update({ completed })
      .eq("id", id);
  }, [supabase]);

  // Skeleton for loading state (no analysis yet)
  if (!analysis) {
    return <AnalysisSkeleton sessionId={sessionId} />;
  }

  // Only render todos list
  if (todosOnly) {
    return (
      <div className="divide-y divide-slate-100">
        {localTodos.map(todo => (
          <TodoItem key={todo.id} todo={todo} onToggle={handleToggle} />
        ))}
      </div>
    );
  }

  // Only render conversation
  if (conversationOnly) {
    return (
      <div
        className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden"
        style={{ boxShadow: "0 2px 16px rgba(26,86,219,0.06)" }}
      >
        <button
          onClick={() => setShowConversation(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">
            Gesprächsverlauf anzeigen
          </span>
          <ChevronDownIcon
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${showConversation ? "rotate-180" : ""}`}
          />
        </button>

        {showConversation && (
          <div className="px-6 pb-6 space-y-4 max-h-[32rem] overflow-y-auto border-t border-slate-100 pt-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: msg.role === "user" ? "#1a56db" : "#f1f5f9",
                  }}
                >
                  {msg.role === "user" ? (
                    <UserIcon className="w-4 h-4 text-white" />
                  ) : (
                    <SparkleIcon className="w-3.5 h-3.5 text-brand-500" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: msg.role === "user"
                      ? "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)"
                      : "#f8fafc",
                    color: msg.role === "user" ? "#ffffff" : "#374151",
                    borderBottomRightRadius: msg.role === "user" ? "4px" : "16px",
                    borderBottomLeftRadius: msg.role === "assistant" ? "4px" : "16px",
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
}
