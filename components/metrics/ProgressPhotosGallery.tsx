"use client";

import { useState, useEffect, useRef } from "react";
import { ProgressPhoto, PhotoTiming, PhotoPose } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import {
  Camera,
  UploadCloud,
  Flame,
  Snowflake,
  Trash2,
  Maximize2,
  X,
  Plus,
  Sparkles,
  Calendar,
  Layers,
  Check
} from "lucide-react";

interface ProgressPhotosGalleryProps {
  currentWeight?: number;
}

export default function ProgressPhotosGallery({ currentWeight }: ProgressPhotosGalleryProps) {
  const { t } = useLanguage();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);

  // Filter State
  const [filterTiming, setFilterTiming] = useState<"all" | PhotoTiming>("all");

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [timing, setTiming] = useState<PhotoTiming>("pre_workout");
  const [pose, setPose] = useState<PhotoPose>("front");
  const [weightKg, setWeightKg] = useState<string>(currentWeight ? String(currentWeight) : "99.5");
  const [recordedDate, setRecordedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      let query = supabase
        .from("progress_photos")
        .select("*")
        .order("recorded_at", { ascending: false });

      if (currentUser?.id) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;
      if (!error && data) {
        setPhotos(data as ProgressPhoto[]);
      }
    } catch (err) {
      console.warn("Fetch photos error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Convert image to compressed base64 helper
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error("Görsel işlenemedi"));
        img.src = e.target?.result as string;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      alert("Lütfen bir fotoğraf seçin.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      let finalPhotoUrl = "";

      // 1. Try Supabase Storage first
      try {
        const fileExt = selectedFile?.name.split(".").pop() || "jpg";
        const fileName = `${currentUser?.id || "anon"}_${Date.now()}.${fileExt}`;
        const filePath = `progress/${fileName}`;

        if (selectedFile) {
          const { data: storageData, error: storageErr } = await supabase.storage
            .from("progress-photos")
            .upload(filePath, selectedFile, { upsert: true });

          if (!storageErr && storageData) {
            const { data: publicUrlData } = supabase.storage
              .from("progress-photos")
              .getPublicUrl(filePath);
            finalPhotoUrl = publicUrlData.publicUrl;
          }
        }
      } catch (storageException) {
        console.warn("Storage upload failed, falling back to base64:", storageException);
      }

      // 2. Fallback to compressed Base64 Data URL if storage bucket wasn't created yet
      if (!finalPhotoUrl && selectedFile) {
        finalPhotoUrl = await fileToBase64(selectedFile);
      }

      if (!finalPhotoUrl) {
        throw new Error("Fotoğraf yüklenemedi.");
      }

      const { data, error } = await supabase
        .from("progress_photos")
        .insert({
          user_id: currentUser?.id || null,
          photo_url: finalPhotoUrl,
          timing,
          pose,
          weight_kg: weightKg ? parseFloat(weightKg) : null,
          recorded_at: recordedDate,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      setPhotos((prev) => [data as ProgressPhoto, ...prev]);
      setShowUploadModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNotes("");
    } catch (err: any) {
      console.error("Save progress photo error:", err);
      alert("Fotoğraf kaydedilirken hata oluştu: " + (err.message || ""));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm("Bu gelişim fotoğrafını silmek istediğinize emin misiniz?")) return;
    const supabase = createClient();
    try {
      const { error } = await supabase.from("progress_photos").delete().eq("id", id);
      if (error) throw error;
      setPhotos((prev) => prev.filter((p) => p.id !== id));
      if (selectedPhoto?.id === id) {
        setSelectedPhoto(null);
      }
    } catch (err) {
      console.error("Delete photo error:", err);
    }
  };

  const filteredPhotos =
    filterTiming === "all"
      ? photos
      : photos.filter((p) => p.timing === filterTiming);

  return (
    <div className="surface-card p-6 border-emerald-500/20 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white">
              Haftalık Gelişim Fotoğrafları & Karşılaştırma
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            Soğuk (Antrenman Öncesi) vs. Pump (Antrenman Sonrası) fotoğraflarınızı kaydedip kas değişimini izleyin.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 tap-effect flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Fotoğraf Ekle
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-2xl border border-white/[0.08] w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => setFilterTiming("all")}
          className={`px-3 py-1.5 rounded-xl transition-all tap-effect ${
            filterTiming === "all"
              ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Tümü ({photos.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTiming("pre_workout")}
          className={`px-3 py-1.5 rounded-xl transition-all tap-effect flex items-center gap-1.5 ${
            filterTiming === "pre_workout"
              ? "bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Snowflake className="w-3.5 h-3.5" /> Soğuk (Pre-Workout)
        </button>

        <button
          type="button"
          onClick={() => setFilterTiming("post_workout")}
          className={`px-3 py-1.5 rounded-xl transition-all tap-effect flex items-center gap-1.5 ${
            filterTiming === "post_workout"
              ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/25"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Pump (Post-Workout)
        </button>
      </div>

      {/* Photo Gallery Grid */}
      {loading ? (
        <div className="py-12 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-950/60 border border-dashed border-white/[0.08] text-center">
          <Camera className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-400">
            {filterTiming === "all"
              ? "Henüz gelişim fotoğrafı yüklenmedi."
              : "Bu filtreye ait fotoğraf bulunamadı."}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Yukarıdaki &quot;Fotoğraf Ekle&quot; butonuna basarak antrenman öncesi (soğuk) veya sonrası (pump) ilk karenizi kaydedin!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl bg-slate-950 border border-white/[0.08] hover:border-emerald-400/40 overflow-hidden shadow-lg transition-all flex flex-col justify-between"
            >
              {/* Photo Image Frame */}
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="w-full h-44 sm:h-52 overflow-hidden cursor-pointer relative bg-black flex items-center justify-center"
              >
                <img
                  src={photo.photo_url}
                  alt="Gelişim Fotoğrafı"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Timing Badge (Soğuk vs Pump) */}
                <div className="absolute top-2 left-2 z-10">
                  {photo.timing === "post_workout" ? (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/90 backdrop-blur-md text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md">
                      <Flame className="w-3 h-3 fill-current" /> PUMP
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-lg bg-cyan-500/90 backdrop-blur-md text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-md">
                      <Snowflake className="w-3 h-3" /> SOĞUK
                    </span>
                  )}
                </div>

                {/* Pose Badge */}
                <div className="absolute top-2 right-2 z-10">
                  <span className="px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-white font-bold text-[10px] uppercase border border-white/10">
                    {photo.pose === "front" ? "Ön" : photo.pose === "side" ? "Yan" : photo.pose === "back" ? "Sırt" : "Genel"}
                  </span>
                </div>

                {/* Quick overlay on hover */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="w-6 h-6 text-white drop-shadow-md" />
                </div>
              </div>

              {/* Card Meta Footer */}
              <div className="p-2.5 bg-slate-900 border-t border-white/[0.06] flex items-center justify-between text-[11px]">
                <div>
                  <div className="font-bold text-white">
                    {new Date(photo.recorded_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {photo.weight_kg && (
                    <div className="text-[10px] text-emerald-400 font-extrabold">
                      {photo.weight_kg} kg
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-white/[0.05] tap-effect"
                  title="Sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── UPLOAD MODAL ── */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 rounded-3xl p-6 md:p-7 shadow-2xl border border-white/[0.1] animate-slide-up relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08] tap-effect"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-400" /> Gelişim Fotoğrafı Yükle
            </h3>
            <p className="text-xs text-slate-400 mb-5 font-medium">
              Vücut kompozisyonu değişimini doğru takip edebilmek için çekim zamanını belirtin.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* File Dropzone */}
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative w-full h-56 bg-black rounded-2xl overflow-hidden border border-white/[0.1] flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Önizleme"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/70 hover:bg-black/90 text-white rounded-xl text-xs font-bold backdrop-blur-md border border-white/10 tap-effect"
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-44 rounded-2xl bg-slate-950 border-2 border-dashed border-white/[0.15] hover:border-emerald-400/50 flex flex-col items-center justify-center p-4 cursor-pointer tap-effect transition-colors group"
                  >
                    <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-emerald-400 transition-colors mb-2" />
                    <p className="text-xs font-bold text-slate-300">
                      Fotoğraf Seç veya Kamerayla Çek
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      PNG, JPG veya WEBP (Maks. 10MB)
                    </p>
                  </div>
                )}
              </div>

              {/* Timing Selection (IMPORTANT: Pre-Workout vs Post-Workout) */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/[0.08] space-y-2">
                <label className="block text-xs font-black text-white">
                  Çekim Durumu (Soğuk vs. Pump) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTiming("pre_workout")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all tap-effect flex flex-col items-start gap-1 ${
                      timing === "pre_workout"
                        ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/10"
                        : "bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <Snowflake className="w-4 h-4 text-cyan-400" />
                      Soğuk (Pre-Workout)
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      Antrenmandan önce, dinlenmiş kas durumu
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTiming("post_workout")}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all tap-effect flex flex-col items-start gap-1 ${
                      timing === "post_workout"
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10"
                        : "bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <Flame className="w-4 h-4 text-amber-400" />
                      Pump (Post-Workout)
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal leading-tight">
                      Antrenman hemen sonrası, dolu & kan akışlı
                    </span>
                  </button>
                </div>
              </div>

              {/* Pose & Date & Weight */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Poz / Açı
                  </label>
                  <select
                    value={pose}
                    onChange={(e) => setPose(e.target.value as PhotoPose)}
                    className="w-full px-3 py-2 bg-slate-950 border border-white/[0.1] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  >
                    <option value="front">Ön (Front)</option>
                    <option value="side">Yan (Side)</option>
                    <option value="back">Sırt (Back)</option>
                    <option value="other">Genel / Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Kilo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="99.5"
                    className="w-full px-3 py-2 bg-slate-950 border border-white/[0.1] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={recordedDate}
                    onChange={(e) => setRecordedDate(e.target.value)}
                    className="w-full px-2.5 py-2 bg-slate-950 border border-white/[0.1] rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Not (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Göğüs & kol antrenmanı sonrası, iyi pump..."
                  className="w-full px-3.5 py-2 bg-slate-950 border border-white/[0.1] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white tap-effect"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!selectedFile && !previewUrl)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 tap-effect flex items-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {isUploading ? "Kaydediliyor..." : "Fotoğrafı Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── FULLSCREEN LIGHTBOX MODAL ── */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 z-20 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md tap-effect"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-3xl w-full flex flex-col items-center">
            <div className="max-h-[75vh] w-full flex items-center justify-center mb-4">
              <img
                src={selectedPhoto.photo_url}
                alt="Gelişim Detayı"
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>

            <div className="w-full p-4 rounded-2xl bg-slate-900/90 border border-white/[0.1] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {selectedPhoto.timing === "post_workout" ? (
                  <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center gap-1.5">
                    <Flame className="w-4 h-4 fill-current" /> PUMP (Post-Workout)
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-xl bg-cyan-500 text-slate-950 font-black flex items-center gap-1.5">
                    <Snowflake className="w-4 h-4" /> SOĞUK (Pre-Workout)
                  </span>
                )}

                <span className="font-bold text-slate-300">
                  Tarih: {new Date(selectedPhoto.recorded_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </span>

                {selectedPhoto.weight_kg && (
                  <span className="font-black text-emerald-400">
                    {selectedPhoto.weight_kg} kg
                  </span>
                )}
              </div>

              {selectedPhoto.notes && (
                <p className="text-slate-400 italic text-[11px]">
                  &ldquo;{selectedPhoto.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
