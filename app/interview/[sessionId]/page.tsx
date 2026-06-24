"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import type { Session, ChatMessage as ChatMessageType } from "@/types";
import { SCENARIO_LABELS, DIFFICULTY_LABELS } from "@/types";

// ── Mic icon ──────────────────────────────────────────────────────────────────
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3Z" />
      <path d="M19 10v1a7 7 0 0 1-14 0v-1a1 1 0 1 1 2 0v1a5 5 0 0 0 10 0v-1a1 1 0 1 1 2 0Z" />
      <path d="M12 18a1 1 0 0 1 1 1v2h2a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2h2v-2a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
    </svg>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onSpeak }: { msg: ChatMessageType; onSpeak?: () => void }) {
  const isAI = msg.role === "assistant";
  return (
    <div className={`flex gap-2.5 px-4 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg,#1a56db,#0e3a9e)" }}
        >
          HR
        </div>
      )}
      <div className={`max-w-[78%] ${isAI ? "" : "items-end flex flex-col"}`}>
        {isAI && (
          <p className="text-[10px] font-semibold text-slate-400 mb-1 ml-1">Sarah — HR Director</p>
        )}
        <div
          className="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          style={
            isAI
              ? { background: "#fff", border: "1px solid #E8EDF5", color: "#1E293B", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }
              : { background: "linear-gradient(135deg,#1a56db,#1340b8)", color: "#fff", boxShadow: "0 2px 10px rgba(26,86,219,0.25)" }
          }
        >
          {msg.content}
        </div>
        {isAI && onSpeak && (
          <button
            onClick={onSpeak}
            className="mt-1 ml-1 text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor">
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
            Vorlesen
          </button>
        )}
      </div>
      {!isAI && (
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-1"
          style={{ background: "linear-gradient(135deg,#7c3aed,#5b21b6)" }}
        >
          Du
        </div>
      )}
    </div>
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingBubble() {
  return (
    <div className="flex gap-2.5 px-4 justify-start">
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: "linear-gradient(135deg,#1a56db,#0e3a9e)" }}>
        HR
      </div>
      <div className="rounded-2xl px-4 py-3 flex gap-1.5 items-center"
        style={{ background: "#fff", border: "1px solid #E8EDF5", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        {[0,1,2].map(i => (
          <span key={i} className="w-2 h-2 rounded-full bg-slate-300 animate-typing-dot"
            style={{ animationDelay: `${i*0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "talking" | "thinking" | "listening">("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [currentAiText, setCurrentAiText] = useState("");
  const [sessionInfo, setSessionInfo] = useState<Session | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Text input state
  const [textInput, setTextInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(!!SR);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentAiText]);

  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 1.0;
    utterance.onstart = () => setAvatarStatus("talking");
    utterance.onend = () => setAvatarStatus("idle");
    window.speechSynthesis.speak(utterance);
  }, []);

  // Init: start the interview
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supabase = createClient();
        const { data: session } = await supabase
          .from("sessions").select("*").eq("id", sessionId).single();
        if (cancelled) return;
        if (session) setSessionInfo(session as Session);

        const res = await fetch("/api/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        const firstMsg: ChatMessageType = { role: "assistant", content: data.message };
        setMessages([firstMsg]);
        setIsLoading(false);
        speakText(data.message);
      } catch (err: unknown) {
        console.error("Interview init error:", err);
        if (!cancelled) {
          setInitError(err instanceof Error ? err.message : "Unbekannter Fehler");
          setIsLoading(false);
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [sessionId, speakText]);

  const sendMessage = useCallback(async (text: string) => {
    if (isProcessing || !text.trim() || isEnding) return;
    setIsProcessing(true);
    setAvatarStatus("thinking");

    const userMsg: ChatMessageType = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setCurrentAiText("");

    try {
      const res = await fetch("/api/interview/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      if (!res.ok) throw new Error("Message failed");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n").filter(l => l.startsWith("data: "))) {
          try {
            const d = JSON.parse(line.slice(6));
            if (d.text) { fullText += d.text; setCurrentAiText(fullText); }
          } catch { /* incomplete chunk */ }
        }
      }

      if (fullText) {
        setMessages(prev => [...prev, { role: "assistant", content: fullText }]);
        setCurrentAiText("");
        speakText(fullText);
      } else {
        setAvatarStatus("idle");
      }
    } catch (err) {
      console.error("Message error:", err);
      setAvatarStatus("idle");
      setCurrentAiText("");
    } finally {
      setIsProcessing(false);
    }
  }, [sessionId, isProcessing, isEnding, speakText]);

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendMessage(textInput.trim());
    setTextInput("");
  };

  const toggleMic = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "de-DE";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => sendMessage(e.results[0][0].transcript);
    r.onstart = () => { setIsRecording(true); setAvatarStatus("listening"); };
    r.onend = () => { setIsRecording(false); setAvatarStatus("idle"); };
    r.onerror = () => { setIsRecording(false); setAvatarStatus("idle"); };
    recognitionRef.current = r;
    r.start();
  };

  const handleEnd = useCallback(async () => {
    if (isEnding) return;
    setIsEnding(true);
    window.speechSynthesis.cancel();
    try {
      await fetch("/api/interview/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
    } catch (err) { console.error("End error:", err); }
    router.push(`/interview/${sessionId}/analysis`);
  }, [sessionId, router, isEnding]);

  const isInputDisabled = isLoading || isEnding || isProcessing || !!initError;
  const scenarioLabel = sessionInfo ? SCENARIO_LABELS[sessionInfo.scenario_type] : "";
  const difficultyLabel = sessionInfo ? DIFFICULTY_LABELS[sessionInfo.difficulty] : "";

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: "#F0F4FF" }}>

      {/* ── HEADER ── */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 gap-3"
        style={{
          background: "rgba(255,255,255,0.97)",
          borderBottom: "1px solid #E2E8F0",
          boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
        }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors flex-shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          <span className="hidden sm:inline">Zurück</span>
        </button>

        {/* Center: avatar + info */}
        <div className="flex items-center gap-3 flex-1 min-w-0 justify-center">
          <div className="flex-shrink-0">
            {isLoading
              ? <div className="w-9 h-9 rounded-full animate-pulse" style={{ background: "#DBEAFE" }} />
              : <Avatar status={avatarStatus} size="sm" />
            }
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">Sarah — HR Director</p>
            <p className="text-[11px] text-slate-400 truncate">
              {sessionInfo ? `${scenarioLabel} · ${difficultyLabel}` : "Lädt..."}
            </p>
          </div>
        </div>

        <button
          onClick={handleEnd}
          disabled={isEnding || isLoading}
          className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg transition-all disabled:opacity-40"
          style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {isEnding ? "Endet…" : "Beenden"}
        </button>
      </header>

      {/* ── CHAT AREA ── */}
      <div className="flex-1 overflow-y-auto py-5 space-y-4" style={{ background: "#F0F4FF" }}>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center h-full pb-20">
            <div className="text-center">
              <div className="flex gap-1.5 justify-center mb-3">
                {[0,1,2].map(i => (
                  <span key={i} className="w-2.5 h-2.5 rounded-full bg-blue-300 animate-typing-dot"
                    style={{ animationDelay: `${i*0.2}s` }} />
                ))}
              </div>
              <p className="text-sm font-medium text-slate-500">Sarah bereitet sich vor…</p>
              <p className="text-xs text-slate-400 mt-1">Gespräch wird gestartet</p>
            </div>
          </div>
        )}

        {/* Error state */}
        {initError && (
          <div className="mx-4">
            <div className="rounded-2xl p-4 text-sm" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
              <p className="font-semibold text-red-700 mb-1">Gespräch konnte nicht gestartet werden</p>
              <p className="text-red-600 text-xs font-mono">{initError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: "#DC2626", color: "#fff" }}
              >
                Erneut versuchen
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg, i) => (
          <Bubble
            key={i}
            msg={msg}
            onSpeak={msg.role === "assistant" ? () => speakText(msg.content) : undefined}
          />
        ))}

        {/* Streaming bubble */}
        {currentAiText && <Bubble msg={{ role: "assistant", content: currentAiText + " ▍" }} />}

        {/* AI typing indicator */}
        {isProcessing && !currentAiText && <TypingBubble />}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT FOOTER ── */}
      {!isEnding && (
        <div
          className="flex-shrink-0 px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.98)",
            borderTop: "1px solid #E2E8F0",
            boxShadow: "0 -2px 12px rgba(0,0,0,0.04)",
          }}
        >
          <form onSubmit={handleTextSubmit} className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={e => setTextInput(e.target.value)}
                disabled={isInputDisabled}
                placeholder={isLoading ? "Warte auf Sarah…" : isProcessing ? "Sarah antwortet…" : "Nachricht schreiben…"}
                style={{
                  width: "100%",
                  padding: "11px 16px",
                  paddingRight: "48px",
                  borderRadius: "24px",
                  border: "1.5px solid #E2E8F0",
                  background: isInputDisabled ? "#F8FAFC" : "#fff",
                  fontSize: "14px",
                  color: "#0F172A",
                  outline: "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  fontFamily: "var(--font-jakarta)",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "#1a56db";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(26,86,219,0.1)";
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = "#E2E8F0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Mic button (if supported) */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleMic}
                disabled={isInputDisabled}
                title="Sprechen"
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40"
                style={{
                  background: isRecording ? "#EF4444" : "#EEF2FF",
                  color: isRecording ? "#fff" : "#1a56db",
                  border: isRecording ? "none" : "1.5px solid #C7D7FE",
                  boxShadow: isRecording ? "0 0 16px rgba(239,68,68,0.4)" : "none",
                }}
              >
                {isRecording ? <StopIcon className="w-4 h-4" /> : <MicIcon className="w-4 h-4" />}
              </button>
            )}

            {/* Send button */}
            <button
              type="submit"
              disabled={isInputDisabled || !textInput.trim()}
              className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 disabled:opacity-40"
              style={{
                background: textInput.trim() && !isInputDisabled
                  ? "linear-gradient(135deg,#1a56db,#1340b8)"
                  : "#E2E8F0",
                color: textInput.trim() && !isInputDisabled ? "#fff" : "#94A3B8",
                boxShadow: textInput.trim() && !isInputDisabled
                  ? "0 2px 10px rgba(26,86,219,0.3)"
                  : "none",
              }}
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </form>

          {isRecording && (
            <p className="text-center text-xs font-semibold text-red-500 mt-2 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Aufnahme läuft — Tippe auf Stop zum Beenden
            </p>
          )}
        </div>
      )}

      {isEnding && (
        <div className="flex-shrink-0 py-4 text-center" style={{ background: "rgba(255,255,255,0.98)", borderTop: "1px solid #E2E8F0" }}>
          <p className="text-sm font-medium text-slate-400">Gespräch wird ausgewertet…</p>
        </div>
      )}
    </div>
  );
}
