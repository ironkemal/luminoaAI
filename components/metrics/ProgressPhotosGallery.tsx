"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
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
      setCameraError("Tarayıcınız bu bağlantıda (HTTP) canlı vizör akışını desteklemiyor. Aşağıdaki 'Sistem kamerası' butonuyla cihaz kamerasını doğrudan açabilirsiniz.");
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

  // Keep latest closeModal for the keyboard handler
  const closeModalRef = useRef(closeModal);
  closeModalRef.current = closeModal;

  // Overlays: lock body scroll + close on Escape
  const anyOverlayOpen = showUploadModal || !!selectedPhoto;
  useEffect(() => {
    if (!anyOverlayOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedPhoto) setSelectedPhoto(null);
      else closeModalRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [anyOverlayOpen, selectedPhoto]);

  const filteredPhotos =
    filterTiming === "all"
      ? photos
      : photos.filter((p) => p.timing === filterTiming);

  // Short tab labels: drop the parenthetical ("Soğuk (Antrenman Öncesi)" → "Soğuk")
  const shortLabel = (key: "timingPre" | "timingPost") => t(key).split(" (")[0];

  const poseLabel = (p: PhotoPose | string) =>
    p === "front" ? "Ön" : p === "side" ? "Yan" : p === "back" ? "Sırt" : "Genel";

  const timingBadge = (tm: PhotoTiming | string) =>
    tm === "post_workout" ? (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[11px] font-semibold leading-5 backdrop-blur-sm">
        <Flame className="w-3 h-3 text-amber-300" /> Pump
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[11px] font-semibold leading-5 backdrop-blur-sm">
        <Snowflake className="w-3 h-3 text-sky-300" /> Soğuk
      </span>
    );

  return (
    <section id="progress-photos" className="card space-y-4 animate-fade-in scroll-mt-20">
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="section-title flex items-start gap-2">
            <Camera className="w-[18px] h-[18px] mt-0.5 text-emerald-600 shrink-0" />
            <span className="min-w-0">{t("photosTitle")}</span>
          </h2>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
            {t("photosSubtitle")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
          <button type="button" onClick={handleTriggerNativeCamera} className="btn-primary">
            <Camera /> Kamera
          </button>
          <button type="button" onClick={handleTriggerGalleryPicker} className="btn-secondary">
            <ImageIcon className="text-slate-500" /> Galeri
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="segmented" role="tablist" aria-label="Fotoğraf filtresi">
        <button
          type="button"
          role="tab"
          aria-selected={filterTiming === "all"}
          data-active={filterTiming === "all"}
          onClick={() => setFilterTiming("all")}
          className="segmented-item"
        >
          {t("timingAll")}
          <span className="tabular-nums text-slate-400">{photos.length}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterTiming === "pre_workout"}
          data-active={filterTiming === "pre_workout"}
          onClick={() => setFilterTiming("pre_workout")}
          className="segmented-item"
          title={t("timingPre")}
        >
          <Snowflake className="w-3.5 h-3.5 text-sky-500" /> {shortLabel("timingPre")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filterTiming === "post_workout"}
          data-active={filterTiming === "post_workout"}
          onClick={() => setFilterTiming("post_workout")}
          className="segmented-item"
          title={t("timingPost")}
        >
          <Flame className="w-3.5 h-3.5 text-amber-500" /> {shortLabel("timingPost")}
        </button>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          <div className="skeleton aspect-[3/4]" />
          <div className="skeleton aspect-[3/4]" />
        </div>
      ) : filteredPhotos.length === 0 ? (
        <div className="py-8 px-4 rounded-2xl border border-dashed border-slate-200 text-center">
          <div className="w-11 h-11 mx-auto mb-3 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Camera className="w-5 h-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            {filterTiming === "all"
              ? "Henüz fotoğraf yok"
              : "Bu filtrede fotoğraf yok"}
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Gelişimini görmek için yukarıdan kamerayla çek veya galeriden seç.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filteredPhotos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-2xl bg-white border border-slate-200/80 overflow-hidden flex flex-col"
            >
              <button
                type="button"
                onClick={() => setSelectedPhoto(photo)}
                aria-label="Fotoğrafı büyüt"
                className="relative w-full aspect-[3/4] overflow-hidden bg-slate-950"
              >
                <img
                  src={photo.photo_url}
                  alt="Gelişim fotoğrafı"
                  className="w-full h-full object-cover md:group-hover:scale-[1.03] transition-transform duration-300"
                />
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between gap-1">
                  {timingBadge(photo.timing)}
                  <span className="px-1.5 py-0.5 rounded-md bg-slate-950/70 text-white text-[11px] font-semibold leading-5 backdrop-blur-sm">
                    {poseLabel(photo.pose)}
                  </span>
                </div>
              </button>

              <div className="flex items-center justify-between gap-1 pl-3 pr-1 py-1">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-800 truncate tabular-nums">
                    {new Date(photo.recorded_at).toLocaleDateString("tr-TR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </div>
                  {photo.weight_kg && (
                    <div className="text-xs text-emerald-700 font-semibold tabular-nums">
                      {photo.weight_kg} kg
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeletePhoto(photo.id)}
                  aria-label="Fotoğrafı sil"
                  className="icon-btn text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="!w-4 !h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Upload / Live Camera Sheet (portaled so it escapes the card's stacking context) */}
      {showUploadModal && createPortal(
        <>
          <div className="sheet-backdrop" onClick={closeModal} aria-hidden="true" />
          <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="photo-sheet-title">
            {/* Sticky header */}
            <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-slate-100">
              <div className="min-w-0">
                <h3 id="photo-sheet-title" className="section-title truncate">
                  Gelişim fotoğrafı
                </h3>
                <p className="text-xs text-slate-500 truncate">
                  Canlı çek veya galeriden yükle
                </p>
              </div>
              <button type="button" onClick={closeModal} aria-label="Kapat" className="icon-btn -mr-2">
                <X />
              </button>
            </div>

            <form onSubmit={handleUpload} className="flex-1 min-h-0 flex flex-col">
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Mode Switcher */}
                {!previewUrl && (
                  <div className="segmented">
                    <button
                      type="button"
                      data-active={captureMode === "camera"}
                      onClick={() => {
                        handleTriggerNativeCamera();
                      }}
                      className="segmented-item"
                    >
                      <Camera className="w-4 h-4" /> Kamera
                    </button>
                    <button
                      type="button"
                      data-active={captureMode === "gallery"}
                      onClick={() => {
                        setCaptureMode("gallery");
                        stopCameraStream();
                        handleTriggerGalleryPicker();
                      }}
                      className="segmented-item"
                    >
                      <ImageIcon className="w-4 h-4" /> Galeri
                    </button>
                  </div>
                )}

                {/* Media Viewport */}
                <div className="relative">
                  {/* 1. Captured Preview State */}
                  {previewUrl ? (
                    <div className="relative w-full h-64 sm:h-72 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
                      <img
                        src={previewUrl}
                        alt="Önizleme"
                        className="w-full h-full object-contain"
                      />

                      <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-semibold leading-5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Hazır
                      </div>

                      <button
                        type="button"
                        onClick={handleRetakePhoto}
                        className="btn btn-sm absolute bottom-3 right-3 bg-slate-950/75 text-white backdrop-blur-md hover:bg-slate-950/90"
                      >
                        <RefreshCw /> Tekrar çek
                      </button>
                    </div>
                  ) : captureMode === "camera" ? (
                    /* 2. Live Camera Stream Viewport */
                    <div className="relative w-full h-72 sm:h-80 bg-slate-950 rounded-2xl overflow-hidden flex items-center justify-center">
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
                        className={`w-full h-full object-cover ${
                          cameraFacing === "user" ? "scale-x-[-1]" : ""
                        }`}
                      />

                      {/* Loading Spinner */}
                      {cameraLoading && (
                        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center gap-2 z-20">
                          <div className="spinner w-8 h-8" />
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
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-30 pointer-events-none">
                          <div key={activeCountdown} className="text-7xl font-black text-white drop-shadow-2xl tabular-nums animate-fade-in">
                            {activeCountdown}
                          </div>
                        </div>
                      )}

                      {/* Camera Control Overlays (Top Bar) */}
                      {!cameraError && !cameraLoading && (
                        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-20">
                          {/* Countdown Timer Selector */}
                          <div className="flex items-center gap-0.5 bg-black/50 backdrop-blur-md p-1 rounded-xl text-xs font-semibold text-white">
                            {([0, 3, 5] as const).map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => setCountdownDuration(d)}
                                aria-pressed={countdownDuration === d}
                                className={`min-h-[32px] px-2.5 rounded-lg tabular-nums transition-colors ${
                                  countdownDuration === d ? "bg-emerald-600" : "hover:bg-white/20"
                                }`}
                              >
                                {d === 0 ? "Anlık" : `${d}s`}
                              </button>
                            ))}
                          </div>

                          {/* Grid & Flip Camera Buttons */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setShowGrid(!showGrid)}
                              aria-label="Hizalama kılavuzu"
                              aria-pressed={showGrid}
                              className={`w-10 h-10 flex items-center justify-center rounded-xl backdrop-blur-md text-white transition-colors tap-effect ${
                                showGrid ? "bg-emerald-600" : "bg-black/50 hover:bg-black/70"
                              }`}
                            >
                              <Grid3X3 className="w-[18px] h-[18px]" />
                            </button>

                            <button
                              type="button"
                              onClick={toggleCameraFacing}
                              aria-label="Ön / arka kamera"
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white transition-colors tap-effect"
                            >
                              <SwitchCamera className="w-[18px] h-[18px]" />
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
                            aria-label="Fotoğraf çek"
                            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md p-1 border-2 border-white flex items-center justify-center tap-effect disabled:opacity-60 shadow-xl"
                          >
                            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                              <Camera className="w-6 h-6" />
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Camera Error / Permission Fallback View */}
                      {cameraError && (
                        <div className="absolute inset-0 bg-slate-900 p-5 flex flex-col items-center justify-center text-center z-20 overflow-y-auto">
                          <AlertCircle className="w-9 h-9 text-amber-400 mb-2 shrink-0" />
                          <h4 className="text-sm font-bold text-white mb-1">
                            Kameraya bağlanılamadı
                          </h4>
                          <p className="text-xs leading-relaxed text-slate-300 max-w-xs mb-4">
                            {cameraError}
                          </p>
                          <div className="grid gap-2 w-full max-w-[16rem] sm:max-w-none sm:flex sm:justify-center">
                            <button
                              type="button"
                              onClick={() => nativeCameraInputRef.current?.click()}
                              className="btn-primary btn-sm"
                            >
                              <Camera /> Sistem kamerası
                            </button>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="btn btn-sm bg-white/10 text-white hover:bg-white/20"
                            >
                              <ImageIcon /> Galeriden seç
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 3. Gallery / File Upload View */
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-slate-200 md:hover:border-emerald-400 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-800">
                        Galeriden fotoğraf seç
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        JPG, PNG, WEBP veya HEIC
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                        <span className="btn-secondary btn-sm">Dosya seç</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            nativeCameraInputRef.current?.click();
                          }}
                          className="btn btn-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        >
                          <Camera /> Kamerayı aç
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timing Selection (Pre vs Post Workout) */}
                <div>
                  <span className="field-label">Çekim zamanı *</span>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "pre_workout", label: "Soğuk", sub: "Antrenman öncesi", Icon: Snowflake, iconCls: "text-sky-500" },
                      { value: "post_workout", label: "Pump", sub: "Antrenman sonrası", Icon: Flame, iconCls: "text-amber-500" },
                    ] as const).map(({ value, label, sub, Icon, iconCls }) => {
                      const active = timing === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setTiming(value)}
                          aria-pressed={active}
                          className={`min-h-[52px] px-3 py-2 rounded-xl border text-left tap-effect transition-colors ${
                            active
                              ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                              : "bg-white border-slate-200 md:hover:bg-slate-50"
                          }`}
                        >
                          <span className={`flex items-center gap-1.5 text-sm font-semibold ${active ? "text-emerald-900" : "text-slate-800"}`}>
                            <Icon className={`w-4 h-4 shrink-0 ${iconCls}`} /> {label}
                          </span>
                          <span className="block text-xs text-slate-500 mt-0.5 truncate">{sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pose & Weight & Date */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="min-w-0">
                    <label htmlFor="ph-pose" className="field-label">Poz</label>
                    <select
                      id="ph-pose"
                      value={pose}
                      onChange={(e) => setPose(e.target.value as PhotoPose)}
                      className="input !px-3 font-semibold"
                    >
                      <option value="front">Ön (Front)</option>
                      <option value="side">Yan (Side)</option>
                      <option value="back">Sırt (Back)</option>
                      <option value="other">Genel / Diğer</option>
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label htmlFor="ph-weight" className="field-label">Kilo (kg)</label>
                    <input
                      id="ph-weight"
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={weightKg}
                      onChange={(e) => setWeightKg(e.target.value)}
                      placeholder="99.5"
                      className="input !px-3 font-semibold tabular-nums"
                    />
                  </div>

                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <label htmlFor="ph-date" className="field-label">Tarih</label>
                    <input
                      id="ph-date"
                      type="date"
                      value={recordedDate}
                      onChange={(e) => setRecordedDate(e.target.value)}
                      className="input !px-3 font-semibold tabular-nums"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="ph-notes" className="field-label">Not (isteğe bağlı)</label>
                  <input
                    id="ph-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Göğüs & kol pump, iyi ışık..."
                    className="input"
                  />
                </div>
              </div>

              {/* Sticky footer */}
              <div className="grid grid-cols-2 gap-2 px-5 py-3 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUploading || (!selectedFile && !previewUrl)}
                  className="btn-primary"
                >
                  <Check />
                  {isUploading ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </>,
        document.body
      )}

      {/* Lightbox */}
      {selectedPhoto && createPortal(
        <div
          className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Fotoğraf detayı"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="pt-safe flex justify-end px-3 py-3 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Kapat"
              className="icon-btn text-white bg-white/10 hover:bg-white/20 hover:text-white"
            >
              <X />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center px-4">
            <img
              src={selectedPhoto.photo_url}
              alt="Gelişim detayı"
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full object-contain rounded-2xl"
            />
          </div>

          <div className="shrink-0 p-4 pb-safe" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto max-w-2xl mb-4 p-3.5 bg-white rounded-2xl">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm">
                {selectedPhoto.timing === "post_workout" ? (
                  <span className="chip-warn"><Flame className="w-3 h-3" /> Pump</span>
                ) : (
                  <span className="chip"><Snowflake className="w-3 h-3 text-sky-500" /> Soğuk</span>
                )}
                <span className="chip">{poseLabel(selectedPhoto.pose)}</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {new Date(selectedPhoto.recorded_at).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                </span>
                {selectedPhoto.weight_kg && (
                  <span className="font-bold text-emerald-700 tabular-nums">
                    {selectedPhoto.weight_kg} kg
                  </span>
                )}
              </div>
              {selectedPhoto.notes && (
                <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                  &ldquo;{selectedPhoto.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </section>
  );
}
