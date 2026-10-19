"use client";

import { Exercise } from "@/types";
import { getExerciseVisual } from "@/lib/exercise-visuals";
import { X, Play, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, ListOrdered } from "lucide-react";
import { useEffect, useState } from "react";

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

  // Scroll lock + Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !exercise) return null;

  const visual = getExerciseVisual(exercise.name);
  const cues = exercise.form_cues?.length ? exercise.form_cues : visual.tips;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="exercise-guide-title"
        className="sheet sm:max-h-[88dvh]"
      >
        {/* Sticky header */}
        <div className="shrink-0 px-4 pt-2.5 pb-3 border-b border-slate-100">
          <div className="mx-auto mb-2.5 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="eyebrow text-emerald-700 truncate">
                {exercise.target_muscle}
                {exercise.equipment ? ` · ${exercise.equipment}` : ""}
              </p>
              <h3 id="exercise-guide-title" className="section-title mt-0.5 line-clamp-2">
                {exercise.name}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="icon-btn -mr-1.5 -mt-1" aria-label="Kapat">
              <X />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-5">
          {/* Media */}
          <div className="space-y-2.5">
            <div className="relative w-full h-52 sm:h-60 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
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
            </div>
            <div className="segmented" role="tablist" aria-label="Görsel türü">
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "gif"}
                data-active={viewMode === "gif"}
                onClick={() => setViewMode("gif")}
                className="segmented-item"
              >
                <Play className="w-3.5 h-3.5" /> Animasyon
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={viewMode === "image"}
                data-active={viewMode === "image"}
                onClick={() => setViewMode("image")}
                className="segmented-item"
              >
                Fotoğraf
              </button>
            </div>
          </div>

          {/* Working Target Muscles */}
          {visual.targetMuscles && (
            <section>
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" /> Çalışan kaslar
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {visual.targetMuscles.map((m, idx) => (
                  <span key={idx} className="chip-primary text-xs">
                    {m}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Instructions */}
          {exercise.instructions && (
            <section>
              <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                <ListOrdered className="w-4 h-4 text-slate-500 shrink-0" /> Hareketin yapılışı
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed">{exercise.instructions}</p>
            </section>
          )}

          {/* Form Cues */}
          {cues && cues.length > 0 && (
            <section>
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Doğru form ve püf noktaları
              </h4>
              <ul className="space-y-2">
                {cues.map((cue, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-[7px] shrink-0" />
                    <span className="min-w-0">{cue}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Common Mistakes */}
          {exercise.common_mistakes && exercise.common_mistakes.length > 0 && (
            <section>
              <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" /> Yaygın hatalar
              </h4>
              <ul className="space-y-2">
                {exercise.common_mistakes.map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-700 leading-snug">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-[7px] shrink-0" />
                    <span className="min-w-0">{mistake}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sticky footer */}
        {exercise.video_url && (
          <div className="shrink-0 px-4 py-3 border-t border-slate-100">
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-dark btn-block"
            >
              <Play className="fill-current" />
              Videoyu izle
              <ExternalLink className="!w-3.5 !h-3.5 text-slate-400" />
            </a>
          </div>
        )}
      </div>
    </>
  );
}
