import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import HistoryClient from "./HistoryClient";
import type { SessionWithAnalysis } from "./SessionCard";

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

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
        style={{ background: "linear-gradient(135deg, #EEF3FF 0%, #DBEAFE 100%)" }}
      >
        <MessageCircleIcon className="w-10 h-10 text-[#1a56db]" />
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
      style={{ background: "linear-gradient(150deg, #F8FAFF 0%, #EEF3FF 55%, #F0F7FF 100%)" }}
    >
      {/* Ambient bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.06]"
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
          <div className="flex items-center gap-2 text-sm">
            <SparkleIcon className="w-4 h-4 text-[#1a56db]" />
            <span className="font-semibold text-[#1a56db]">LuminoAI</span>
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
