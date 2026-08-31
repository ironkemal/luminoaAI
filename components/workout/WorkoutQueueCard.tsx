"use client";

import Link from "next/link";
import { QueueStatus, WorkoutRoutine } from "@/types";
import { Play, Sparkles, Clock, CheckCircle2, RotateCw, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n";

interface WorkoutQueueCardProps {
  queueStatus: QueueStatus;
  allRoutines: WorkoutRoutine[];
  onSelectRoutine: (routineId: string) => void;
}

export default function WorkoutQueueCard({
  queueStatus,
  allRoutines,
  onSelectRoutine,
}: WorkoutQueueCardProps) {
  const { t } = useLanguage();
  const { nextRoutine, recoveryStatus, recoveryMessage } = queueStatus;

  const getRecoveryBadge = () => {
    switch (recoveryStatus) {
      case "fresh":
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            {t("recoveryFresh")}
          </span>
        );
      case "recovering":
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-md shadow-amber-500/10">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            {t("recoveryRecovering")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-500/10">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            {t("recoveryReady")}
          </span>
        );
    }
  };

  return (
    <div className="surface-card p-6 md:p-8 relative overflow-hidden surface-card-hover border-emerald-500/20">
      {/* Background ambient lighting */}
      <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {t("queueTitle")} • #{nextRoutine.sequence_order}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            {nextRoutine.name}
          </h2>
          {nextRoutine.description && (
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-xl font-medium">
              {nextRoutine.description}
            </p>
          )}
        </div>

        <div className="self-start md:self-auto">{getRecoveryBadge()}</div>
      </div>

      {/* Recovery notification message */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/[0.08] text-xs text-slate-300 flex items-start gap-3 mb-6 relative z-10 font-medium">
        <RotateCw className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">{t("recoveryReady")}: </span>
          {recoveryMessage}
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
        <Link
          href={`/workout/player?routineId=${nextRoutine.id}`}
          className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-emerald-500/30 tap-effect flex items-center justify-center gap-2.5 transition-all group"
        >
          <Play className="w-5 h-5 fill-current text-slate-950 group-hover:scale-110 transition-transform" />
          {t("startWorkout")} (Odak Modu)
        </Link>

        {/* Change Routine Selector */}
        {allRoutines.length > 1 && (
          <div className="relative">
            <select
              value={nextRoutine.id}
              onChange={(e) => onSelectRoutine(e.target.value)}
              className="w-full sm:w-auto h-full py-3.5 px-4 bg-slate-900/90 border border-white/[0.1] hover:border-emerald-400/40 text-slate-200 font-bold text-xs rounded-2xl appearance-none pr-8 cursor-pointer focus:outline-none focus:border-emerald-400 shadow-md transition-colors"
            >
              {allRoutines.map((routine) => (
                <option key={routine.id} value={routine.id} className="bg-slate-900 text-white">
                  Seçimi Değiştir: {routine.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              ▼
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
