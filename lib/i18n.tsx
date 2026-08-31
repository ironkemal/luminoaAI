"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "tr" | "en" | "de";

export const translations = {
  tr: {
    // Brand & Common
    brandTitle: "LuminoPT",
    brandSubtitle: "Akıllı Fitness Platformu",
    recompMode: "Recomp Modu",
    save: "Kaydet",
    cancel: "İptal",
    edit: "Düzenle",
    delete: "Sil",
    close: "Kapat",
    start: "Başla",
    finish: "Bitir",
    logout: "Çıkış Yap / Hesap Değiştir",

    // Navigation
    navWorkout: "Antrenman",
    navMetrics: "Ölçüm & Kilo",
    navRoutines: "Programlar",
    navCoach: "Harun Hoca",

    // Auth / PinLockScreen
    loginTab: "Giriş Yap",
    registerTab: "Yeni Hesap Aç",
    loginTitle: "Lumino Smart PT",
    loginSubtitle: "Kişisel ve Çok Kullanıcılı Fitness Platformu",
    usernameLabel: "Kullanıcı Adı (ID)",
    usernamePlaceholder: "Kullanıcı adınız",
    passwordLabel: "Şifre",
    passwordPlaceholder: "••••",
    loginButton: "Giriş Yap",
    loggingIn: "Giriş Yapılıyor...",
    noAccountHint: "Hesabınız yoksa üstteki 'Yeni Hesap Aç' sekmesine tıklayın.",
    invitationPinLabel: "Davetiye Kodu (PIN) *",
    invitationPinPlaceholder: "4 haneli PIN",
    displayNameLabel: "İsim / Görünen Ad",
    displayNamePlaceholder: "Örn: Ahmet",
    registerButton: "Hesap Oluştur ve Başla",
    registering: "Hesap Oluşturuluyor...",
    registerBadge: "Kayıt olmak için size verilen özel davetiye PIN kodunu girin.",
    invalidPinError: "Hatalı Davetiye Kodu! Lütfen geçerli bir PIN girin.",
    userNotFound: "Kullanıcı bulunamadı. Lütfen kayıt olun.",
    wrongPassword: "Hatalı şifre!",

    // Dashboard & Rotating Queue
    queueTitle: "Dinamik Döngü Antrenmanı",
    nextWorkout: "Sıradaki Antrenman",
    lastWorkoutDone: "Son Antrenman",
    hoursAgo: "saat önce",
    recoveryFresh: "Tamamen Dinlenmiş (Hazır)",
    recoveryRecovering: "Toparlanma Aşamasında",
    recoveryReady: "Antrenmana Hazır",
    startWorkout: "Antrenmanı Başlat",
    continueWorkout: "Antrenmana Devam Et",
    cycleOrder: "Döngü Sırası",
    exercisesCount: "Egzersiz",

    // Workout Player
    restTimer: "Dinlenme Sayacı",
    skipRest: "Dinlenmeyi Atla",
    nextSet: "Sonraki Sete Geç",
    set: "Set",
    targetWeight: "Hedef Ağırlık",
    targetReps: "Hedef Tekrar",
    restTime: "Dinlenme",
    weightKg: "Ağırlık (kg)",
    reps: "Tekrar (Reps)",
    completeSet: "Seti Tamamla ve Sayacı Başlat",
    completedSets: "Tamamlanan Setler",
    prevExercise: "Önceki Egzersiz",
    nextExercise: "Sonraki Egzersiz",
    formGuideBtn: "Nasıl Yapılır? (Görsel & Video Rehberi)",
    liveAnimation: "Canlı Form Animasyonu",
    hideAnimation: "Animasyonu Gizle",
    showAnimation: "Animasyonu Göster",
    maximize: "Büyüt",
    finishWorkoutTitle: "Harika İş! Antrenmanı Tamamla",
    finishWorkoutDesc: "Toplam set başarıyla tamamlandı.",
    rpeLabel: "Genel Zorluk Derecesi (RPE: 1 - 10)",
    sessionNotesLabel: "Antrenman Notu (İsteğe Bağlı)",
    sessionNotesPlaceholder: "Örn: Shoulder press çok güçlü hissettirdi...",
    saveAndFinish: "Kaydet ve Bitir",
    saving: "Kaydediliyor...",
    exitConfirm: "Antrenmandan çıkmak istediğinize emin misiniz? Kaydedilmemiş setler kaybolacaktır.",

    // Visual Guide Modal
    liveGifTab: "▶ Canlı GIF Animasyon",
    photoTab: "Fotoğraf",
    workingMuscles: "Çalışan Ana ve Yardımcı Kaslar",
    instructionsTitle: "Hareketin Yapılışı",
    formCuesTitle: "Doğru Form ve Püf Noktaları",
    mistakesTitle: "Yapılan Yaygın Hatalar",
    watchYoutube: "YouTube Video Form Rehberini İzle",

    // Metrics
    metricsTitle: "Vücut Kompozisyonu ve Tartım",
    metricsSubtitle: "Su dalgalanmalarını filtreleyen 7 günlük hareketli ortalama",
    newMetricBtn: "Yeni Ölçüm / Tartım",
    movingAvg7d: "7G Hareketli Ort.",
    waist: "Bel Çevresi",
    arm: "Kol (Pazı)",
    chest: "Göğüs",
    weight: "Kilo",
    history: "Ölçüm Geçmişi",
    noMetrics: "Henüz kayıtlı ölçüm bulunmuyor.",
    date: "Tarih",
    notes: "Not",
    action: "İşlem",

    // Routine Manager
    routinesTitle: "Program & Egzersiz Yönetimi",
    routinesSubtitle: "Dinamik döngü rutinleri, 24.5kg dambıl hedefleri ve canlı form rehberleri",
    startThisRoutine: "Bu Rutini Başlat",
    libraryTitle: "Canlı Hareketli Egzersiz Kütüphanesi",
    all: "Tümü",
    details: "Form Detayları →",

    // AI Coach Harun
    coachTitle: "Harun Hoca • Baş Antrenör",
    coachSubtitle: "Gemini Flash motoru, 24.5kg dambıl analizi ve akıllı periyodizasyon",
    tabAnalysis: "Analiz & Durum",
    tabMemory: "Karar Hafızası",
    tabChat: "Harun Hoca ile Sohbet",
    tabVoice: "Sesli Görüşme",
    tabGenerator: "Program Yazdır",
    fastMode: "Hızlı (1-2s)",
    deepMode: "Derin Düşünme",
    fastModeActive: "Hızlı Mod (1-2s)",
    deepModeActive: "Derin Düşünme Modu",
    chatHistory: "Geçmiş",
    newChat: "Yeni",
    chatSessions: "Sohbet Oturumları",
    chatSessionsDesc: "Kayıtlı AI yazışmalarınız",
    startNewChat: "Yeni Sohbet Başlat",
    savedSessions: "Geçmiş Oturumlar",
    noSavedSessions: "Kayıtlı oturum bulunmuyor.",
    syncDeviceNotice: "PC & Mobilde otomatik senkronize edilir.",
    chatInputPlaceholderFast: "Harun Hoca'ya yazın (örn: 'Naber', 'Bugün ne yapalım?')...",
    chatInputPlaceholderDeep: "Derin Düşünme modunda Harun Hoca'ya yazın (örn: 'Bana 4 haftalık periyodizasyon hazırla')...",
    voiceCall: "Sesli",
    voiceCallFull: "Sesli Görüşme",
    quickPrompt1: "💡 Bana 4 günlük yeni bir program yaz",
    quickPrompt2: "📊 Son ağırlıklarımı analiz et",
    quickPrompt3: "⚡ Omuzlara odaklanan bir split hazırla",
    quickPrompt4: "🥗 100 kg Lean Cut beslenme stratejisi",

    // Progress Photos
    photosTitle: "Gelişim Fotoğrafları & Form Karşılaştırma",
    photosSubtitle: "Antrenman öncesi soğuk vs. antrenman sonrası pump fotoğraflarınızı kaydedin",
    addPhotoBtn: "Fotoğraf Ekle",
    timingAll: "Tüm Fotoğraflar",
    timingPre: "Soğuk (Antrenman Öncesi)",
    timingPost: "Pump (Antrenman Sonrası)",
    noPhotosYet: "Henüz fotoğraf yüklenmedi.",
    uploading: "Yükleniyor...",
    photoTimingLabel: "Çekim Zamanı (Pump Etkisi)",
    preWorkoutOption: "Antrenman Öncesi (Soğuk)",
    postWorkoutOption: "Antrenman Sonrası (Pump)",
    poseLabel: "Poz Açısı",
    poseFront: "Ön",
    poseSide: "Yan",
    poseBack: "Sırt / Arka",
    poseOther: "Diğer",
    savePhotoBtn: "Fotoğrafı Kaydet",
  },
  en: {
    // Brand & Common
    brandTitle: "LuminoPT",
    brandSubtitle: "Smart Fitness Platform",
    recompMode: "Recomp Mode",
    save: "Save",
    cancel: "Cancel",
    edit: "Edit",
    delete: "Delete",
    close: "Close",
    start: "Start",
    finish: "Finish",
    logout: "Log Out / Switch Account",

    // Navigation
    navWorkout: "Workout",
    navMetrics: "Metrics & Weight",
    navRoutines: "Programs",
    navCoach: "Coach Harun",

    // Auth / PinLockScreen
    loginTab: "Log In",
    registerTab: "Sign Up",
    loginTitle: "Lumino Smart PT",
    loginSubtitle: "Personal & Multi-User Fitness Platform",
    usernameLabel: "Username (ID)",
    usernamePlaceholder: "Your username",
    passwordLabel: "Password",
    passwordPlaceholder: "••••",
    loginButton: "Log In",
    loggingIn: "Logging in...",
    noAccountHint: "Don't have an account? Click the 'Sign Up' tab above.",
    invitationPinLabel: "Invitation Code (PIN) *",
    invitationPinPlaceholder: "4-digit PIN",
    displayNameLabel: "Name / Display Name",
    displayNamePlaceholder: "e.g. Alex",
    registerButton: "Create Account & Start",
    registering: "Creating Account...",
    registerBadge: "Enter your private invitation PIN code to create an account.",
    invalidPinError: "Invalid Invitation Code! Please enter a valid PIN.",
    userNotFound: "User not found. Please sign up.",
    wrongPassword: "Incorrect password!",

    // Dashboard & Rotating Queue
    queueTitle: "Dynamic Rotating Queue",
    nextWorkout: "Next Workout",
    lastWorkoutDone: "Last Workout",
    hoursAgo: "hours ago",
    recoveryFresh: "Fully Rested (Ready)",
    recoveryRecovering: "Recovering",
    recoveryReady: "Ready for Workout",
    startWorkout: "Start Workout",
    continueWorkout: "Continue Workout",
    cycleOrder: "Cycle Order",
    exercisesCount: "Exercises",

    // Workout Player
    restTimer: "Rest Timer",
    skipRest: "Skip Rest",
    nextSet: "Next Set",
    set: "Set",
    targetWeight: "Target Weight",
    targetReps: "Target Reps",
    restTime: "Rest",
    weightKg: "Weight (kg)",
    reps: "Reps",
    completeSet: "Complete Set & Start Timer",
    completedSets: "Completed Sets",
    prevExercise: "Previous Exercise",
    nextExercise: "Next Exercise",
    formGuideBtn: "How to Perform? (Visual & Video Guide)",
    liveAnimation: "Live Form Animation",
    hideAnimation: "Hide Animation",
    showAnimation: "Show Animation",
    maximize: "Expand",
    finishWorkoutTitle: "Great Job! Finish Workout",
    finishWorkoutDesc: "All sets completed successfully.",
    rpeLabel: "Rate of Perceived Exertion (RPE: 1 - 10)",
    sessionNotesLabel: "Workout Note (Optional)",
    sessionNotesPlaceholder: "e.g. Shoulder press felt very strong...",
    saveAndFinish: "Save & Finish",
    saving: "Saving...",
    exitConfirm: "Are you sure you want to exit? Unsaved sets will be lost.",

    // Visual Guide Modal
    liveGifTab: "▶ Live GIF Animation",
    photoTab: "Photo",
    workingMuscles: "Target & Synergist Muscles",
    instructionsTitle: "Execution Instructions",
    formCuesTitle: "Proper Form & Key Cues",
    mistakesTitle: "Common Mistakes to Avoid",
    watchYoutube: "Watch YouTube Video Guide",

    // Metrics
    metricsTitle: "Body Composition & Weigh-in",
    metricsSubtitle: "7-day moving average filtering water fluctuations",
    newMetricBtn: "New Weigh-in / Metric",
    movingAvg7d: "7D Moving Avg",
    waist: "Waist Circumference",
    arm: "Arm (Biceps/Triceps)",
    chest: "Chest",
    weight: "Weight",
    history: "Measurement History",
    noMetrics: "No measurements recorded yet.",
    date: "Date",
    notes: "Note",
    action: "Action",

    // Routine Manager
    routinesTitle: "Program & Exercise Management",
    routinesSubtitle: "Dynamic rotation routines, 24.5kg dumbbell targets and live form guides",
    startThisRoutine: "Start This Routine",
    libraryTitle: "Live Animated Exercise Library",
    all: "All",
    details: "Form Details →",

    // AI Coach Harun
    coachTitle: "Coach Harun • Head Coach",
    coachSubtitle: "Powered by Gemini Flash, 24.5kg dumbbell calculus & periodization",
    tabAnalysis: "Analysis & Status",
    tabMemory: "Decision Memory",
    tabChat: "Chat with Coach Harun",
    tabVoice: "Voice PT Coach",
    tabGenerator: "Generate Program",
    fastMode: "Fast (1-2s)",
    deepMode: "Deep Reasoning",
    fastModeActive: "Fast Mode (1-2s)",
    deepModeActive: "Deep Reasoning Mode",
    chatHistory: "History",
    newChat: "New",
    chatSessions: "Chat Sessions",
    chatSessionsDesc: "Your saved AI conversations",
    startNewChat: "Start New Chat",
    savedSessions: "Past Sessions",
    noSavedSessions: "No saved sessions.",
    syncDeviceNotice: "Automatically synced across PC & Mobile.",
    chatInputPlaceholderFast: "Ask Coach Harun (e.g., 'What's the plan today?')...",
    chatInputPlaceholderDeep: "Ask Coach Harun with Deep Reasoning (e.g. 'Build a 4-week periodization')...",
    voiceCall: "Voice",
    voiceCallFull: "Voice Call",
    quickPrompt1: "💡 Write me a new 4-day program",
    quickPrompt2: "📊 Analyze my recent weights",
    quickPrompt3: "⚡ Build a shoulder-focused split",
    quickPrompt4: "🥗 Nutrition & protein strategy",

    // Progress Photos
    photosTitle: "Progress Photos & Form Comparison",
    photosSubtitle: "Track pre-workout cold vs. post-workout pump photos",
    addPhotoBtn: "Add Photo",
    timingAll: "All Photos",
    timingPre: "Cold (Pre-Workout)",
    timingPost: "Pump (Post-Workout)",
    noPhotosYet: "No photos uploaded yet.",
    uploading: "Uploading...",
    photoTimingLabel: "Capture Timing (Pump Effect)",
    preWorkoutOption: "Pre-Workout (Cold)",
    postWorkoutOption: "Post-Workout (Pump)",
    poseLabel: "Pose Angle",
    poseFront: "Front",
    poseSide: "Side",
    poseBack: "Back",
    poseOther: "Other",
    savePhotoBtn: "Save Photo",
  },
  de: {
    // Brand & Common
    brandTitle: "LuminoPT",
    brandSubtitle: "Smarte Fitness Plattform",
    recompMode: "Recomp-Modus",
    save: "Speichern",
    cancel: "Abbrechen",
    edit: "Bearbeiten",
    delete: "Löschen",
    close: "Schließen",
    start: "Starten",
    finish: "Beenden",
    logout: "Abmelden / Konto wechseln",

    // Navigation
    navWorkout: "Training",
    navMetrics: "Körper & Gewicht",
    navRoutines: "Programme",
    navCoach: "Trainer Harun",

    // Auth / PinLockScreen
    loginTab: "Anmelden",
    registerTab: "Registrieren",
    loginTitle: "Lumino Smart PT",
    loginSubtitle: "Persönliche & Multi-User Fitness-Plattform",
    usernameLabel: "Benutzername (ID)",
    usernamePlaceholder: "Dein Benutzername",
    passwordLabel: "Passwort",
    passwordPlaceholder: "••••",
    loginButton: "Anmelden",
    loggingIn: "Wird angemeldet...",
    noAccountHint: "Noch kein Konto? Klicke oben auf 'Registrieren'.",
    invitationPinLabel: "Einladungscode (PIN) *",
    invitationPinPlaceholder: "4-stelliger PIN",
    displayNameLabel: "Name / Anzeigename",
    displayNamePlaceholder: "z.B. Kemal",
    registerButton: "Konto erstellen & starten",
    registering: "Konto wird erstellt...",
    registerBadge: "Gib deinen persönlichen Einladungs-PIN ein, um dich zu registrieren.",
    invalidPinError: "Ungültiger Einladungscode! Bitte gültigen PIN eingeben.",
    userNotFound: "Benutzer nicht gefunden. Bitte registrieren.",
    wrongPassword: "Falsches Passwort!",

    // Dashboard & Rotating Queue
    queueTitle: "Dynamischer Rotations-Plan",
    nextWorkout: "Nächstes Training",
    lastWorkoutDone: "Letztes Training",
    hoursAgo: "Stunden her",
    recoveryFresh: "Vollständig erholt (Bereit)",
    recoveryRecovering: "In Erholungsphase",
    recoveryReady: "Bereit für Training",
    startWorkout: "Training starten",
    continueWorkout: "Training fortsetzen",
    cycleOrder: "Zyklus-Reihenfolge",
    exercisesCount: "Übungen",

    // Workout Player
    restTimer: "Pausen-Timer",
    skipRest: "Pause überspringen",
    nextSet: "Nächster Satz",
    set: "Satz",
    targetWeight: "Zielgewicht",
    targetReps: "Ziel-Wiederholungen",
    restTime: "Pause",
    weightKg: "Gewicht (kg)",
    reps: "Wdh (Reps)",
    completeSet: "Satz abschließen & Timer starten",
    completedSets: "Abgeschlossene Sätze",
    prevExercise: "Vorherige Übung",
    nextExercise: "Nächste Übung",
    formGuideBtn: "Richtige Ausführung? (GIF & Video)",
    liveAnimation: "Live Form-Animation",
    hideAnimation: "Animation ausblenden",
    showAnimation: "Animation anzeigen",
    maximize: "Vergrößern",
    finishWorkoutTitle: "Starke Leistung! Training beenden",
    finishWorkoutDesc: "Alle Sätze erfolgreich abgeschlossen.",
    rpeLabel: "Anstrengungsgrad (RPE: 1 - 10)",
    sessionNotesLabel: "Trainingsnotiz (Optional)",
    sessionNotesPlaceholder: "z.B. Schulterdrücken fühlte sich sehr stark an...",
    saveAndFinish: "Speichern & Beenden",
    saving: "Wird gespeichert...",
    exitConfirm: "Möchtest du das Training wirklich verlassen? Ungespeicherte Sätze gehen verloren.",

    // Visual Guide Modal
    liveGifTab: "▶ Live GIF-Animation",
    photoTab: "Foto",
    workingMuscles: "Ziel- und Hilfsmuskeln",
    instructionsTitle: "Ausführungsanleitung",
    formCuesTitle: "Richtige Technik & Tipps",
    mistakesTitle: "Häufige Fehler vermeiden",
    watchYoutube: "YouTube Video-Anleitung ansehen",

    // Metrics
    metricsTitle: "Körperzusammensetzung & Wiegen",
    metricsSubtitle: "7-Tage gleitender Durchschnitt gegen Wasserschwankungen",
    newMetricBtn: "Neuer Eintrag / Wiegen",
    movingAvg7d: "7-Tage-Durchschnitt",
    waist: "Bauchumfang",
    arm: "Armumfang (Bizeps)",
    chest: "Brustumfang",
    weight: "Gewicht",
    history: "Messverlauf",
    noMetrics: "Noch keine Messungen vorhanden.",
    date: "Datum",
    notes: "Notiz",
    action: "Aktion",

    // Routine Manager
    routinesTitle: "Programm- & Übungsverwaltung",
    routinesSubtitle: "Rotationsroutinen, 24.5kg Hantelziele und Live-Technikguides",
    startThisRoutine: "Diese Routine starten",
    libraryTitle: "Animierte Übungs-Bibliothek",
    all: "Alle",
    details: "Technik-Details →",

    // AI Coach Harun
    coachTitle: "Trainer Harun • Cheftrainer",
    coachSubtitle: "Gemini Flash-Engine, 24.5kg Hantel-Analyse & Periodisierung",
    tabAnalysis: "Analyse & Status",
    tabMemory: "Entscheidungsspeicher",
    tabChat: "Mit Trainer Harun chatten",
    tabVoice: "Sprach-PT-Coach",
    tabGenerator: "Programm generieren",
    fastMode: "Schnell (1-2s)",
    deepMode: "Tiefes Denken",
    fastModeActive: "Schnellmodus (1-2s)",
    deepModeActive: "Tiefdenken-Modus",
    chatHistory: "Verlauf",
    newChat: "Neu",
    chatSessions: "Chat-Sitzungen",
    chatSessionsDesc: "Deine gespeicherten KI-Gespräche",
    startNewChat: "Neuen Chat starten",
    savedSessions: "Vergangene Sitzungen",
    noSavedSessions: "Keine gespeicherten Sitzungen.",
    syncDeviceNotice: "Automatisch auf PC & Handy synchronisiert.",
    chatInputPlaceholderFast: "Schreibe Trainer Harun (z.B. 'Was steht heute an?')...",
    chatInputPlaceholderDeep: "Schreibe Trainer Harun im Tiefdenken-Modus (z.B. 'Erstelle 4-Wochen-Plan')...",
    voiceCall: "Sprache",
    voiceCallFull: "Sprachanruf",
    quickPrompt1: "💡 Schreibe mir einen neuen 4-Tage-Plan",
    quickPrompt2: "📊 Analysiere meine letzten Gewichte",
    quickPrompt3: "⚡ Erstelle einen Schulter-Fokus-Split",
    quickPrompt4: "🥗 Ernährungs- & Proteinstrategie",

    // Progress Photos
    photosTitle: "Fortschrittsfotos & Formvergleich",
    photosSubtitle: "Verfolge Vorher-Kalt- vs. Nachher-Pump-Fotos",
    addPhotoBtn: "Foto hinzufügen",
    timingAll: "Alle Fotos",
    timingPre: "Kalt (Vor dem Training)",
    timingPost: "Pump (Nach dem Training)",
    noPhotosYet: "Noch keine Fotos hochgeladen.",
    uploading: "Wird hochgeladen...",
    photoTimingLabel: "Aufnahmezeitpunkt (Pump-Effekt)",
    preWorkoutOption: "Vor dem Training (Kalt)",
    postWorkoutOption: "Nach dem Training (Pump)",
    poseLabel: "Posenwinkel",
    poseFront: "Vorne",
    poseSide: "Seite",
    poseBack: "Rücken / Hinten",
    poseOther: "Sonstiges",
    savePhotoBtn: "Foto speichern",
  },
};

const LANG_STORAGE_KEY = "lumino_language";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations.tr) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "tr",
  setLanguage: () => {},
  t: (key) => translations.tr[key] || String(key),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("tr");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LANG_STORAGE_KEY) as Language;
      if (stored && (stored === "tr" || stored === "en" || stored === "de")) {
        setLanguageState(stored);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    }
  };

  const t = (key: keyof typeof translations.tr): string => {
    const currentDict = translations[language] || translations.tr;
    return (currentDict as any)[key] || translations.tr[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
