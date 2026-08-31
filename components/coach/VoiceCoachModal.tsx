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

    const cleanText = text.replace(/[*_#`]/g, "").replace(/\[.*?\]/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "tr-TR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl p-6 md:p-8 shadow-2xl border border-white/[0.1] flex flex-col items-center animate-slide-up relative">
        {/* Close button */}
        <button
          onClick={() => {
            stopListening();
            stopSpeaking();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/[0.08] tap-effect"
        >
          <X className="w-5 h-5" />
        </button>

        {/* AI Voice Avatar Circle */}
        <div className="relative my-4">
          <div
            className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-300 ${
              isListening
                ? "bg-red-500/20 text-red-400 scale-110 border-4 border-red-500/50 shadow-2xl shadow-red-500/40 animate-pulse"
                : isSpeaking
                ? "bg-emerald-500/20 text-emerald-400 scale-105 border-4 border-emerald-500/50 shadow-2xl shadow-emerald-500/40"
                : isThinking
                ? "bg-amber-500/20 text-amber-400 animate-spin border-4 border-amber-500/50"
                : "bg-slate-950 text-slate-300 border-2 border-white/[0.1]"
            }`}
          >
            <Bot className="w-12 h-12 stroke-[2]" />
          </div>

          {isSpeaking && (
            <div className="absolute -bottom-2 inset-x-0 flex items-center justify-center gap-1">
              <span className="w-1.5 h-4 bg-emerald-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-6 bg-teal-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <span className="w-1.5 h-3 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
          )}
        </div>

        <h3 className="text-xl font-black text-white tracking-tight text-center">
          Sesli AI Antrenör (Canlı PT)
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 text-center font-medium">
          100 kg Recomp, 24.5 kg dambıl ve beslenme durumunuzu bilerek konuşur
        </p>

        {/* Status Indicator */}
        <div className="mt-3 mb-4">
          {isListening && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Sizi Dinliyor... (Konuşun)
            </span>
          )}
          {isThinking && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 animate-spin" /> Verilerinizle Düşünüyor...
            </span>
          )}
          {isSpeaking && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" /> AI Koç Konuşuyor...
            </span>
          )}
          {!isListening && !isThinking && !isSpeaking && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-950 border border-white/[0.08] text-slate-300">
              Mikrofona basıp konuşun
            </span>
          )}
        </div>

        {/* Live Transcript / Response Box */}
        <div className="w-full bg-slate-950 rounded-2xl p-4 border border-white/[0.08] min-h-[120px] max-h-[220px] overflow-y-auto text-xs text-slate-300 leading-relaxed mb-4 scrollbar-thin">
          {transcript && (
            <div className="mb-2 pb-2 border-b border-white/[0.08] text-white font-semibold">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Siz:</span>
              &ldquo;{transcript}&rdquo;
            </div>
          )}
          {coachResponse ? (
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">AI PT Yanıtı:</span>
              {coachResponse}
            </div>
          ) : !transcript ? (
            <div className="text-slate-500 text-center py-4 italic">
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
              className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-2xl tap-effect flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
            >
              <MicOff className="w-4 h-4" /> Dinlemeyi Bitir ve Sor
            </button>
          ) : (
            <button
              onClick={startListening}
              className="flex-1 py-3.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs rounded-2xl tap-effect flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30"
            >
              <Mic className="w-4 h-4 stroke-[2.5]" /> Mikrofona Basıp Konuş
            </button>
          )}

          {transcript && !isListening && (
            <button
              onClick={() => handleSendVoiceQuery()}
              className="p-3.5 bg-white hover:bg-slate-200 text-slate-950 font-black rounded-2xl tap-effect flex items-center justify-center shadow-md"
              title="Metni Gönder"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}

          {isSpeaking && (
            <button
              onClick={stopSpeaking}
              className="p-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl tap-effect flex items-center justify-center border border-white/[0.08]"
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
