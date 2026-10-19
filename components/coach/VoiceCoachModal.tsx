"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, UserCheck, Send } from "lucide-react";

interface VoiceCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (text: string) => Promise<string>;
}

export default function VoiceCoachModal({
  isOpen,
  onClose,
  onSendMessage,
}: VoiceCoachModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [coachResponse, setCoachResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(true);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognitionClass();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "tr-TR";

      recognitionRef.current.onresult = (event: any) => {
        let currentText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert("Tarayıcınız ses tanıma (Speech-to-Text) özelliğini desteklemiyor. Lütfen Chrome, Edge veya Safari kullanın.");
      return;
    }
    stopSpeaking();
    setTranscript("");
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Start recognition err:", e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    // Clean markdown formatting before speaking
    const cleanText = text.replace(/[*_#`]/g, "").replace(/\[.*?\]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "tr-TR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Try to find a Turkish voice if available
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find((v) => v.lang.includes("tr"));
    if (trVoice) {
      utterance.voice = trVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSendVoiceQuery = async (queryText?: string) => {
    const textToSend = queryText || transcript;
    if (!textToSend.trim()) return;

    stopListening();
    setIsThinking(true);
    try {
      const reply = await onSendMessage(textToSend);
      setCoachResponse(reply);
      if (autoSpeak) {
        speakText(reply);
      }
    } catch (err) {
      console.error("Voice coach error:", err);
    } finally {
      setIsThinking(false);
    }
  };

  const handleClose = () => {
    stopListening();
    stopSpeaking();
    onClose();
  };

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const status = isListening
    ? { label: "Sizi dinliyor… konuşun", cls: "bg-red-50 text-red-600", icon: <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> }
    : isThinking
    ? { label: "Harun Hoca düşünüyor…", cls: "bg-slate-100 text-slate-700", icon: <span className="w-3 h-3 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" /> }
    : isSpeaking
    ? { label: "Harun Hoca konuşuyor…", cls: "bg-emerald-50 text-emerald-700", icon: <Volume2 className="w-3.5 h-3.5" /> }
    : { label: "Mikrofona basıp konuşun", cls: "bg-slate-100 text-slate-600", icon: <Mic className="w-3.5 h-3.5" /> };

  return (
    <>
      <div className="sheet-backdrop" onClick={handleClose} aria-hidden />

      <div role="dialog" aria-modal="true" aria-labelledby="voice-coach-title" className="sheet">
        {/* Grabber (mobile) */}
        <div className="sm:hidden flex justify-center pt-2.5" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-3 sm:pt-4">
          <div className="min-w-0 flex-1">
            <h3 id="voice-coach-title" className="section-title truncate">
              Sesli görüşme
            </h3>
            <p className="text-xs text-slate-500 line-clamp-2">
              Profilinizi, ekipmanlarınızı ve hedefinizi bilerek konuşur
            </p>
          </div>
          <button type="button" onClick={handleClose} aria-label="Kapat" className="icon-btn">
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
          {/* Avatar */}
          <div className="flex flex-col items-center pt-2 pb-4">
            <div className="relative">
              {(isListening || isSpeaking) && (
                <span
                  aria-hidden
                  className={`absolute inset-0 rounded-[1.75rem] animate-ping opacity-30 ${
                    isListening ? "bg-red-400" : "bg-emerald-400"
                  }`}
                />
              )}
              <div
                className={`relative w-24 h-24 rounded-[1.75rem] flex items-center justify-center transition-colors duration-200 ${
                  isListening
                    ? "bg-red-500 text-white"
                    : isSpeaking
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                <UserCheck className="w-11 h-11" />
              </div>
            </div>

            <span
              aria-live="polite"
              className={`mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${status.cls}`}
            >
              {status.icon}
              {status.label}
            </span>
          </div>

          {/* Live Transcript / Response */}
          <div className="card-muted min-h-[7.5rem] text-sm text-slate-700 leading-relaxed space-y-3">
            {transcript && (
              <div>
                <p className="eyebrow mb-0.5">Siz</p>
                <p className="font-medium text-slate-900">&ldquo;{transcript}&rdquo;</p>
              </div>
            )}
            {coachResponse ? (
              <div className={transcript ? "pt-3 border-t border-slate-200" : ""}>
                <p className="eyebrow text-emerald-600 mb-0.5">Harun Hoca</p>
                <p className="whitespace-pre-wrap">{coachResponse}</p>
              </div>
            ) : !transcript ? (
              <p className="text-slate-400 text-center py-3">
                Örnek: &ldquo;Hocam, bench presste zorlandım ne yapalım?&rdquo; veya &ldquo;Bugün antrenman sonrası ne yemeliyim?&rdquo;
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer controls */}
        <div className="flex items-center gap-2 px-4 pt-3 pb-4 border-t border-slate-100">
          {isListening ? (
            <button
              type="button"
              onClick={() => {
                stopListening();
                handleSendVoiceQuery();
              }}
              className="btn btn-lg flex-1 bg-red-600 text-white md:hover:bg-red-700"
            >
              <MicOff /> Bitir ve sor
            </button>
          ) : (
            <button type="button" onClick={startListening} className="btn-primary btn-lg flex-1">
              <Mic /> Konuşmaya başla
            </button>
          )}

          {transcript && !isListening && (
            <button
              type="button"
              onClick={() => handleSendVoiceQuery()}
              className="tap-effect shrink-0 w-[52px] h-[52px] rounded-2xl bg-slate-900 text-white flex items-center justify-center"
              aria-label="Metni Gönder"
              title="Metni Gönder"
            >
              <Send className="w-5 h-5" />
            </button>
          )}

          {isSpeaking && (
            <button
              type="button"
              onClick={stopSpeaking}
              className="tap-effect shrink-0 w-[52px] h-[52px] rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center"
              aria-label="Sesi Durdur"
              title="Sesi Durdur"
            >
              <VolumeX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
