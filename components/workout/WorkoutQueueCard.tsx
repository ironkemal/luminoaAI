"use client";

import Link from "next/link";
import { QueueStatus, WorkoutRoutine } from "@/types";
import { Play, Sparkles, Clock, CheckCircle2, RotateCw, Dumbbell, ArrowRight } from "lucide-react";
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

  return (
    <div className="hevy-card p-5 sm:p-6 space-y-4">
      {/* Top Tag & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1E2638]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
            Sıradaki Antrenman • #{nextRoutine.sequence_order}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            (Döngüsel Sıralama)
          </span>
        </div>

        {allRoutines.length > 1 && (
          <div className="relative self-start sm:self-auto">
            <select
              value={nextRoutine.id}
              onChange={(e) => onSelectRoutine(e.target.value)}
              className="py-1 px-2.5 bg-[#181F2E] border border-[#1E2638] text-slate-300 font-semibold text-xs rounded-lg appearance-none pr-6 cursor-pointer focus:outline-none focus:border-emerald-400"
            >
              {allRoutines.map((routine) => (
                <option key={routine.id} value={routine.id} className="bg-[#121722] text-white">
                  Seçimi Değiştir: {routine.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>
        )}
      </div>

      {/* Routine Main Info */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {nextRoutine.name}
        </h2>
        {nextRoutine.description && (
          <p className="text-xs text-slate-400 mt-1 font-normal leading-relaxed">
            {nextRoutine.description}
          </p>
        )}
      </div>

      {/* Recovery Status Alert */}
      <div className="p-3 rounded-xl bg-[#0B0E14] border border-[#1E2638] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <RotateCw className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-slate-300 font-medium text-[11px]">
            {recoveryMessage}
          </span>
        </div>
        {recoveryStatus === "fresh" && (
          <span className="text-[10px] font-bold text-emerald-400 uppercase bg-emerald-500/10 px-2 py-0.5 rounded-md flex-shrink-0">
            Hazır
          </span>
        )}
      </div>

      {/* CTA Button */}
      <Link
        href={`/workout/player?routineId=${nextRoutine.id}`}
        className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-sm tap-effect flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
      >
        <Play className="w-4 h-4 fill-current" />
        Antrenmana Başla (Set Tablosu)
      </Link>
    </div>
  );
}
