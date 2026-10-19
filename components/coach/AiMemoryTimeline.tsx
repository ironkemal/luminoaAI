"use client";

import { AiCoachLog } from "@/types";
import { Brain, CheckCircle2 } from "lucide-react";

interface AiMemoryTimelineProps {
  logs: AiCoachLog[];
}

export default function AiMemoryTimeline({ logs }: AiMemoryTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="card text-center py-10">
        <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
          <Brain className="w-6 h-6" />
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">Henüz karar kaydı yok</p>
        <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
          Henüz kayıtlı bir Harun Hoca karar geçmişi bulunmuyor.
        </p>
      </div>
    );
  }

  return (
    <section className="card">
      {/* Header */}
      <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
          <Brain className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="section-title min-w-0 truncate">Karar hafızası</h3>
            <span className="chip shrink-0 tabular-nums">{logs.length} kayıt</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
            Harun Hoca&apos;nın verilerine ve sakatlık durumuna göre aldığı program ve progressive overload kararları
          </p>
        </div>
      </div>

      {/* Timeline */}
      <ol className="relative mt-4 space-y-5 pl-6 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-slate-200">
        {logs.map((log, index) => {
          const isLatest = index === 0;

          return (
            <li key={log.id || index} className="relative">
              {/* Timeline Dot */}
              <span
                aria-hidden
                className={`absolute -left-6 top-1 w-[15px] h-[15px] rounded-full border-2 bg-white flex items-center justify-center ${
                  isLatest ? "border-emerald-500" : "border-slate-300"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isLatest ? "bg-emerald-500" : "bg-slate-300"}`} />
              </span>

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-xs font-semibold text-slate-800 tabular-nums">
                  {new Date(log.created_at).toLocaleDateString("tr-TR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                {isLatest && <span className="chip-primary">Güncel</span>}
                {log.applied ? (
                  <span className="chip-primary">
                    <CheckCircle2 className="w-3 h-3" /> Uygulandı
                  </span>
                ) : (
                  <span className="chip-warn">Beklemede</span>
                )}
              </div>

              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{log.evaluation_summary}</p>

              {log.suggested_changes?.recommendations && log.suggested_changes.recommendations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {log.suggested_changes.recommendations.map((r, rIdx) => (
                    <span key={rIdx} className="chip whitespace-normal leading-snug py-1 tabular-nums">
                      {r.exercise}: {r.new_val} ({r.action === "increase_weight" ? "+Ağırlık" : "+Tekrar"})
                    </span>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
