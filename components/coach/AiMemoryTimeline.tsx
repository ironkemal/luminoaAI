"use client";

import { AiCoachLog } from "@/types";
import { Brain, Sparkles, CheckCircle2, Clock, Calendar, ArrowRight, History } from "lucide-react";

interface AiMemoryTimelineProps {
  logs: AiCoachLog[];
}

export default function AiMemoryTimeline({ logs }: AiMemoryTimelineProps) {
  if (!logs || logs.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-xs text-slate-400">
        <Brain className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        Henüz kayıtlı bir Harun Hoca karar geçmişi bulunmuyor.
      </div>
    );
  }

  return (
    <div className="surface-card p-6 md:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900 text-white">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Harun Hoca Hafıza Dosyası & Karar Matrisi
            </h3>
            <p className="text-xs text-slate-500">
              Harun Hoca&apos;nın geçmiş verilerinize ve sakatlık durumunuza dayanarak aldığı tüm program ve progressive overload kararları
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-xl">
          {logs.length} Karar Kaydı
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {logs.map((log, index) => {
          const isLatest = index === 0;

          return (
            <div key={log.id || index} className="relative group">
              {/* Timeline Dot */}
              <div
                className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                  isLatest
                    ? "border-emerald-500 text-emerald-600 shadow-sm"
                    : "border-slate-300 text-slate-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    isLatest ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
              </div>

              {/* Memory Card */}
              <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800">
                      {new Date(log.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isLatest && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                        GÜNCEL DURUM
                      </span>
                    )}
                  </div>

                  {log.applied ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uygulandı
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-amber-600">
                      Beklemede
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {log.evaluation_summary}
                </p>

                {/* Sub recommendations or details if any */}
                {log.suggested_changes?.recommendations && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex flex-wrap gap-2">
                    {log.suggested_changes.recommendations.map((r, rIdx) => (
                      <span
                        key={rIdx}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700"
                      >
                        {r.exercise}: {r.new_val} ({r.action === "increase_weight" ? "+Ağırlık" : "+Tekrar"})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
