"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Check,
  RefreshCw,
  SwitchCamera,
  Timer,
  Grid3X3,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  CheckCircle2
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

  // Upload/Capture Mode: "camera" | "gallery"
  const [captureMode, setCaptureMode] = useState<"camera" | "gallery">("camera");

  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [timing, setTiming] = useState<PhotoTiming>("pre_workout");
  const [pose, setPose] = useState<PhotoPose>("front");
  const [weightKg, setWeightKg] = useState<string>(currentWeight ? String(currentWeight) : "99.5");
  const [recordedDate, setRecordedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");

  // Live Camera State
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [countdownDuration, setCountdownDuration] = useState<0 | 3 | 5>(0);
  const [activeCountdown, setActiveCountdown] = useState<number | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  // Update default weight if prop changes
  useEffect(() => {
    if (currentWeight) {
      setWeightKg(String(currentWeight));
    }
  }, [currentWeight]);

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

  // Stop camera tracks cleanly
  const stopCameraStream = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  // Start live camera stream (WebRTC)
  const startCamera = useCallback(async (facing: "user" | "environment" = cameraFacing) => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream if any
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }

    if (typeof window === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Tarayıcınız bu bağlantıda (HTTP) canlı vizör akışını desteklemiyor. '📱 Telefon Kamerasını Aç' butonuna basarak cihaz kamerasını doğrudan başlatabilirsiniz.");
      setCameraLoading(false);
      return;
    }

    try {
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (e1) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: facing },
            audio: false
          });
        } catch (e2) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        }
      }

      if (stream) {
        setCameraStream(stream);
        setCameraFacing(facing);
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let message = "Kamera başlatılamadı.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        message = "Kamera izni reddedildi. Lütfen tarayıcı ayarlarından kamera erişimine izin verin.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        message = "Cihazınızda kamera bulunamadı.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        message = "Kamera başka bir uygulama tarafından kullanılıyor olabilir.";
      } else if (err.message) {
        message = err.message;
      }
      setCameraError(message);
    } finally {
      setCameraLoading(false);
    }
  }, [cameraFacing, cameraStream]);

  // Bind camera stream to video element whenever stream changes
  useEffect(() => {
    if (videoRef.current && cameraStream && showUploadModal && captureMode === "camera") {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch((e) => console.warn("Video play error:", e));
    }
  }, [cameraStream, showUploadModal, captureMode]);

  // Attach stream when video element is ready
  useEffect(() => {
    if (showUploadModal && captureMode === "camera" && !previewUrl && !cameraStream && !cameraError) {
      startCamera(cameraFacing);
    }
  }, [showUploadModal, captureMode, previewUrl, cameraStream, cameraError, cameraFacing, startCamera]);

  // Cleanup camera stream when modal closes or unmounts
  useEffect(() => {
    if (!showUploadModal || previewUrl || captureMode !== "camera") {
      stopCameraStream();
    }
  }, [showUploadModal, previewUrl, captureMode, stopCameraStream]);

  // Toggle Front / Back Camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    startCamera(nextFacing);
  };

  // Detect if running on a mobile device
  const isMobileDevice = (): boolean => {
    if (typeof navigator === "undefined") return false;
    return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      || (navigator.maxTouchPoints > 0 && /Mobi|Android/i.test(navigator.userAgent));
  };

  // Smart Camera Handler: mobile = native camera app, desktop = WebRTC viewfinder
  const handleTriggerNativeCamera = () => {
    if (isMobileDevice()) {
      // MOBILE: Create a fresh input element with capture attribute
      // This opens the native camera app directly on iOS/Android
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      // Try multiple capture attribute approaches for maximum compatibility
      input.setAttribute("capture", "environment");
      (input as any).capture = "environment";
      input.style.position = "fixed";
      input.style.top = "-9999px";
      input.style.left = "-9999px";
      input.style.opacity = "0";
      document.body.appendChild(input);

      const cleanup = () => {
        try { document.body.removeChild(input); } catch {}
      };

      input.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          setSelectedFile(file);
          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          stopCameraStream();
          setShowUploadModal(true);
        }
        cleanup();
      });

      input.addEventListener("cancel", cleanup);

      // Small delay for iOS Safari compatibility
      setTimeout(() => input.click(), 50);
    } else {
      // DESKTOP: Open WebRTC live camera viewfinder modal
      setCaptureMode("camera");
      setCameraError(null);
      setShowUploadModal(true);
    }
  };

  // Trigger Gallery Picker immediately
  const handleTriggerGalleryPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  // Capture current frame from live video stream
  const triggerCaptureSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // If user camera (selfie mode), mirror horizontally for natural preview
      if (cameraFacing === "user") {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Shutter flash effect
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 250);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = `progress_snap_${Date.now()}.jpg`;
            const file = new File([blob], fileName, { type: "image/jpeg" });
            setSelectedFile(file);
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            stopCameraStream();
          }
        },
        "image/jpeg",
        0.9
      );
    }
  };

  // Handle Shutter click with optional countdown
  const handleSnapPhoto = () => {
    if (countdownDuration > 0) {
      setActiveCountdown(countdownDuration);
      let current = countdownDuration;
      const interval = setInterval(() => {
        current -= 1;
        if (current <= 0) {
          clearInterval(interval);
          setActiveCountdown(null);
          triggerCaptureSnapshot();
        } else {
          setActiveCountdown(current);
        }
      }, 1000);
    } else {
      triggerCaptureSnapshot();
    }
  };

  // Reset captured image to take another photo
  const handleRetakePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (captureMode === "camera") {
      startCamera(cameraFacing);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      stopCameraStream();
      setShowUploadModal(true); // Open modal with preview ready
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
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
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
      alert("Lütfen bir fotoğraf çekin veya seçin.");
      return;
    }

    setIsUploading(true);
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      let finalPhotoUrl = "";

      try {
        const fileExt = selectedFile?.name?.split(".").pop() || "jpg";
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
      } else if (!finalPhotoUrl && previewUrl?.startsWith("data:")) {
        finalPhotoUrl = previewUrl;
      }

      if (!finalPhotoUrl) {
        throw new Error("Fotoğraf işlenemedi.");
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
      closeModal();
    } catch (err: any) {
      console.error("Save progress photo error:", err);
      alert("Fotoğraf kaydedilirken hata oluştu: " + (err.message || ""));
    } finally {
      setIsUploading(false);
    }
  };

  const closeModal = () => {
    stopCameraStream();
    setShowUploadModal(false);
    setSelectedFile(null);
    setPreviewUrl(null);
    setCameraError(null);
    setActiveCountdown(null);
    setNotes("");
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
    <div id="progress-photos" className="surface-card p-5 md:p-6 space-y-4 animate-fade-in scroll-mt-20">
      {/* Hidden Canvas for Frame Capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Inputs */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      {/* Native Camera Direct Trigger (Mobile Fallback) */}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        ref={nativeCameraInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

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

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* 📸 Kamera */}
          <button
            type="button"
            onClick={handleTriggerNativeCamera}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 tap-effect flex items-center gap-2"
          >
            <Camera className="w-4 h-4" /> Kamera
          </button>

          {/* 🖼️ Galeri */}
          <button
            type="button"
            onClick={handleTriggerGalleryPicker}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs tap-effect flex items-center gap-2 shadow-sm"
          >
            <ImageIcon className="w-4 h-4 text-slate-500" /> Galeri
          </button>
        </div>
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
          <Camera className="w-10 h-10 text-emerald-600/60 mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-700">
            {filterTiming === "all"
              ? "Henüz gelişim fotoğrafı yüklenmedi."
              : "Bu filtreye ait fotoğraf bulunamadı."}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            Gelişiminizi takip etmek için kameranızla fotoğraf çekin veya galeriden seçin.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleTriggerNativeCamera}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> Kamera
            </button>
            <button
              type="button"
              onClick={handleTriggerGalleryPicker}
              className="px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs tap-effect flex items-center gap-2 shadow-sm"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" /> Galeri
            </button>
          </div>
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

      {/* Main Upload / Live Camera Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-100 animate-slide-up relative my-auto max-h-[92vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 tap-effect z-30"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Gelişim & Pump Fotoğrafı
                </h3>
                <p className="text-[11px] text-slate-500">
                  Kameranızı açarak canlı çekim yapın veya galeriden görsel yükleyin.
                </p>
              </div>
            </div>

            {/* Mode Switcher Tabs */}
            {!previewUrl && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl my-3 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    handleTriggerNativeCamera();
                  }}
                  className="flex-1 py-2.5 rounded-xl transition-all tap-effect flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold shadow-sm"
                >
                  <Camera className="w-4 h-4" />
                  Kamera
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCaptureMode("gallery");
                    stopCameraStream();
                    handleTriggerGalleryPicker();
                  }}
                  className="flex-1 py-2.5 rounded-xl transition-all tap-effect flex items-center justify-center gap-2 bg-white text-slate-700 hover:text-slate-900 font-extrabold shadow-sm"
                >
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  Galeri
                </button>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              {/* Media Viewport */}
              <div className="relative">
                {/* 1. Captured Preview State */}
                {previewUrl ? (
                  <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                    <img
                      src={previewUrl}
                      alt="Önizleme"
                      className="w-full h-full object-contain"
                    />

                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-emerald-600 text-white px-2.5 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fotoğraf Hazır
                    </div>

                    {/* Retake / Change Button */}
                    <button
                      type="button"
                      onClick={handleRetakePhoto}
                      className="absolute bottom-3 right-3 px-3.5 py-1.5 bg-black/75 hover:bg-black/90 text-white rounded-xl text-xs font-bold backdrop-blur-md shadow-lg tap-effect flex items-center gap-1.5 border border-white/10"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Tekrar Çek / Değiştir
                    </button>
                  </div>
                ) : captureMode === "camera" ? (
                  /* 2. Live Camera Stream Viewport */
                  <div className="relative w-full h-64 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-800 shadow-inner">
                    {/* Shutter White Flash Effect */}
                    {shutterFlash && (
                      <div className="absolute inset-0 bg-white z-40 pointer-events-none opacity-90 animate-fade-out" />
                    )}

                    {/* Live Video Feed */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-transform ${
                        cameraFacing === "user" ? "scale-x-[-1]" : ""
                      }`}
                    />

                    {/* Loading Spinner */}
                    {cameraLoading && (
                      <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center z-20">
                        <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                        <p className="text-xs text-slate-300 font-medium">Kamera başlatılıyor...</p>
                      </div>
                    )}

                    {/* Posture Alignment Grid (3x3 Rule of Thirds) */}
                    {showGrid && !cameraError && !cameraLoading && (
                      <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-10">
                        <div className="border-r border-b border-white/20" />
                        <div className="border-r border-b border-white/20" />
                        <div className="border-b border-white/20" />
                        <div className="border-r border-b border-white/20" />
                        <div className="border-r border-b border-white/20" />
                        <div className="border-b border-white/20" />
                        <div className="border-r border-white/20" />
                        <div className="border-r border-white/20" />
                        <div className="" />
                      </div>
                    )}

                    {/* Active Countdown Overlay */}
                    {activeCountdown !== null && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-30 pointer-events-none">
                        <div className="text-7xl font-black text-white drop-shadow-2xl animate-ping scale-150">
                          {activeCountdown}
                        </div>
                      </div>
                    )}

                    {/* Camera Control Overlays (Top Bar) */}
                    {!cameraError && !cameraLoading && (
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                        {/* Countdown Timer Selector */}
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-xl border border-white/10 text-[10px] font-bold text-white">
                          <button
                            type="button"
                            onClick={() => setCountdownDuration(0)}
                            className={`px-2 py-0.5 rounded-lg transition-colors ${
                              countdownDuration === 0 ? "bg-emerald-600" : "hover:bg-white/20"
                            }`}
                          >
                            Anlık
                          </button>
                          <button
                            type="button"
                            onClick={() => setCountdownDuration(3)}
                            className={`px-2 py-0.5 rounded-lg transition-colors ${
                              countdownDuration === 3 ? "bg-emerald-600" : "hover:bg-white/20"
                            }`}
                          >
                            3s
                          </button>
                          <button
                            type="button"
                            onClick={() => setCountdownDuration(5)}
                            className={`px-2 py-0.5 rounded-lg transition-colors ${
                              countdownDuration === 5 ? "bg-emerald-600" : "hover:bg-white/20"
                            }`}
                          >
                            5s
                          </button>
                        </div>

                        {/* Grid & Flip Camera Buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setShowGrid(!showGrid)}
                            title="Hizalama Kılavuzu"
                            className={`p-2 rounded-xl backdrop-blur-md border border-white/10 text-white transition-colors tap-effect ${
                              showGrid ? "bg-emerald-600" : "bg-black/50 hover:bg-black/70"
                            }`}
                          >
                            <Grid3X3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={toggleCameraFacing}
                            title="Ön / Arka Kamera Değiştir"
                            className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md border border-white/10 text-white transition-colors tap-effect"
                          >
                            <SwitchCamera className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Camera Control Overlays (Bottom Shutter Bar) */}
                    {!cameraError && !cameraLoading && (
                      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center z-20">
                        <button
                          type="button"
                          onClick={handleSnapPhoto}
                          disabled={activeCountdown !== null}
                          className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md p-1 border-2 border-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                        >
                          <div className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-white shadow-inner">
                            <Camera className="w-6 h-6" />
                          </div>
                        </button>
                      </div>
                    )}

                    {/* Camera Error / Permission Fallback View */}
                    {cameraError && (
                      <div className="absolute inset-0 bg-slate-900 p-5 flex flex-col items-center justify-center text-center z-20">
                        <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
                        <h4 className="text-sm font-bold text-white mb-1">
                          Kameraya Bağlanılamadı
                        </h4>
                        <p className="text-xs text-slate-300 max-w-xs mb-4">
                          {cameraError}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <button
                            type="button"
                            onClick={() => nativeCameraInputRef.current?.click()}
                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center justify-center gap-1.5"
                          >
                            <Camera className="w-4 h-4" /> Cihaz Kamerasını Aç (Sistem)
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs tap-effect flex items-center justify-center gap-1.5"
                          >
                            <ImageIcon className="w-4 h-4" /> Galeriden Seç
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 3. Gallery / File Upload View */
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-44 sm:h-52 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-emerald-500 flex flex-col items-center justify-center p-4 cursor-pointer tap-effect transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 group-hover:bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2 transition-colors">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Galeriden Fotoğraf Seç veya Sürükle
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      JPG, PNG, WEBP veya HEIC formatları
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="px-3 py-1 bg-white rounded-lg border border-slate-200 text-slate-700 font-semibold text-[11px] shadow-2xs">
                        Dosya Araştır
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          nativeCameraInputRef.current?.click();
                        }}
                        className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 text-emerald-800 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3 text-emerald-600" /> Kamerayı Aç
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Timing Selection (Pre vs Post Workout) */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  Çekim Durumu *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTiming("pre_workout")}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all tap-effect flex flex-col items-start ${
                      timing === "pre_workout"
                        ? "bg-cyan-50 border-cyan-500 text-cyan-900 shadow-xs"
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
                        ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
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
                  >
                  </input>
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
                  placeholder="Göğüs & kol pump, iyi aydınlatma..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 tap-effect"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!selectedFile && !previewUrl)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  {isUploading ? "Kaydediliyor..." : "Fotoğrafı Kaydet"}
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

