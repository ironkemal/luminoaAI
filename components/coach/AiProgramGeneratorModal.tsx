"use client";

import { useState, useEffect } from "react";
import { FullProgramResult } from "@/lib/ai-pt-coach";
import { getCurrentUser } from "@/lib/auth-pin";
import {
  Sparkles,
  Calendar,
  Dumbbell,
  Check,
  X,
  Flame,
  Zap,
  Leaf,
  RotateCw
} from "lucide-react";

interface AiProgramGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProgramApplied: () => void;
}

export default function AiProgramGeneratorModal({
  isOpen,
  onClose,
  onProgramApplied,
}: AiProgramGeneratorModalProps) {
  const [focus, setFocus] = useState("Body Recomposition & Lean Cut");
  const [notes, setNotes] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [generatedProgram, setGeneratedProgram] = useState<FullProgramResult | null>(null);

  const focusOptions = [
    {
      id: "Body Recomposition & Lean Cut",
      title: "Recomposition & yağ yakımı",
      desc: "Kas kütlesini koruyarak/arttırarak yağ oranını düşürme",
    },
    {
      id: "Omuz & Üst Göğüs Hipertrofisi (V-Taper)",
      title: "Omuz & üst göğüs (V-Taper)",
      desc: "Geniş omuz ve estetik üst vücut odaklı hacim spliti",
    },
    {
      id: "Maksimum Güç & Progressive Overload",
      title: "Güç & direnç",
      desc: "24.5 kg dambıl sınırlarında güç ve sinir sistemi adaptasyonu",
    },
    {
      id: "Deload & Aktif Toparlanma",
      title: "Deload & toparlanma",
      desc: "Eklemleri ve merkezi sinir sistemini dinlendiren hafif tempo",
    },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    const u = getCurrentUser();
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_full_program",
          programFocus: focus,
          programNotes: notes,
          userId: u?.id,
          userProfile: u,
        }),
      });

      const data = await res.json();
      if (data.success && data.program) {
        setGeneratedProgram(data.program);
      }
    } catch (err) {
      console.error("Error generating program:", err);
      alert("Program üretilirken hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyToDatabase = async () => {
    if (!generatedProgram) return;

    setIsApplying(true);
    const u = getCurrentUser();
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_full_program",
          generatedProgram: generatedProgram,
          userId: u?.id,
          userProfile: u,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(data.message || "Yeni program başarıyla yüklendi!");
        onProgramApplied();
        onClose();
      }
    } catch (err) {
      console.error("Error applying full program:", err);
      alert("Program veritabanına yüklenirken hata oluştu.");
    } finally {
      setIsApplying(false);
    }
  };

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const focusIcons = [Flame, Zap, Dumbbell, Leaf];

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden />

      <div role="dialog" aria-modal="true" aria-labelledby="program-gen-title" className="sheet sm:w-[min(42rem,calc(100vw-2rem))]">
        {/* Grabber (mobile) */}
        <div className="sm:hidden flex justify-center pt-2.5" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-2 px-4 pt-2 pb-3 sm:pt-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <h3 id="program-gen-title" className="section-title">
              {generatedProgram ? "Program önizleme" : "Özel program yazdır"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
              Ölçüm, sakatlık ve ekipman verilerinize göre sıfırdan döngüsel split tasarlar
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="icon-btn -mr-1">
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4">
          {!generatedProgram ? (
            <div className="space-y-5">
              {/* Focus Selection */}
              <fieldset>
                <legend className="field-label">Ana hedef / faz</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup">
                  {focusOptions.map((opt, oIdx) => {
                    const Icon = focusIcons[oIdx] || Sparkles;
                    const selected = focus === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setFocus(opt.id)}
                        className={`tap-effect flex items-start gap-3 p-3 rounded-2xl text-left border transition-colors ${
                          selected
                            ? "bg-emerald-50/70 border-emerald-500"
                            : "bg-white border-slate-200 md:hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                            selected ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-slate-900">{opt.title}</span>
                          <span className="block text-xs text-slate-500 mt-0.5 leading-snug">{opt.desc}</span>
                        </span>
                        <span
                          aria-hidden
                          className={`shrink-0 mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selected ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"
                          }`}
                        >
                          {selected && <Check className="w-3 h-3" strokeWidth={3} />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {/* Personal Notes / Constraints */}
              <div>
                <label htmlFor="program-notes" className="field-label">
                  Ek not veya istekleriniz
                </label>
                <textarea
                  id="program-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Sırt gününde pull-up sayımı artırmak istiyorum, dambıl lateral raise setlerini artırabilirsin..."
                  rows={3}
                  className="input py-2.5 leading-relaxed resize-none"
                />
              </div>
            </div>
          ) : (
            /* Program Preview */
            <div className="space-y-4 animate-fade-in">
              <div className="rounded-2xl bg-emerald-50/70 p-4">
                <p className="eyebrow text-emerald-700 truncate">
                  {generatedProgram.focus} · <span className="tabular-nums">{generatedProgram.estimated_duration_weeks}</span> hafta
                </p>
                <h4 className="mt-1 text-base font-bold text-slate-900 leading-snug">
                  {generatedProgram.program_title}
                </h4>
                <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">{generatedProgram.rationale}</p>
              </div>

              {generatedProgram.routines.map((routine, rIdx) => (
                <section key={rIdx}>
                  <div className="flex items-center justify-between gap-3">
                    <h5 className="min-w-0 truncate text-sm font-bold text-slate-900">
                      {routine.sequence_order}. {routine.name}
                    </h5>
                    <span className="chip shrink-0 tabular-nums">{routine.exercises.length} Egzersiz</span>
                  </div>
                  <ul className="mt-1.5 divide-y divide-slate-100 border-y border-slate-100">
                    {routine.exercises.map((ex, exIdx) => (
                      <li key={exIdx} className="py-2 flex items-center justify-between gap-3">
                        <span className="min-w-0 text-sm text-slate-800">{ex.name}</span>
                        <span className="shrink-0 text-xs font-semibold text-emerald-700 tabular-nums">
                          {ex.target_weight_kg > 0 ? `${ex.target_weight_kg} kg · ` : ""}
                          {ex.target_sets} × {ex.target_reps}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-4 pt-3 pb-4 border-t border-slate-100">
          {!generatedProgram ? (
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className="btn-primary btn-lg btn-block"
            >
              <Sparkles className={isGenerating ? "animate-spin" : ""} />
              {isGenerating ? "Harun Hoca yazıyor…" : "Programı oluştur"}
            </button>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setGeneratedProgram(null)}
                className="btn-secondary px-3"
              >
                <RotateCw />
                Yeniden oluştur
              </button>
              <button
                type="button"
                disabled={isApplying}
                onClick={handleApplyToDatabase}
                className="btn-primary px-3"
              >
                <Check />
                {isApplying ? "Yükleniyor..." : "Programı yükle"}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
