"use client";

import Link from "next/link";
import { QueueStatus, WorkoutRoutine } from "@/types";
import { Play, Sparkles, Clock, CheckCircle2, RotateCw, ChevronDown } from "lucide-react";

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
  const { nextRoutine, recoveryStatus, recoveryMessage } = queueStatus;

  const getRecoveryBadge = () => {
    switch (recoveryStatus) {
      case "fresh":
        return (
          <span className="chip-primary">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Toparlanma tamam
          </span>
        );
      case "recovering":
        return (
          <span className="chip-warn">
            <Clock className="w-3.5 h-3.5" />
            Kas dinlenmesi sürüyor
          </span>
        );
      default:
        return (
          <span className="chip-primary">
            <Sparkles className="w-3.5 h-3.5" />
            Antrenman zamanı
          </span>
        );
    }
  };

  return (
    <section className="card relative overflow-hidden" aria-labelledby="next-routine-title">
      {/* Subtle background glow */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        <div className="flex items-center justify-between gap-2">
          <span className="eyebrow text-emerald-700 truncate" title="Dinamik sarkma kuyruğu (rotating queue)">
            Sıradaki antrenman
          </span>
          <span className="shrink-0">{getRecoveryBadge()}</span>
        </div>

        <h2
          id="next-routine-title"
          className="mt-2 text-[1.375rem] md:text-3xl leading-tight font-extrabold text-slate-900 tracking-tight"
        >
          {nextRoutine.name}
        </h2>
        {nextRoutine.description && (
          <p className="text-sm text-slate-600 mt-1 max-w-xl">{nextRoutine.description}</p>
        )}

        {/* Recovery notification message */}
        <div className="mt-4 flex items-start gap-2.5 text-[13px] leading-snug text-slate-600">
          <RotateCw className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="min-w-0">
            <span className="font-semibold text-slate-800">Döngü durumu: </span>
            {recoveryMessage}
          </p>
        </div>

        {/* Action CTA */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-end gap-3">
          <Link
            href={`/workout/player?routineId=${nextRoutine.id}`}
            className="btn-primary btn-lg btn-block sm:flex-1"
            aria-label="Bu antrenmanı başlat (odak modu)"
          >
            <Play className="!w-5 !h-5 fill-current" />
            Antrenmanı Başlat
          </Link>

          {/* Change Routine Selector */}
          {allRoutines.length > 1 && (
            <div className="sm:w-64 min-w-0">
              <label htmlFor="routine-switch" className="field-label">
                Seçimi değiştir
              </label>
              <div className="relative">
                <select
                  id="routine-switch"
                  value={nextRoutine.id}
                  onChange={(e) => onSelectRoutine(e.target.value)}
                  className="input appearance-none pr-10 truncate cursor-pointer"
                >
                  {allRoutines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
