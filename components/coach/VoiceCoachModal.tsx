"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, X, Bot, Sparkles, Send } from "lucide-react";

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col items-center animate-slide-up relative">
        {/* Close button */}
        <button
          onClick={() => {
            stopListening();
            stopSpeaking();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 tap-effect"
        >
          <X className="w-5 h-5" />
        </button>

        {/* AI Voice Avatar Circle */}
        <div className="relative my-4">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? "bg-red-50 text-red-500 scale-110 shadow-glow border-4 border-red-400 animate-pulse"
                : isSpeaking
                ? "bg-emerald-50 text-emerald-600 scale-105 border-4 border-emerald-400 shadow-glow"
                : isThinking
                ? "bg-amber-50 text-amber-500 animate-spin border-4 border-amber-300"
                : "bg-slate-50 text-slate-700 border-2 border-slate-200"
            }`}
          >
            <Bot className="w-12 h-12" />
          </div>

          {/* Sound waves indicator */}
          {isSpeaking && (
            <div className="absolute -bottom-2 inset-x-0 flex items-center justify-center gap-1">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-6 bg-emerald-600 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight text-center">
          Sesli AI Antrenör (Canlı PT)
        </h3>
        <p className="text-xs text-slate-500 mt-0.5 text-center">
          100 kg Recomp, 24.5 kg dambıl ve beslenme durumunuzu bilerek konuşur
        </p>

        {/* Status Indicator */}
        <div className="mt-3 mb-4">
          {isListening && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Sizi Dinliyor... (Konuşun)
            </span>
          )}
          {isThinking && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Verilerinizle Düşünüyor...
            </span>
          )}
          {isSpeaking && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" /> AI Koç Konuşuyor...
            </span>
          )}
          {!isListening && !isThinking && !isSpeaking && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
              Mikrofona basıp konuşun
            </span>
          )}
        </div>

        {/* Live Transcript / Response Box */}
        <div className="w-full bg-slate-50 rounded-2xl p-4 border border-slate-200/80 min-h-[120px] max-h-[220px] overflow-y-auto text-xs text-slate-700 leading-relaxed mb-4 scrollbar-thin">
          {transcript && (
            <div className="mb-2 pb-2 border-b border-slate-200 text-slate-900 font-semibold">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Siz:</span>
              &ldquo;{transcript}&rdquo;
            </div>
          )}
          {coachResponse ? (
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-0.5">AI PT Yanıtı:</span>
              {coachResponse}
            </div>
          ) : !transcript ? (
            <div className="text-slate-400 text-center py-4 italic">
              Örnek: &ldquo;Koç, dambıl bench presste 24.5 kg ile 8 tekrar yaptım, ne yapmalıyım?&rdquo; veya &ldquo;Bugün ne yemeliyim?&rdquo;
            </div>
          ) : null}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 w-full">
          {isListening ? (
            <button
              onClick={() => {
                stopListening();
                handleSendVoiceQuery();
              }}
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-2xl tap-effect flex items-center justify-center gap-2 shadow-sm"
            >
              <MicOff className="w-4 h-4" /> Dinlemeyi Bitir ve Sor
            </button>
          ) : (
            <button
              onClick={startListening}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl tap-effect flex items-center justify-center gap-2 shadow-sm"
            >
              <Mic className="w-4 h-4" /> Mikrofona Basıp Konuş
            </button>
          )}

          {transcript && !isListening && (
            <button
              onClick={() => handleSendVoiceQuery()}
              className="p-3.5 bg-slate-900 text-white rounded-2xl tap-effect flex items-center justify-center"
              title="Metni Gönder"
            >
              <Send className="w-4 h-4" />
            </button>
          )}

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-3.5 bg-slate-100 text-slate-700 rounded-2xl tap-effect flex items-center justify-center"
              title="Sesi Durdur"
            >
              <VolumeX className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
