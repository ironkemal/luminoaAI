"use client";

import { useState, useRef, useEffect } from "react";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  disabled: boolean;
}

export default function VoiceRecorder({ onTranscript, disabled }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [fallbackText, setFallbackText] = useState("");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSupported(!!SpeechRecognition);
  }, []);

  function startRecording() {
    if (isRecording || disabled) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "de-DE";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }

  function handleFallbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (fallbackText.trim()) {
      onTranscript(fallbackText.trim());
      setFallbackText("");
    }
  }

  // Fallback: text input (no Web Speech API)
  if (supported === false) {
    return (
      <form onSubmit={handleFallbackSubmit} className="w-full flex gap-2 px-4">
        <input
          type="text"
          value={fallbackText}
          onChange={(e) => setFallbackText(e.target.value)}
          disabled={disabled}
          placeholder="Nachricht eingeben..."
          className="flex-1 bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(26,86,219,0.1)] disabled:bg-slate-50 disabled:text-slate-400"
        />
        <button
          type="submit"
          disabled={disabled || !fallbackText.trim()}
          className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#1a56db" }}
        >
          Senden
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Main mic button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        disabled={disabled}
        aria-label={isRecording ? "Aufnahme läuft" : "Drücken zum Sprechen"}
        className="relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-3 focus-visible:ring-blue-300"
        style={{
          background: disabled
            ? "#F1F5F9"
            : isRecording
            ? "#EF4444"
            : "#1a56db",
          color: disabled ? "#CBD5E1" : "#FFFFFF",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled
            ? "none"
            : isRecording
            ? "0 0 20px rgba(239,68,68,0.4)"
            : "0 4px 20px rgba(26,86,219,0.35)",
          transform: isRecording ? "scale(1.1)" : "scale(1)",
        }}
      >
        {/* Recording pulse ring */}
        {isRecording && (
          <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
        )}

        {/* Mic icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-7 h-7 relative z-10"
        >
          <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
          <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 1 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
          <path d="M12 18a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2a1 1 0 0 1 1-1Z" />
        </svg>
      </button>

      {/* Status label */}
      <div className="h-5 flex items-center justify-center">
        {isRecording ? (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-500">
            <span className="block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Aufnahme läuft...
          </span>
        ) : (
          !disabled && (
            <span className="text-xs text-slate-400 font-medium">
              Gedrückt halten zum Sprechen
            </span>
          )
        )}
      </div>
    </div>
  );
}
