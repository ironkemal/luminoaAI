"use client";

import { Exercise } from "@/types";
import { X, Play, CheckCircle2, AlertTriangle, Dumbbell, ExternalLink } from "lucide-react";
import Image from "next/image";

interface ExerciseGuideModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExerciseGuideModal({
  exercise,
  isOpen,
  onClose,
}: ExerciseGuideModalProps) {
  if (!isOpen || !exercise) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm tap-effect"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Exercise Hero Image */}
        <div className="relative w-full h-52 bg-slate-900 flex items-center justify-center overflow-hidden">
          {exercise.image_url ? (
            <img
              src={exercise.image_url}
              alt={exercise.name}
              className="w-full h-full object-cover opacity-90"
            />
          ) : (
            <div className="flex flex-col items-center text-slate-400">
              <Dumbbell className="w-12 h-12 mb-2" />
              <span className="text-xs">{exercise.target_muscle} Egzersizi</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-5">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider">
                  {exercise.target_muscle}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white font-semibold text-[10px]">
                  {exercise.equipment}
                </span>
              </div>
              <h3 className="text-lg font-black text-white leading-tight">
                {exercise.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 scrollbar-thin text-xs">
          {/* Instructions */}
          {exercise.instructions && (
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                Nasıl Yapılır?
              </h4>
              <p className="text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100 font-medium">
                {exercise.instructions}
              </p>
            </div>
          )}

          {/* Form Cues */}
          {exercise.form_cues && exercise.form_cues.length > 0 && (
            <div>
              <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Doğru Form İpuçları
              </h4>
              <div className="space-y-1.5">
                {exercise.form_cues.map((cue, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-950 font-medium flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{cue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Mistakes */}
          {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
            <div>
              <h4 className="font-bold text-amber-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Yapılan Yaygın Hatalar
              </h4>
              <div className="space-y-1.5">
                {exercise.common_mistakes.map((mistake, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 text-amber-950 font-medium flex items-start gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span>{mistake}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Demonstration Link */}
          {exercise.video_url && (
            <div className="pt-2">
              <a
                href={exercise.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs tap-effect flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Play className="w-4 h-4 fill-current text-red-500" />
                YouTube Video Form Rehberini İzle
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
