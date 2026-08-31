"use client";

import Link from "next/link";
import { QueueStatus, WorkoutRoutine } from "@/types";
import { Play, Sparkles, Clock, CheckCircle2, AlertCircle, ArrowRight, RotateCw } from "lucide-react";

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
  const { nextRoutine, lastSession, hoursSinceLastWorkout, recoveryStatus, recoveryMessage } =
    queueStatus;

  const getRecoveryBadge = () => {
    switch (recoveryStatus) {
      case "fresh":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Toparlanma Tamamlandı
          </span>
        );
      case "recovering":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Kas Dinlenmesi Sürüyor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            Antrenman Zamanı
          </span>
        );
    }
  };

  return (
    <div className="surface-card p-6 md:p-8 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              Dinamik Sarkma Kuyruğu (Rotating Queue)
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {nextRoutine.name}
          </h2>
          {nextRoutine.description && (
            <p className="text-sm text-slate-600 mt-1 max-w-xl">
              {nextRoutine.description}
            </p>
          )}
        </div>

        <div>{getRecoveryBadge()}</div>
      </div>

      {/* Recovery notification message */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 flex items-start gap-2.5 mb-6">
        <RotateCw className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-700">Döngü Durumu: </span>
          {recoveryMessage}
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <Link
          href={`/workout/player?routineId=${nextRoutine.id}`}
          className="flex-1 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-sm hover:shadow-md tap-effect flex items-center justify-center gap-3 transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          Bu Antrenmanı Başlat (Odak Modu)
        </Link>

        {/* Change Routine Selector */}
        {allRoutines.length > 1 && (
          <div className="relative">
            <select
              value={nextRoutine.id}
              onChange={(e) => onSelectRoutine(e.target.value)}
              className="w-full sm:w-auto h-full py-3.5 px-4 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs rounded-2xl appearance-none pr-8 cursor-pointer focus:outline-none focus:border-emerald-500 shadow-sm"
            >
              {allRoutines.map((routine) => (
                <option key={routine.id} value={routine.id}>
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
