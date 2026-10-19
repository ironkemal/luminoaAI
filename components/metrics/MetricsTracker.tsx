"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BodyMetric } from "@/types";
import { analyzeBodyMetrics } from "@/lib/metrics-calculator";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import ProgressPhotosGallery from "@/components/metrics/ProgressPhotosGallery";
import {
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Calendar,
  X,
  Check,
} from "lucide-react";

interface MetricsTrackerProps {
  initialMetrics: BodyMetric[];
}

const STATUS_LABEL: Record<string, string> = {
  recomposition: "Recomp",
  deficit: "Kalori açığı",
  steady: "Stabil",
  surplus: "Kalori fazlası",
};

const formatSigned = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export default function MetricsTracker({ initialMetrics }: MetricsTrackerProps) {
  const [metrics, setMetrics] = useState<BodyMetric[]>(initialMetrics);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [weightKg, setWeightKg] = useState<string>("99.5");
  const [waistCm, setWaistCm] = useState<string>("");
  const [armCm, setArmCm] = useState<string>("");
  const [chestCm, setChestCm] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const analysis = analyzeBodyMetrics(metrics);

  // Sheet: lock body scroll + close on Escape
  useEffect(() => {
    if (!showAddForm) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowAddForm(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [showAddForm]);

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    const weightNum = parseFloat(weightKg);
    if (isNaN(weightNum) || weightNum <= 0) return;

    setIsSubmitting(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      const newEntry = {
        user_id: currentUser?.id || null,
        recorded_at: new Date().toISOString().split("T")[0],
        weight_kg: weightNum,
        waist_cm: waistCm ? parseFloat(waistCm) : null,
        arm_cm: armCm ? parseFloat(armCm) : null,
        chest_cm: chestCm ? parseFloat(chestCm) : null,
        notes: notes || null,
      };

      const { data, error } = await supabase
        .from("body_metrics")
        .insert(newEntry)
        .select()
        .single();

      if (error) throw error;

      setMetrics((prev) => [data as BodyMetric, ...prev]);
      setShowAddForm(false);
      setNotes("");
    } catch (err) {
      console.error("Error adding metric:", err);
      alert("Ölçüm kaydedilirken hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMetric = async (id: string) => {
    if (!confirm("Bu ölçüm kaydını silmek istediğinize emin misiniz?")) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from("body_metrics").delete().eq("id", id);
      if (error) throw error;
      setMetrics((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error("Error deleting metric:", err);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });

  // The analysis message starts with an emoji; the card already shows an icon.
  const recompMessage = analysis?.recompositionMessage.replace(/^\p{Extended_Pictographic}️?\s*/u, "");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">Vücut & Tartım</h1>
          <p className="page-subtitle">
            7 günlük hareketli ortalama su dalgalanmalarını filtreler.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="btn-primary btn-sm shrink-0 mt-0.5"
        >
          <Plus /> Ölçüm ekle
        </button>
      </div>

      {/* Key stats — compact 3-column strip */}
      {analysis && (
        <div className="card !p-0 grid grid-cols-3 divide-x divide-slate-100">
          <div className="min-w-0 p-3 sm:p-5">
            <p className="eyebrow truncate">7G ort.</p>
            <p className="mt-1.5 flex items-baseline gap-1">
              <span className="stat-value text-xl sm:text-2xl">{analysis.movingAverage7d}</span>
              <span className="text-xs font-semibold text-slate-400">kg</span>
            </p>
            <p className="mt-1 text-xs text-slate-500 truncate tabular-nums">
              Son: <span className="font-semibold text-slate-700">{analysis.currentWeight}</span>
            </p>
          </div>

          <div className="min-w-0 p-3 sm:p-5">
            <p className="eyebrow truncate">Bel</p>
            <p className="mt-1.5 flex items-baseline gap-1">
              <span className="stat-value text-xl sm:text-2xl">
                {analysis.currentWaist ? `${analysis.currentWaist}` : "–"}
              </span>
              {analysis.currentWaist && <span className="text-xs font-semibold text-slate-400">cm</span>}
            </p>
            {analysis.waistDelta !== null ? (
              <p
                className={`mt-1 flex items-center gap-1 text-xs font-semibold tabular-nums ${
                  analysis.waistDelta <= 0 ? "text-emerald-600" : "text-amber-600"
                }`}
                title="Başlangıca göre"
              >
                {analysis.waistDelta <= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{formatSigned(analysis.waistDelta)} cm</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400 truncate">Kayıt yok</p>
            )}
          </div>

          <div className="min-w-0 p-3 sm:p-5">
            <p className="eyebrow truncate">Kol</p>
            <p className="mt-1.5 flex items-baseline gap-1">
              <span className="stat-value text-xl sm:text-2xl">
                {analysis.currentArm ? `${analysis.currentArm}` : "–"}
              </span>
              {analysis.currentArm && <span className="text-xs font-semibold text-slate-400">cm</span>}
            </p>
            {analysis.armDelta !== null ? (
              <p
                className={`mt-1 flex items-center gap-1 text-xs font-semibold tabular-nums ${
                  analysis.armDelta >= 0 ? "text-emerald-600" : "text-slate-500"
                }`}
                title="Başlangıca göre"
              >
                {analysis.armDelta >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="truncate">{formatSigned(analysis.armDelta)} cm</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-slate-400 truncate">Kayıt yok</p>
            )}
          </div>
        </div>
      )}

      {/* Recomposition status */}
      {analysis && (
        <div className="card flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-[18px] h-[18px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="section-title min-w-0 truncate">Lean cut durumu</h2>
              <span className="chip-primary shrink-0">
                {STATUS_LABEL[analysis.recompositionStatus] ?? analysis.recompositionStatus}
              </span>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{recompMessage}</p>
          </div>
        </div>
      )}

      {/* Progress photos (pre vs post pump) */}
      <ProgressPhotosGallery currentWeight={analysis?.currentWeight} />

      {/* Measurement history */}
      <div className="card">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h2 className="section-title flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">Ölçüm geçmişi</span>
          </h2>
          {metrics.length > 0 && (
            <span className="chip shrink-0 tabular-nums">{metrics.length} kayıt</span>
          )}
        </div>

        {metrics.length === 0 ? (
          <div className="py-8 text-center">
            <Scale className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Henüz kayıtlı ölçüm yok.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="btn-secondary btn-sm mt-3"
            >
              <Plus /> İlk ölçümü ekle
            </button>
          </div>
        ) : (
          <>
            {/* Mobile list */}
            <ul className="md:hidden divide-y divide-slate-100 -mx-1">
              {metrics.map((item) => (
                <li key={item.id} className="flex items-center gap-3 py-3 px-1">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-900 truncate tabular-nums">
                        {formatDate(item.recorded_at)}
                      </span>
                      <span className="shrink-0 text-base font-extrabold text-slate-900 tabular-nums">
                        {item.weight_kg}
                        <span className="ml-0.5 text-xs font-semibold text-slate-400">kg</span>
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 tabular-nums">
                      <span>Bel <span className="font-semibold text-slate-700">{item.waist_cm ? `${item.waist_cm}` : "–"}</span></span>
                      <span>Kol <span className="font-semibold text-slate-700">{item.arm_cm ? `${item.arm_cm}` : "–"}</span></span>
                      <span>Göğüs <span className="font-semibold text-slate-700">{item.chest_cm ? `${item.chest_cm}` : "–"}</span></span>
                    </div>
                    {item.notes && (
                      <p className="mt-1 text-xs text-slate-400 truncate">{item.notes}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteMetric(item.id)}
                    aria-label="Ölçümü sil"
                    className="icon-btn text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="!w-4 !h-4" />
                  </button>
                </li>
              ))}
            </ul>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400 font-semibold">
                    <th className="py-2.5 px-3 font-semibold">Tarih</th>
                    <th className="py-2.5 px-3 font-semibold">Kilo</th>
                    <th className="py-2.5 px-3 font-semibold">Bel</th>
                    <th className="py-2.5 px-3 font-semibold">Kol</th>
                    <th className="py-2.5 px-3 font-semibold">Göğüs</th>
                    <th className="py-2.5 px-3 font-semibold">Not</th>
                    <th className="py-2.5 px-3 text-right font-semibold"><span className="sr-only">İşlem</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 tabular-nums">
                  {metrics.map((item) => (
                    <tr key={item.id} className="md:hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {formatDate(item.recorded_at)}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">{item.weight_kg} kg</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.waist_cm ? `${item.waist_cm} cm` : "–"}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.arm_cm ? `${item.arm_cm} cm` : "–"}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">{item.chest_cm ? `${item.chest_cm} cm` : "–"}</td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">{item.notes || "–"}</td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteMetric(item.id)}
                          aria-label="Ölçümü sil"
                          className="icon-btn text-slate-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="!w-4 !h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Add measurement — bottom sheet */}
      {showAddForm && createPortal(
        <>
          <div className="sheet-backdrop" onClick={() => setShowAddForm(false)} aria-hidden="true" />
          <form
            onSubmit={handleAddMetric}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-metric-title"
            className="sheet"
          >
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
              <h2 id="add-metric-title" className="section-title flex items-center gap-2 min-w-0">
                <Scale className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="truncate">Yeni ölçüm</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                aria-label="Kapat"
                className="icon-btn -mr-2"
              >
                <X />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div>
                <label htmlFor="m-weight" className="field-label">Kilo (kg) *</label>
                <input
                  id="m-weight"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="99.5"
                  className="input font-bold tabular-nums"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="min-w-0">
                  <label htmlFor="m-waist" className="field-label truncate">Bel (cm)</label>
                  <input
                    id="m-waist"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    placeholder="100.0"
                    className="input !px-3 tabular-nums"
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="m-arm" className="field-label truncate">Kol (cm)</label>
                  <input
                    id="m-arm"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={armCm}
                    onChange={(e) => setArmCm(e.target.value)}
                    placeholder="40.0"
                    className="input !px-3 tabular-nums"
                  />
                </div>
                <div className="min-w-0">
                  <label htmlFor="m-chest" className="field-label truncate">Göğüs (cm)</label>
                  <input
                    id="m-chest"
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={chestCm}
                    onChange={(e) => setChestCm(e.target.value)}
                    placeholder="113.0"
                    className="input !px-3 tabular-nums"
                  />
                </div>
              </div>
              <p className="-mt-2 text-xs text-slate-500">
                Bel: göbek deliği hizasından. Kol: sıkılı halde.
              </p>

              <div>
                <label htmlFor="m-notes" className="field-label">Not (isteğe bağlı)</label>
                <input
                  id="m-notes"
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sabah aç karnına tartım..."
                  className="input"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 px-5 py-3 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                İptal
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary">
                <Check /> {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </form>
        </>,
        document.body
      )}
    </div>
  );
}
