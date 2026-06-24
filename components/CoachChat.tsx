"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);
const SendIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const MaximizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
  </svg>
);
const MinimizeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
  </svg>
);

const WELCOME: Message = {
  role: "assistant",
  content: "Hallo! Ich bin **Max**, dein persönlicher Karriere-Coach ✦\n\nIch kenne deine bisherigen Gespräche, Stärken, Schwächen und offenen Aufgaben. Frag mich alles — z.B. was du als nächstes üben solltest, wie du Stressfragen meisterst, oder wie dein letztes Gespräch lief.",
};

function MessageBubble({ msg }: { msg: Message }) {
  const isAI = msg.role === "assistant";
  // Simple markdown: **bold**, newlines
  const formatted = msg.content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");

  return (
    <div className={`flex gap-2 ${isAI ? "justify-start" : "justify-end"}`}>
      {isAI && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-white"
          style={{ background: "linear-gradient(135deg,#1a56db,#1340b8)" }}>
          <SparkleIcon />
        </div>
      )}
      <div
        className="max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed"
        style={
          isAI
            ? { background: msg.error ? "#FEF2F2" : "#fff", border: `1px solid ${msg.error ? "#FECACA" : "#E8EDF5"}`, color: msg.error ? "#DC2626" : "#1E293B", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
            : { background: "linear-gradient(135deg,#1a56db,#1340b8)", color: "#fff" }
        }
        dangerouslySetInnerHTML={{ __html: formatted || '<span style="display:flex;gap:4px;padding:2px 0"><span style="width:6px;height:6px;border-radius:50%;background:#CBD5E1;animation:typing-dot 1s infinite"></span><span style="width:6px;height:6px;border-radius:50%;background:#CBD5E1;animation:typing-dot 1s .2s infinite"></span><span style="width:6px;height:6px;border-radius:50%;background:#CBD5E1;animation:typing-dot 1s .4s infinite"></span></span>' }}
      />
    </div>
  );
}

export default function CoachChat() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    // placeholder
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    const history = [...messages, userMsg]
      .filter(m => m.content) // skip empty
      .slice(1)               // skip welcome
      .slice(-12)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/coach/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      outer: while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // keep incomplete line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") break outer;
          try {
            const d = JSON.parse(raw);
            if (d.error) throw new Error(d.error);
            if (d.text) {
              accumulated += d.text;
              const snap = accumulated;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: snap };
                return copy;
              });
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Unexpected end of JSON input") {
              throw parseErr;
            }
          }
        }
      }

      // if we got nothing, show error
      if (!accumulated) {
        setMessages(prev => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: "Keine Antwort erhalten. Bitte versuche es erneut.", error: true };
          return copy;
        });
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = { role: "assistant", content: `Fehler: ${msg}`, error: true };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  // Panel dimensions
  const panelW = expanded ? "min(680px, calc(100vw - 24px))" : "360px";
  const panelH = expanded ? "min(82vh, 720px)" : "520px";

  return (
    <>
      {/* ── CHAT PANEL ── */}
      <div
        className="fixed z-50 flex flex-col"
        style={{
          bottom: "88px",
          right: "16px",
          width: open ? panelW : "0px",
          height: open ? panelH : "0px",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transform: open ? "scale(1)" : "scale(0.9)",
          transformOrigin: "bottom right",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1), height 0.25s cubic-bezier(0.4,0,0.2,1), opacity 0.2s, transform 0.2s",
          borderRadius: "20px",
          background: "#fff",
          boxShadow: "0 8px 40px rgba(26,86,219,0.18), 0 2px 16px rgba(0,0,0,0.1)",
          border: "1px solid #E2E8F0",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#1a56db,#1340b8)", color: "#fff" }}>
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <SparkleIcon />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Max — Karriere-Coach</p>
            <p className="text-[11px] text-blue-200">Kennt deine gesamte Gesprächshistorie</p>
          </div>
          <button onClick={() => setExpanded(v => !v)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors"
            title={expanded ? "Verkleinern" : "Vergrößern"}>
            {expanded ? <MinimizeIcon /> : <MaximizeIcon />}
          </button>
          <button onClick={() => setOpen(false)}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors">
            <CloseIcon />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ background: "#F8FAFF" }}>
          {messages.map((msg, i) => (
            <MessageBubble key={i} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Quick suggestions (show only when 1 message = welcome) */}
        {messages.length === 1 && (
          <div className="px-4 pb-2 flex flex-wrap gap-2" style={{ background: "#F8FAFF" }}>
            {["Was soll ich als nächstes üben?", "Was waren meine Schwächen?", "Erkläre die STAR-Methode"].map(s => (
              <button key={s} onClick={() => { setInput(s); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="text-xs px-3 py-1.5 rounded-full border transition-all hover:border-blue-400 hover:text-blue-600"
                style={{ background: "#fff", border: "1px solid #E2E8F0", color: "#64748B" }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex-shrink-0 px-3 py-3 flex gap-2 items-center"
          style={{ background: "#fff", borderTop: "1px solid #EEF2FF" }}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={streaming}
            placeholder={streaming ? "Max tippt…" : "Frage an Max stellen…"}
            style={{
              flex: 1, padding: "9px 14px", borderRadius: "20px",
              border: "1.5px solid #E2E8F0",
              background: streaming ? "#F8FAFC" : "#fff",
              fontSize: "13px", color: "#0F172A", outline: "none",
              fontFamily: "var(--font-jakarta)", transition: "border-color 0.15s",
            }}
            onFocus={e => e.currentTarget.style.borderColor = "#1a56db"}
            onBlur={e => e.currentTarget.style.borderColor = "#E2E8F0"}
          />
          <button onClick={send} disabled={streaming || !input.trim()}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-40"
            style={{
              background: input.trim() && !streaming ? "linear-gradient(135deg,#1a56db,#1340b8)" : "#E2E8F0",
              color: input.trim() && !streaming ? "#fff" : "#94A3B8",
              boxShadow: input.trim() && !streaming ? "0 2px 8px rgba(26,86,219,0.3)" : "none",
            }}>
            <SendIcon />
          </button>
        </div>
      </div>

      {/* ── FLOATING BUTTON ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
        style={{
          background: open ? "#fff" : "linear-gradient(135deg,#1a56db,#1340b8)",
          color: open ? "#1a56db" : "#fff",
          boxShadow: open ? "0 2px 12px rgba(0,0,0,0.12)" : "0 4px 20px rgba(26,86,219,0.4), 0 2px 8px rgba(0,0,0,0.15)",
          border: open ? "1.5px solid #C7D7FE" : "none",
        }}
        title="Karriere-Coach Max"
      >
        {open ? <CloseIcon /> : <SparkleIcon />}
      </button>
    </>
  );
}
