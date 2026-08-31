"use client";

import { useState } from "react";
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
  ArrowRight,
  ShieldAlert,
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
      title: "🔥 Recomposition & Yağ Yakımı",
      desc: "Kas kütlesini koruyarak/arttırarak yağ oranını düşürme",
    },
    {
      id: "Omuz & Üst Göğüs Hipertrofisi (V-Taper)",
      title: "⚡ Omuz & Üst Göğüs (V-Taper)",
      desc: "Geniş omuz ve estetik üst vücut odaklı hacim spliti",
    },
    {
      id: "Maksimum Güç & Progressive Overload",
      title: "💥 Güç & Direnç Maksimizasyonu",
      desc: "24.5 kg dambıl sınırlarında güç ve sinir sistemi adaptasyonu",
    },
    {
      id: "Deload & Aktif Toparlanma",
      title: "🧘 Deload & Toparlanma Fazı",
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-slide-up relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Harun Hoca&apos;ya Özel Program Yazdır
              </h3>
              <p className="text-xs text-slate-500">
                Ölçüm, sakatlık ve ekipman verilerinize göre sıfırdan komple döngüsel split tasarlar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 tap-effect"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-5 scrollbar-thin">
          {!generatedProgram ? (
            <>
              {/* Focus Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Programın Ana Hedefi / Fazı:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {focusOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setFocus(opt.id)}
                      className={`p-3.5 rounded-2xl text-left transition-all border tap-effect ${
                        focus === opt.id
                          ? "bg-emerald-50/70 border-emerald-500 text-emerald-900 shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="font-bold text-xs block">{opt.title}</span>
                      <span className="text-[11px] text-slate-500 mt-1 block">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Personal Notes / Constraints */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Harun Hoca&apos;ya Ek Not veya İstekleriniz:
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Örn: Sırt gününde pull-up sayımı artırmak istiyorum, dambıl lateral raise setlerini artırabilirsin..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:border-emerald-500 text-slate-800"
                />
              </div>

              {/* Generate Action Button */}
              <button
                type="button"
                disabled={isGenerating}
                onClick={handleGenerate}
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-sm tap-effect flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                {isGenerating ? "Harun Hoca Programı Tasarlıyor..." : "Programı Oluştur (Harun Hoca)"}
              </button>
            </>
          ) : (
            /* Program Preview & Confirmation */
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white px-2 py-0.5 rounded-md shadow-xs">
                  {generatedProgram.focus} • {generatedProgram.estimated_duration_weeks} Hafta
                </span>
                <h4 className="text-base font-extrabold text-emerald-950 mt-1.5">
                  {generatedProgram.program_title}
                </h4>
                <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                  💡 {generatedProgram.rationale}
                </p>
              </div>

              {/* Routines Preview */}
              <div className="space-y-3">
                {generatedProgram.routines.map((routine, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-extrabold text-xs text-slate-900">
                        {routine.sequence_order}. {routine.name}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        {routine.exercises.length} Egzersiz
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200/60 text-xs">
                      {routine.exercises.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="py-1.5 flex items-center justify-between text-slate-700"
                        >
                          <span className="font-semibold text-slate-800">
                            {ex.name}
                          </span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {ex.target_weight_kg > 0 ? `${ex.target_weight_kg}kg • ` : ""}{ex.target_sets} × {ex.target_reps}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGeneratedProgram(null)}
                  className="flex-1 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs tap-effect"
                >
                  Geri / Yeniden Oluştur
                </button>
                <button
                  type="button"
                  disabled={isApplying}
                  onClick={handleApplyToDatabase}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tap-effect flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {isApplying ? "Yükleniyor..." : "Bu Programı Uygulamaya Yükle & Aktif Et"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
