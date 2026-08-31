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
    <div className="surface-card p-5 md:p-6 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm md:text-base font-bold text-slate-900">
              {t("photosTitle")}
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("photosSubtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> {t("addPhotoBtn")}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => setFilterTiming("all")}
          className={`px-3 py-1.5 rounded-lg transition-all tap-effect ${
            filterTiming === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          {t("timingAll")} ({photos.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTiming("pre_workout")}
          className={`px-3 py-1.5 rounded-lg transition-all tap-effect flex items-center gap-1 ${
            filterTiming === "pre_workout"
              ? "bg-cyan-50 text-cyan-800 shadow-sm border border-cyan-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Snowflake className="w-3.5 h-3.5 text-cyan-600" /> {t("timingPre")}
        </button>

        <button
          type="button"
          onClick={() => setFilterTiming("post_workout")}
          className={`px-3 py-1.5 rounded-lg transition-all tap-effect flex items-center gap-1 ${
            filterTiming === "post_workout"
              ? "bg-amber-50 text-amber-800 shadow-sm border border-amber-200"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-600" /> {t("timingPost")}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
          <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">
            {filterTiming === "all"
              ? "Henüz gelişim fotoğrafı yüklenmedi."
              : "Bu filtreye ait fotoğraf bulunamadı."}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Yukarıdaki &quot;Fotoğraf Ekle&quot; butonuna basarak ilk karenizi yükleyin.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="w-full h-44 sm:h-48 overflow-hidden cursor-pointer relative bg-slate-950 flex items-center justify-center"
              >
                <img
                  src={photo.photo_url}
                  alt="Gelişim Fotoğrafı"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />

                {/* Timing Badge */}
                <div className="absolute top-2 left-2 z-10">
                  {photo.timing === "post_workout" ? (
                    <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white font-black text-[9px] flex items-center gap-0.5 shadow-sm">
                      <Flame className="w-2.5 h-2.5 fill-current" /> PUMP
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-600 text-white font-black text-[9px] flex items-center gap-0.5 shadow-sm">
                      <Snowflake className="w-2.5 h-2.5" /> SOĞUK
                    </span>
                  )}
                </div>

                <div className="absolute top-2 right-2 z-10">
                  <span className="px-1.5 py-0.5 rounded-md bg-black/70 text-white font-bold text-[9px] uppercase">
                    {photo.pose === "front" ? "Ön" : photo.pose === "side" ? "Yan" : photo.pose === "back" ? "Sırt" : "Genel"}
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">
                    {new Date(photo.recorded_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {photo.weight_kg && (
                    <div className="text-[10px] text-emerald-700 font-bold">
                      {photo.weight_kg} kg
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="p-1 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 tap-effect"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-slide-up relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 tap-effect"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-slate-900 mb-0.5 flex items-center gap-2">
              <Camera className="w-5 h-5 text-emerald-600" /> Gelişim Fotoğrafı Yükle
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Kas durumunu doğru karşılaştırmak için çekim anını belirtin.
            </p>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative w-full h-48 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Önizleme"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1 bg-black/70 hover:bg-black/90 text-white rounded-xl text-xs font-bold backdrop-blur-sm tap-effect"
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-400 flex flex-col items-center justify-center p-3 cursor-pointer tap-effect transition-colors"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-400 mb-1" />
                    <p className="text-xs font-bold text-slate-700">
                      Fotoğraf Seç veya Kamerayla Çek
                    </p>
                    <p className="text-[10px] text-slate-400">
                      JPG, PNG veya WEBP
                    </p>
                  </div>
                )}
              </div>

              {/* Timing Selection (Pre vs Post Workout) */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Çekim Durumu *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTiming("pre_workout")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all tap-effect flex flex-col items-start ${
                      timing === "pre_workout"
                        ? "bg-cyan-50 border-cyan-500 text-cyan-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
                      Soğuk (Pre-Workout)
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Antrenman öncesi, dinlenmiş
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTiming("post_workout")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all tap-effect flex flex-col items-start ${
                      timing === "post_workout"
                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs">
                      <Flame className="w-3.5 h-3.5 text-amber-600" />
                      Pump (Post-Workout)
                    </div>
                    <span className="text-[10px] text-slate-500 font-normal mt-0.5">
                      Antrenman hemen sonrası
                    </span>
                  </button>
                </div>
              </div>

              {/* Pose & Weight & Date */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Poz / Açı
                  </label>
                  <select
                    value={pose}
                    onChange={(e) => setPose(e.target.value as PhotoPose)}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="front">Ön (Front)</option>
                    <option value="side">Yan (Side)</option>
                    <option value="back">Sırt (Back)</option>
                    <option value="other">Genel / Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Kilo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="99.5"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={recordedDate}
                    onChange={(e) => setRecordedDate(e.target.value)}
                    className="w-full px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Not (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Antrenman sonrası pump..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 tap-effect"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!selectedFile && !previewUrl)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isUploading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 z-20 p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full tap-effect"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-2xl w-full flex flex-col items-center">
            <div className="max-h-[75vh] w-full flex items-center justify-center mb-3">
              <img
                src={selectedPhoto.photo_url}
                alt="Gelişim Detayı"
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />
            </div>

            <div className="w-full p-4 bg-white rounded-2xl shadow-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                {selectedPhoto.timing === "post_workout" ? (
                  <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white font-black text-[10px]">
                    PUMP
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-black text-[10px]">
                    SOĞUK
                  </span>
                )}

                <span className="font-bold text-slate-800">
                  {new Date(selectedPhoto.recorded_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </span>

                {selectedPhoto.weight_kg && (
                  <span className="font-extrabold text-emerald-700">
                    {selectedPhoto.weight_kg} kg
                  </span>
                )}
              </div>

              {selectedPhoto.notes && (
                <span className="text-slate-500 italic text-[11px] truncate max-w-xs">
                  &ldquo;{selectedPhoto.notes}&rdquo;
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
