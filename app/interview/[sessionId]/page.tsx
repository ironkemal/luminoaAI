"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";
import VoiceRecorder from "@/components/VoiceRecorder";
import ChatMessage from "@/components/ChatMessage";
import type { Session, ChatMessage as ChatMessageType } from "@/types";
import { SCENARIO_LABELS, DIFFICULTY_LABELS } from "@/types";

export default function InterviewPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [avatarStatus, setAvatarStatus] = useState<
    "idle" | "talking" | "thinking" | "listening"
  >("idle");
  const [isLoading, setIsLoading] = useState(true);
  const [currentAiText, setCurrentAiText] = useState("");
  const [sessionInfo, setSessionInfo] = useState<Session | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentAiText, scrollToBottom]);

  // TTS helper
  const speakText = useCallback((text: string) => {
    if (typeof window === "undefined") return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onstart = () => setAvatarStatus("talking");
    utterance.onend = () => setAvatarStatus("idle");
    window.speechSynthesis.speak(utterance);
  }, []);

  // Initialize session
  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const supabase = createClient();

        // 1. Fetch session info
        const { data: session } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

        if (cancelled) return;
        if (session) setSessionInfo(session as Session);

        // 2. Start the interview
        const res = await fetch("/api/interview/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!res.ok) throw new Error("Start failed");
        const data = await res.json();

        if (cancelled) return;

        const firstMessage: ChatMessageType = {
          role: "assistant",
          content: data.message,
        };

        setMessages([firstMessage]);
        setIsLoading(false);

        // 3. Speak the first message
        speakText(data.message);
      } catch (err) {
        console.error("Interview init error:", err);
        if (!cancelled) setIsLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [sessionId, speakText]);

  // Handle user message
  const handleUserMessage = useCallback(
    async (text: string) => {
      if (isProcessingRef.current || !text.trim()) return;
      isProcessingRef.current = true;

      // 1. Add user message
      const userMsg: ChatMessageType = { role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setAvatarStatus("thinking");
      setCurrentAiText("");

      try {
        // 2. POST to SSE stream
        const response = await fetch("/api/interview/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, message: text }),
        });

        if (!response.ok) throw new Error("Message failed");

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        // 3. Stream reading
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                fullText += data.text;
                setCurrentAiText(fullText);
                setAvatarStatus("thinking");
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }

        // 4. Commit full message to messages list
        if (fullText) {
          const aiMsg: ChatMessageType = { role: "assistant", content: fullText };
          setMessages((prev) => [...prev, aiMsg]);
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
        isProcessingRef.current = false;
      }
    },
    [sessionId, speakText]
  );

  // End interview
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
    } catch (err) {
      console.error("End error:", err);
    }

    router.push(`/interview/${sessionId}/analysis`);
  }, [sessionId, router, isEnding]);

  const isDisabled =
    isLoading || isEnding || avatarStatus === "talking" || isProcessingRef.current;

  const scenarioLabel = sessionInfo
    ? SCENARIO_LABELS[sessionInfo.scenario_type]
    : "";

  const difficultyLabel = sessionInfo
    ? DIFFICULTY_LABELS[sessionInfo.difficulty]
    : "";

  return (
    <div className="flex flex-col h-dvh bg-slate-950 text-slate-100 overflow-hidden">

      {/* ── HEADER ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm font-mono"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
          Zurück
        </button>

        <div className="flex flex-col items-center">
          {sessionInfo ? (
            <>
              <span className="text-xs font-mono text-slate-300 font-semibold tracking-wide">
                {sessionInfo.company_name ?? "Lumino AI"} — {scenarioLabel}
              </span>
              <span className="text-[10px] font-mono text-slate-500 tracking-widest uppercase">
                {difficultyLabel}
              </span>
            </>
          ) : (
            <span className="text-xs font-mono text-slate-400">Lädt...</span>
          )}
        </div>

        <button
          onClick={handleEnd}
          disabled={isEnding}
          className="flex items-center gap-1.5 bg-red-950/70 border border-red-800/60 hover:bg-red-900/80 disabled:opacity-50 text-red-300 hover:text-red-200 transition-all text-xs font-mono px-3 py-1.5 rounded-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM8.28 7.22a.75.75 0 0 0-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 1 0 1.06 1.06L10 11.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L11.06 10l1.72-1.72a.75.75 0 0 0-1.06-1.06L10 8.94 8.28 7.22Z" clipRule="evenodd" />
          </svg>
          {isEnding ? "Beendet..." : "Beenden"}
        </button>
      </header>

      {/* ── AVATAR SECTION ── */}
      <div className="flex-shrink-0 flex flex-col items-center pt-6 pb-4 gap-1 border-b border-slate-800/40 bg-gradient-to-b from-slate-900/60 to-transparent">
        {isLoading ? (
          <div className="w-32 h-32 rounded-full bg-slate-800 border-2 border-slate-700 animate-pulse flex items-center justify-center">
            <span className="text-slate-600 font-mono text-xs tracking-widest">INIT</span>
          </div>
        ) : (
          <Avatar status={avatarStatus} />
        )}
        <p className="text-xs font-mono text-slate-500 tracking-wide mt-1">
          HR Director Sarah
        </p>
      </div>

      {/* ── CHAT MESSAGES ── */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3 text-slate-600">
              <div className="flex gap-1.5">
                <span className="block w-2 h-2 rounded-full bg-slate-700 animate-typing-dot typing-dot-1" />
                <span className="block w-2 h-2 rounded-full bg-slate-700 animate-typing-dot typing-dot-2" />
                <span className="block w-2 h-2 rounded-full bg-slate-700 animate-typing-dot typing-dot-3" />
              </div>
              <span className="text-xs font-mono tracking-widest">Gespräch wird vorbereitet...</span>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            message={msg}
            onSpeak={
              msg.role === "assistant"
                ? () => speakText(msg.content)
                : undefined
            }
          />
        ))}

        {/* Streaming AI message bubble */}
        {currentAiText && (
          <ChatMessage
            message={{ role: "assistant", content: currentAiText + "▍" }}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── FOOTER / VOICE RECORDER ── */}
      <footer className="flex-shrink-0 border-t border-slate-800/80 bg-slate-900/80 backdrop-blur-sm py-4 px-4 flex items-center justify-center">
        {isEnding ? (
          <p className="text-sm font-mono text-slate-500 tracking-wide">
            Gespräch wird beendet...
          </p>
        ) : (
          <VoiceRecorder
            onTranscript={handleUserMessage}
            disabled={isDisabled}
          />
        )}
      </footer>
    </div>
  );
}
