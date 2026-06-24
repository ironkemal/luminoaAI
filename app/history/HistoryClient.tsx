"use client";

import { useState } from "react";
import type { ScenarioType } from "@/types";
import type { SessionWithAnalysis } from "./SessionCard";
import { SessionCard } from "./SessionCard";

type Filter = "all" | ScenarioType;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "job_interview", label: "Vorstellungsgespräch" },
  { value: "salary_negotiation", label: "Gehaltsverhandlung" },
  { value: "performance_review", label: "Mitarbeitergespräch" },
];

export default function HistoryClient({ sessions }: { sessions: SessionWithAnalysis[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = filter === "all"
    ? sessions
    : sessions.filter(s => s.scenario_type === filter);

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(f => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="text-xs font-semibold px-4 py-2 rounded-full border-2 transition-all duration-200"
              style={{
                background: active
                  ? "linear-gradient(135deg, #1a56db 0%, #1648c0 100%)"
                  : "#ffffff",
                color: active ? "#ffffff" : "#64748b",
                borderColor: active ? "#1a56db" : "#e2e8f0",
                boxShadow: active ? "0 2px 8px rgba(26,86,219,0.25)" : "none",
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Keine Gespräche in dieser Kategorie.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(session => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      )}
    </div>
  );
}
