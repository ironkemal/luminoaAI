"use client";

import Link from "next/link";
import { QueueStatus, WorkoutRoutine } from "@/types";
import { Play, Sparkles, Clock, CheckCircle2, RotateCw } from "lucide-react";
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#E2F952]/10 text-[#E2F952] border border-[#E2F952]/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t("recoveryFresh")}
          </span>
        );
      case "recovering":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            {t("recoveryRecovering")}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-[#E2F952]/10 text-[#E2F952] border border-[#E2F952]/20">
            <Sparkles className="w-3.5 h-3.5" />
            {t("recoveryReady")}
          </span>
        );
    }
  };

  return (
    <div className="surface-card p-6 md:p-8 relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#E2F952]">
              {t("queueTitle")} • #{nextRoutine.sequence_order}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {nextRoutine.name}
          </h2>
          {nextRoutine.description && (
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl font-normal">
              {nextRoutine.description}
            </p>
          )}
        </div>

        <div className="self-start md:self-auto">{getRecoveryBadge()}</div>
      </div>

      {/* Recovery notification message */}
      <div className="p-3.5 rounded-xl bg-[#090B0E] border border-white/[0.06] text-xs text-slate-300 flex items-start gap-2.5 mb-6">
        <RotateCw className="w-4 h-4 text-[#E2F952] flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">{t("recoveryReady")}: </span>
          {recoveryMessage}
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Link
          href={`/workout/player?routineId=${nextRoutine.id}`}
          className="flex-1 py-3.5 px-6 rounded-xl btn-primary text-sm font-black tap-effect flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          {t("startWorkout")}
        </Link>

        {/* Change Routine Selector */}
        {allRoutines.length > 1 && (
          <div className="relative">
            <select
              value={nextRoutine.id}
              onChange={(e) => onSelectRoutine(e.target.value)}
              className="w-full sm:w-auto h-full py-3 px-4 bg-[#171C26] border border-white/[0.08] hover:border-white/[0.2] text-slate-300 font-bold text-xs rounded-xl appearance-none pr-8 cursor-pointer focus:outline-none focus:border-[#E2F952] transition-colors"
            >
              {allRoutines.map((routine) => (
                <option key={routine.id} value={routine.id} className="bg-[#11151D] text-white">
                  Seçimi Değiştir: {routine.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
              ▼
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
