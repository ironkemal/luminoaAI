"use client";

import { Exercise } from "@/types";
import { getExerciseVisual } from "@/lib/exercise-visuals";
import { X, Play, CheckCircle2, AlertTriangle, Dumbbell, ExternalLink, Sparkles } from "lucide-react";
import { useState } from "react";

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
  const [viewMode, setViewMode] = useState<"gif" | "image">("gif");

  if (!isOpen || !exercise) return null;

  const visual = getExerciseVisual(exercise.name);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-slide-up relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm tap-effect shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Exercise Animated GIF & Visual Header */}
        <div className="relative w-full h-64 bg-slate-950 flex items-center justify-center overflow-hidden">
          {viewMode === "gif" && visual.gifUrl ? (
            <img
              src={visual.gifUrl}
              alt={exercise.name}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                // Fallback to image if gif network fails
                (e.target as HTMLImageElement).src = visual.thumbnailUrl || exercise.image_url || "";
              }}
            />
          ) : (
            <img
              src={visual.thumbnailUrl || exercise.image_url || ""}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          )}

          {/* GIF / Image Toggle Switcher */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[10px] font-bold text-white">
            <button
              onClick={() => setViewMode("gif")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === "gif" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              ▶ Canlı GIF Animasyon
            </button>
            <button
              onClick={() => setViewMode("image")}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                viewMode === "image" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-300 hover:text-white"
              }`}
            >
              Fotoğraf
            </button>
          </div>

          {/* Muscle & Name Overlay */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-4 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500 text-white font-extrabold text-[10px] uppercase tracking-wider">
                  {exercise.target_muscle}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-white/20 text-white font-semibold text-[10px]">
                  {exercise.equipment}
                </span>
              </div>
              <h3 className="text-base font-black text-white leading-tight">
                {exercise.name}
              </h3>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-5 scrollbar-thin text-xs">
          {/* Working Target Muscles */}
          {visual.targetMuscles && (
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Çalışan Ana ve Yardımcı Kaslar
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {visual.targetMuscles.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-[11px]"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <div>
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1.5">
                Hareketin Yapılışı
              </h4>
              <p className="text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 font-medium">
                {exercise.instructions}
              </p>
            </div>
          )}

          {/* Form Cues */}
          {(exercise.form_cues || visual.tips) && (
            <div>
              <h4 className="font-bold text-emerald-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Doğru Form ve Püf Noktaları
              </h4>
              <div className="space-y-1.5">
                {(exercise.form_cues?.length ? exercise.form_cues : visual.tips).map((cue, idx) => (
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
