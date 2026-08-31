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
    <div className="surface-card p-5 space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#E2F952]" />
            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
              Gelişim Fotoğrafları
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            Soğuk (Antrenman Öncesi) vs. Pump (Antrenman Sonrası) fotoğraflarınız.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowUploadModal(true)}
          className="px-3.5 py-1.5 rounded-xl btn-primary text-xs tap-effect flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Fotoğraf Ekle
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-[#090B0E] p-1 rounded-xl border border-white/[0.06] w-fit text-xs font-bold">
        <button
          type="button"
          onClick={() => setFilterTiming("all")}
          className={`px-3 py-1 rounded-lg transition-all tap-effect ${
            filterTiming === "all"
              ? "bg-white/[0.12] text-white"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Tümü ({photos.length})
        </button>

        <button
          type="button"
          onClick={() => setFilterTiming("pre_workout")}
          className={`px-3 py-1 rounded-lg transition-all tap-effect flex items-center gap-1 ${
            filterTiming === "pre_workout"
              ? "bg-cyan-500/20 text-cyan-300 font-black"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Snowflake className="w-3 h-3" /> Soğuk (Pre-Workout)
        </button>

        <button
          type="button"
          onClick={() => setFilterTiming("post_workout")}
          className={`px-3 py-1 rounded-lg transition-all tap-effect flex items-center gap-1 ${
            filterTiming === "post_workout"
              ? "bg-[#FF6B4A]/20 text-[#FF6B4A] font-black"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Flame className="w-3 h-3" /> Pump (Post-Workout)
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="py-10 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-white/20 border-t-[#E2F952] rounded-full animate-spin"></div>
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="p-6 rounded-xl bg-[#090B0E] border border-dashed border-white/[0.06] text-center">
          <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-400">
            {filterTiming === "all"
              ? "Henüz gelişim fotoğrafı yüklenmedi."
              : "Bu filtreye ait fotoğraf bulunamadı."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl bg-[#090B0E] border border-white/[0.06] overflow-hidden flex flex-col justify-between"
            >
              <div
                onClick={() => setSelectedPhoto(photo)}
                className="w-full h-40 sm:h-48 overflow-hidden cursor-pointer relative bg-black flex items-center justify-center"
              >
                <img
                  src={photo.photo_url}
                  alt="Gelişim Fotoğrafı"
                  className="w-full h-full object-cover"
                />

                {/* Timing Badge */}
                <div className="absolute top-2 left-2 z-10">
                  {photo.timing === "post_workout" ? (
                    <span className="px-2 py-0.5 rounded-md bg-[#FF6B4A] text-black font-black text-[9px] flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-current" /> PUMP
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-black font-black text-[9px] flex items-center gap-0.5">
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

              <div className="p-2 bg-[#11151D] border-t border-white/[0.04] flex items-center justify-between text-[10px]">
                <div>
                  <div className="font-semibold text-white">
                    {new Date(photo.recorded_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {photo.weight_kg && (
                    <div className="text-[10px] text-[#E2F952] font-mono font-bold">
                      {photo.weight_kg} kg
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  className="p-1 text-slate-500 hover:text-red-400 rounded-md"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#11151D] rounded-2xl p-5 border border-white/[0.1] animate-slide-up relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowUploadModal(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg tap-effect"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-sm font-black text-white mb-0.5 flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#E2F952]" /> Gelişim Fotoğrafı Yükle
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Kas durumunu doğru karşılaştırmak için çekim anını seçin.
            </p>

            <form onSubmit={handleUpload} className="space-y-3.5">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                {previewUrl ? (
                  <div className="relative w-full h-48 bg-black rounded-xl overflow-hidden border border-white/[0.08] flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="Önizleme"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-2.5 py-1 bg-black/80 text-white rounded-lg text-xs font-bold tap-effect"
                    >
                      Değiştir
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 rounded-xl bg-[#090B0E] border border-dashed border-white/[0.12] hover:border-white/[0.3] flex flex-col items-center justify-center p-3 cursor-pointer tap-effect transition-colors"
                  >
                    <UploadCloud className="w-8 h-8 text-slate-500 mb-1" />
                    <p className="text-xs font-bold text-slate-300">
                      Fotoğraf Seç veya Çek
                    </p>
                    <p className="text-[10px] text-slate-500">
                      JPG, PNG, WEBP
                    </p>
                  </div>
                )}
              </div>

              {/* Timing Selection */}
              <div className="p-3 rounded-xl bg-[#090B0E] border border-white/[0.06] space-y-1.5">
                <label className="block text-xs font-bold text-white">
                  Çekim Durumu *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTiming("pre_workout")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all tap-effect flex flex-col items-start ${
                      timing === "pre_workout"
                        ? "bg-cyan-500/15 border-cyan-400 text-cyan-300"
                        : "bg-[#141822] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                      Soğuk (Pre-Workout)
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Antrenman öncesi, dinlenmiş
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTiming("post_workout")}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all tap-effect flex flex-col items-start ${
                      timing === "post_workout"
                        ? "bg-[#FF6B4A]/15 border-[#FF6B4A] text-[#FF6B4A]"
                        : "bg-[#141822] border-white/[0.06] text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-black text-xs">
                      <Flame className="w-3.5 h-3.5 text-[#FF6B4A]" />
                      Pump (Post-Workout)
                    </div>
                    <span className="text-[9px] text-slate-400 mt-0.5">
                      Antrenman hemen sonrası
                    </span>
                  </button>
                </div>
              </div>

              {/* Pose & Weight & Date */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Poz / Açı
                  </label>
                  <select
                    value={pose}
                    onChange={(e) => setPose(e.target.value as PhotoPose)}
                    className="w-full px-2 py-1.5 bg-[#090B0E] border border-white/[0.08] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#E2F952]"
                  >
                    <option value="front">Ön (Front)</option>
                    <option value="side">Yan (Side)</option>
                    <option value="back">Sırt (Back)</option>
                    <option value="other">Genel / Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Kilo (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    placeholder="99.5"
                    className="w-full px-2 py-1.5 bg-[#090B0E] border border-white/[0.08] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#E2F952]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={recordedDate}
                    onChange={(e) => setRecordedDate(e.target.value)}
                    className="w-full px-1.5 py-1.5 bg-[#090B0E] border border-white/[0.08] rounded-lg text-xs font-bold text-white focus:outline-none focus:border-[#E2F952]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 mb-1">
                  Not (İsteğe Bağlı)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Antrenman sonrası pump..."
                  className="w-full px-3 py-1.5 bg-[#090B0E] border border-white/[0.08] rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white tap-effect"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!selectedFile && !previewUrl)}
                  className="px-5 py-2 rounded-xl btn-primary text-xs tap-effect flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
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
            className="absolute top-4 right-4 z-20 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full tap-effect"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-2xl w-full flex flex-col items-center">
            <div className="max-h-[75vh] w-full flex items-center justify-center mb-3">
              <img
                src={selectedPhoto.photo_url}
                alt="Gelişim Detayı"
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>

            <div className="w-full p-3 bg-[#11151D] rounded-xl border border-white/[0.08] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {selectedPhoto.timing === "post_workout" ? (
                  <span className="px-2 py-0.5 rounded-md bg-[#FF6B4A] text-black font-black text-[10px]">
                    PUMP
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-400 text-black font-black text-[10px]">
                    SOĞUK
                  </span>
                )}

                <span className="font-semibold text-white">
                  {new Date(selectedPhoto.recorded_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </span>

                {selectedPhoto.weight_kg && (
                  <span className="font-bold text-[#E2F952] font-mono">
                    {selectedPhoto.weight_kg} kg
                  </span>
                )}
              </div>

              {selectedPhoto.notes && (
                <span className="text-slate-400 italic text-[11px] truncate max-w-xs">
                  {selectedPhoto.notes}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
