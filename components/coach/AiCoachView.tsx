"use client";

import { useState, useEffect, useRef } from "react";
import { AiCoachLog, ChatSession, AppUser } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import VoiceCoachModal from "@/components/coach/VoiceCoachModal";
import AiProgramGeneratorModal from "@/components/coach/AiProgramGeneratorModal";
import AiMemoryTimeline from "@/components/coach/AiMemoryTimeline";
import ChatHistoryDrawer from "@/components/coach/ChatHistoryDrawer";
import {
  UserCheck,
  Sparkles,
  ArrowUpRight,
  Check,
  Send,
  RefreshCw,
  Zap,
  Flame,
  Utensils,
  CheckCircle2,
  Mic,
  CalendarDays,
  Brain,
  MessageSquare,
  History,
  Plus,
  BarChart3
} from "lucide-react";

interface AiCoachViewProps {
  initialLogs: AiCoachLog[];
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  actionProposal?: {
    type: "create_program" | "apply_overload";
    title: string;
    description?: string;
    program_data?: any;
  } | null;
  proposalApplied?: boolean;
}

export default function AiCoachView({ initialLogs }: AiCoachViewProps) {
  const { t, language } = useLanguage();
  const [logs, setLogs] = useState<AiCoachLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<"analysis" | "memory" | "chat">("chat");
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);

  // AI Thinking Mode (Fast 1-2s vs Deep Reasoning)
  const [aiMode, setAiMode] = useState<"fast" | "deep">("fast");

  // Multi-Session Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isProgramGenOpen, setIsProgramGenOpen] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessMessage, setAppliedSuccessMessage] = useState<string | null>(null);

  const defaultWelcomeMessage: ChatMessage = {
    role: "assistant",
    content:
      language === "tr"
        ? "Selam kral! Ben Harun Hocan. 💪 Salonda veya evde, ağırlıkların ve hedefin bana emanet. Aklına ne takılırsa sor, canın yeni bir split mi çekti 'Hocam bana bomba gibi bir program yaz' de, anında halledelim. Bugün ne çalışıyoruz?"
        : language === "de"
        ? "Servus Champ! Ich bin dein Trainer Harun. 💪 Dein Training, deine Gewichte und deine Ziele sind bei mir in besten Händen. Frag mich alles oder sag 'Harun, schreib mir einen killer Plan' und wir legen los. Was trainieren wir heute?"
        : "Hey champion! I'm Coach Harun. 💪 Your workouts, weights, and goals are in good hands with me. Ask me anything or tell me 'Coach, build me a killer routine' and I'll sort it out right away. What are we crushing today?",
  };

  // Active Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([defaultWelcomeMessage]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [applyingProposalIndex, setApplyingProposalIndex] = useState<number | null>(null);

  const latestLog = logs[0];

  const isValidUUID = (str?: string | null): boolean => {
    if (!str) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  };

  const generateUUID = (): string => {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // ── Load Sessions on Mount, Window Focus & User Updates ──
  useEffect(() => {
    setCurrentUser(getCurrentUser());
    fetchSessions();

    const handleFocus = () => {
      fetchSessions();
      setCurrentUser(getCurrentUser());
    };

    const handleUserUpdate = (e: any) => {
      if (e.detail) {
        setCurrentUser(e.detail);
      } else {
        setCurrentUser(getCurrentUser());
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("lumino_user_updated", handleUserUpdate);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("lumino_user_updated", handleUserUpdate);
    };
  }, []);

  const fetchSessions = async () => {
    const supabase = createClient();
    const currentUser = getCurrentUser();

    try {
      let query = supabase
        .from("chat_sessions")
        .select("*")
        .order("updated_at", { ascending: false });

      if (currentUser?.id) {
        query = query.eq("user_id", currentUser.id);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        setSessions(data as ChatSession[]);
        const latest = data[0] as ChatSession;
        setCurrentSessionId(latest.id);
        if (latest.messages && latest.messages.length > 0) {
          setMessages(latest.messages);
        }
        try {
          localStorage.setItem("lumino_chat_sessions", JSON.stringify(data));
        } catch (e) {}
      } else {
        const localSaved = localStorage.getItem("lumino_chat_sessions");
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSessions(parsed);
              setCurrentSessionId(parsed[0].id);
              if (parsed[0].messages) {
                setMessages(parsed[0].messages);
              }

              // Auto-sync existing local sessions to Supabase
              for (const s of parsed) {
                if (s.messages && s.messages.length > 0) {
                  const validId = isValidUUID(s.id) ? s.id : generateUUID();
                  supabase
                    .from("chat_sessions")
                    .upsert(
                      {
                        id: validId,
                        user_id: currentUser?.id || s.user_id || null,
                        title: s.title || "Sohbet",
                        messages: s.messages,
                        updated_at: s.updated_at || new Date().toISOString(),
                      },
                      { onConflict: "id" }
                    )
                    .then(() => {});
                }
              }
            }
          } catch (e) {
            console.warn("Parse local sessions warning:", e);
          }
        }
      }
    } catch (err) {
      console.warn("Fetch chat sessions error:", err);
    }
  };

  const saveSessionMessages = async (newMessages: ChatMessage[]) => {
    const supabase = createClient();
    const currentUser = getCurrentUser();

    const firstUserMsg = newMessages.find((m) => m.role === "user")?.content || t("newChat");
    const sessionTitle = firstUserMsg.slice(0, 32) + (firstUserMsg.length > 32 ? "..." : "");

    let activeId = currentSessionId;
    const now = new Date().toISOString();

    if (!activeId || !isValidUUID(activeId)) {
      activeId = generateUUID();
      setCurrentSessionId(activeId);
    }

    const payload = {
      id: activeId,
      user_id: currentUser?.id || null,
      title: sessionTitle,
      messages: newMessages,
      updated_at: now,
    };

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .upsert(payload, { onConflict: "id" })
        .select()
        .single();

      if (!error && data) {
        activeId = data.id;
        setCurrentSessionId(data.id);
      } else if (error) {
        console.warn("Supabase upsert note, trying fallback insert:", error);
        await supabase.from("chat_sessions").insert(payload);
      }
    } catch (err) {
      console.warn("Save session to Supabase failed, saving local:", err);
    }

    setSessions((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === activeId);
      const updatedSession: ChatSession = {
        id: activeId!,
        user_id: currentUser?.id || null,
        title: sessionTitle,
        messages: newMessages,
        created_at: existingIdx >= 0 ? prev[existingIdx].created_at : now,
        updated_at: now,
      };

      let newList: ChatSession[];
      if (existingIdx >= 0) {
        newList = [updatedSession, ...prev.filter((s) => s.id !== activeId)];
      } else {
        newList = [updatedSession, ...prev];
      }

      try {
        localStorage.setItem("lumino_chat_sessions", JSON.stringify(newList));
      } catch (e) {
        console.warn(e);
      }
      return newList;
    });
  };

  const handleStartNewSession = () => {
    setCurrentSessionId(null);
    setMessages([defaultWelcomeMessage]);
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages || [defaultWelcomeMessage]);
  };

  const handleDeleteSession = async (sessionId: string) => {
    const supabase = createClient();
    try {
      await supabase.from("chat_sessions").delete().eq("id", sessionId);
    } catch (e) {
      console.warn(e);
    }

    setSessions((prev) => {
      const updated = prev.filter((s) => s.id !== sessionId);
      try {
        localStorage.setItem("lumino_chat_sessions", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentSessionId === sessionId) {
      handleStartNewSession();
    }
  };

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setAppliedSuccessMessage(null);
    const u = currentUser || getCurrentUser();
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate",
          userId: u?.id,
          userProfile: u,
          mode: aiMode,
        }),
      });

      const data = await res.json();
      if (data.success && data.log) {
        setLogs((prev) => [data.log, ...prev]);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      alert("Değerlendirme alınırken hata oluştu.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!latestLog?.suggested_changes) return;

    setIsApplying(true);
    const u = currentUser || getCurrentUser();
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_changes",
          suggestedChanges: latestLog.suggested_changes,
          userId: u?.id,
          userProfile: u,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAppliedSuccessMessage(data.message || "Önerilen hedefler programınıza başarıyla uygulandı!");
        setLogs((prev) =>
          prev.map((l, idx) => (idx === 0 ? { ...l, applied: true } : l))
        );
      }
    } catch (err) {
      console.error("Apply changes error:", err);
      alert("Değişiklikler uygulanırken hata oluştu.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSendMessage = async (customQuery?: string, overrideMode?: "fast" | "deep"): Promise<string> => {
    const userText = customQuery || inputMessage.trim();
    if (!userText) return "";

    const activeMode = overrideMode || aiMode;

    if (!customQuery) {
      setInputMessage("");
    }
    const updatedWithUser: ChatMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(updatedWithUser);
    setIsChatSending(true);

    const u = currentUser || getCurrentUser();

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          question: userText,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userId: u?.id,
          userProfile: u,
          mode: activeMode,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Yanıt üretilemedi.";
      const actionProposal = data.action_proposal || null;

      const finalMessages: ChatMessage[] = [
        ...updatedWithUser,
        {
          role: "assistant",
          content: reply,
          actionProposal,
        },
      ];

      setMessages(finalMessages);
      saveSessionMessages(finalMessages);
      return reply;
    } catch (err) {
      console.error("Chat error:", err);
      const fallback = "Şu anda yanıt üretilemedi, lütfen tekrar deneyin.";
      const finalMessages: ChatMessage[] = [...updatedWithUser, { role: "assistant", content: fallback }];
      setMessages(finalMessages);
      saveSessionMessages(finalMessages);
      return fallback;
    } finally {
      setIsChatSending(false);
    }
  };

  const handleApplyChatProposal = async (msgIndex: number, proposal: any) => {
    setApplyingProposalIndex(msgIndex);
    const u = currentUser || getCurrentUser();

    try {
      if (proposal.type === "create_program" && proposal.program_data) {
        const res = await fetch("/api/ai-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "apply_full_program",
            generatedProgram: proposal.program_data,
            userId: u?.id,
            userProfile: u,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const updated = messages.map((m, idx) =>
            idx === msgIndex ? { ...m, proposalApplied: true } : m
          );
          const finalMessages: ChatMessage[] = [
            ...updated,
            {
              role: "assistant",
              content: `✓ ${data.message || "Yeni programınız başarıyla veritabanına yüklendi ve aktif edildi!"}`,
            },
          ];
          setMessages(finalMessages);
          saveSessionMessages(finalMessages);
          handleRunEvaluation();
        } else {
          alert(data.error || "Program yüklenirken hata oluştu.");
        }
      }
    } catch (err) {
      console.error("Apply proposal error:", err);
      alert("İşlem gerçekleştirilemedi.");
    } finally {
      setApplyingProposalIndex(null);
    }
  };

  const quickPrompts = [
    t("quickPrompt1"),
    t("quickPrompt2"),
    t("quickPrompt3"),
    t("quickPrompt4"),
  ];
  const quickPromptIcons = [Sparkles, BarChart3, Zap, Utensils];

  // Strip a leading emoji "word" from translated prompts – the chip shows a lucide icon instead.
  const stripLeadingEmoji = (text: string) => {
    const [first, ...rest] = text.split(" ");
    return rest.length > 0 && !/[A-Za-z0-9À-ɏ]/.test(first) ? rest.join(" ") : text;
  };

  // Short, human UI copy for the mobile layout (candidates for lib/i18n.tsx)
  const copy = {
    tr: {
      subtitle: "Seni tanıyan kişisel antrenörün",
      tabChat: "Sohbet",
      tabAnalysis: "Analiz",
      tabMemory: "Hafıza",
      fast: "Hızlı",
      deep: "Derin",
      newAnalysis: "Yeni analiz",
      analyzing: "Analiz ediliyor…",
      program: "Program yazdır",
      voice: "Sesli görüşme",
      history: "Sohbet geçmişi",
      modeLabel: "Düşünme modu",
      send: "Gönder",
    },
    en: {
      subtitle: "The personal trainer who knows you",
      tabChat: "Chat",
      tabAnalysis: "Analysis",
      tabMemory: "Memory",
      fast: "Fast",
      deep: "Deep",
      newAnalysis: "New analysis",
      analyzing: "Analyzing…",
      program: "Build plan",
      voice: "Voice call",
      history: "Chat history",
      modeLabel: "Thinking mode",
      send: "Send",
    },
    de: {
      subtitle: "Dein Personal Trainer, der dich kennt",
      tabChat: "Chat",
      tabAnalysis: "Analyse",
      tabMemory: "Gedächtnis",
      fast: "Schnell",
      deep: "Tief",
      newAnalysis: "Neue Analyse",
      analyzing: "Analysiere…",
      program: "Plan erstellen",
      voice: "Sprachanruf",
      history: "Chatverlauf",
      modeLabel: "Denkmodus",
      send: "Senden",
    },
  }[language === "en" || language === "de" ? language : "tr"];

  const coachName = t("coachTitle").split("•")[0].trim();
  const dateLocale = language === "tr" ? "tr-TR" : language === "de" ? "de-DE" : "en-US";

  // Keep the newest message in view
  const messagesRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isChatSending, activeTab]);

  const tabs = [
    { id: "chat" as const, label: copy.tabChat, icon: MessageSquare },
    { id: "analysis" as const, label: copy.tabAnalysis, icon: Sparkles },
    { id: "memory" as const, label: copy.tabMemory, icon: Brain },
  ];

  const hasDraft = inputMessage.trim().length > 0;

  return (
    <div className="space-y-4">
      {/* Header: identity + chat actions */}
      <header className="flex items-center gap-3 min-h-[2.75rem]">
        <div className="relative shrink-0 w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-900/10">
          <UserCheck className="w-5 h-5" />
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-[#F6F7F5]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg md:text-xl font-extrabold tracking-tight text-slate-900 leading-tight truncate">
            {coachName}
          </h1>
          <p className="text-xs text-slate-500 truncate">{copy.subtitle}</p>
        </div>

        {activeTab === "chat" && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleStartNewSession}
              aria-label={t("startNewChat")}
              title={t("startNewChat")}
              className="icon-btn"
            >
              <Plus />
            </button>
            <button
              type="button"
              onClick={() => setIsHistoryDrawerOpen(true)}
              aria-label={`${copy.history} (${sessions.length})`}
              title={t("chatSessions")}
              className="icon-btn relative"
            >
              <History />
              {sessions.length > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[1.125rem] h-[1.125rem] px-1 rounded-full bg-emerald-600 text-white text-[11px] font-bold leading-[1.125rem] text-center tabular-nums ring-2 ring-[#F6F7F5]">
                  {sessions.length}
                </span>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Tabs */}
      <div className="segmented" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              data-active={active}
              onClick={() => setActiveTab(tab.id)}
              className="segmented-item"
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-emerald-600" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: SOHBET ── */}
      {activeTab === "chat" && (
        <section className="surface-card overflow-hidden flex flex-col h-[calc(100dvh-13.875rem-env(safe-area-inset-bottom)-env(safe-area-inset-top))] min-h-[24rem] md:h-[min(680px,calc(100dvh-14rem))] animate-fade-in">
          {/* Messages */}
          <div
            ref={messagesRef}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-4 sm:px-5 space-y-3"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-slate-100 text-slate-800 rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Agentic Action Proposal */}
                {msg.actionProposal && msg.actionProposal.program_data && (
                  <div className="mt-2 w-full max-w-[92%] sm:max-w-[80%] rounded-2xl border border-emerald-200 bg-white overflow-hidden animate-fade-in-up">
                    <div className="px-3.5 pt-3 pb-3 bg-emerald-50/70">
                      <p className="eyebrow text-emerald-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> AI Programlama
                      </p>
                      <h4 className="mt-1 text-sm font-bold text-slate-900 leading-snug">
                        {msg.actionProposal.title || "Yeni Antrenman Programı Önerisi"}
                      </h4>
                      {msg.actionProposal.description && (
                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                          {msg.actionProposal.description}
                        </p>
                      )}
                    </div>

                    {msg.actionProposal.program_data.routines && (
                      <ul className="divide-y divide-slate-100">
                        {msg.actionProposal.program_data.routines.map((r: any, rIdx: number) => (
                          <li key={rIdx} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                            <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                              {r.sequence_order}. {r.name}
                            </span>
                            <span className="shrink-0 text-xs text-slate-500 tabular-nums">
                              {r.exercises?.length || 0} Egzersiz
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="p-3 border-t border-slate-100">
                      {msg.proposalApplied ? (
                        <div className="flex items-center justify-center gap-2 min-h-[44px] rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          Program yüklendi ve aktif
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={applyingProposalIndex === idx}
                          onClick={() => handleApplyChatProposal(idx, msg.actionProposal)}
                          className="btn-primary btn-block"
                        >
                          {applyingProposalIndex === idx ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          ) : (
                            <Check />
                          )}
                          {applyingProposalIndex === idx ? "Kaydediliyor…" : "Onayla ve yükle"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isChatSending && (
              <div className="flex justify-start" aria-live="polite">
                <div className="bg-slate-100 text-slate-500 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2">
                  <span className="flex items-center gap-1" aria-hidden>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    {aiMode === "deep" ? "Derin akıl yürütme yapılıyor..." : "Harun Hoca yanıtlıyor..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="border-t border-slate-100 bg-white pt-2.5 pb-3 space-y-2.5">
            {/* Suggestion chips — intentionally a horizontal scroller */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-3 sm:px-4">
              <button
                type="button"
                onClick={() => setIsProgramGenOpen(true)}
                className="tap-effect shrink-0 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold whitespace-nowrap md:hover:bg-emerald-100"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {copy.program}
              </button>
              {quickPrompts.map((prompt, pIdx) => {
                const Icon = quickPromptIcons[pIdx] || Sparkles;
                return (
                  <button
                    key={pIdx}
                    type="button"
                    disabled={isChatSending}
                    onClick={() => handleSendMessage(prompt)}
                    className="tap-effect shrink-0 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 whitespace-nowrap disabled:opacity-50 md:hover:bg-slate-50"
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    {stripLeadingEmoji(prompt)}
                  </button>
                );
              })}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2 px-3 sm:px-4"
            >
              <button
                type="button"
                onClick={() => setAiMode(aiMode === "fast" ? "deep" : "fast")}
                aria-pressed={aiMode === "deep"}
                aria-label={`${copy.modeLabel}: ${aiMode === "deep" ? t("deepMode") : t("fastMode")}`}
                title={aiMode === "deep" ? t("deepModeActive") : t("fastModeActive")}
                className={`tap-effect shrink-0 inline-flex items-center gap-1 h-11 px-2.5 rounded-xl text-xs font-semibold transition-colors ${
                  aiMode === "deep" ? "bg-slate-900 text-white" : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {aiMode === "deep" ? <Brain className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                <span>{aiMode === "deep" ? copy.deep : copy.fast}</span>
              </button>

              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                enterKeyHint="send"
                aria-label={t("chatInputPlaceholderFast")}
                placeholder={
                  aiMode === "deep"
                    ? t("chatInputPlaceholderDeep")
                    : t("chatInputPlaceholderFast")
                }
                className="input flex-1 min-w-0 h-11 bg-slate-50 text-ellipsis"
              />

              {hasDraft || isChatSending ? (
                <button
                  type="submit"
                  disabled={!hasDraft || isChatSending}
                  aria-label={copy.send}
                  className="tap-effect shrink-0 w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shadow-emerald-900/10 disabled:opacity-50 md:hover:bg-emerald-700"
                >
                  <Send className="w-[18px] h-[18px]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsVoiceOpen(true)}
                  aria-label={copy.voice}
                  title={copy.voice}
                  className="tap-effect shrink-0 w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center md:hover:bg-slate-800"
                >
                  <Mic className="w-[18px] h-[18px]" />
                </button>
              )}
            </form>
          </div>
        </section>
      )}

      {/* ── TAB 2: GELİŞİM ANALİZİ ── */}
      {activeTab === "analysis" && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isEvaluating}
              onClick={handleRunEvaluation}
              className="btn-primary px-3"
            >
              <RefreshCw className={isEvaluating ? "animate-spin" : ""} />
              {isEvaluating ? copy.analyzing : copy.newAnalysis}
            </button>
            <button
              type="button"
              onClick={() => setIsProgramGenOpen(true)}
              className="btn-secondary px-3"
            >
              <CalendarDays />
              {copy.program}
            </button>
          </div>

          {latestLog ? (
            <article className="card space-y-5">
              <div className="flex items-start gap-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="section-title">Harun Hoca Değerlendirmesi</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-xs text-slate-500 tabular-nums">
                      {new Date(latestLog.created_at).toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {latestLog.applied ? (
                      <span className="chip-primary">
                        <CheckCircle2 className="w-3 h-3" /> Devrede
                      </span>
                    ) : (
                      <span className="chip-warn">Onay bekliyor</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Evaluation Summary */}
              <p className="text-sm text-slate-700 leading-relaxed">
                {latestLog.evaluation_summary}
              </p>

              {/* Recomp & Nutrition Assessment */}
              {latestLog.suggested_changes?.recomp_assessment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="card-muted">
                    <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Flame className="w-4 h-4 shrink-0 text-emerald-600" /> Recomposition durumu
                    </p>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {latestLog.suggested_changes.recomp_assessment.explanation}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-emerald-700 tabular-nums">
                      Tahmin: {latestLog.suggested_changes.recomp_assessment.estimated_progress}
                    </p>
                  </div>

                  {latestLog.suggested_changes?.nutrition_tip && (
                    <div className="card-muted">
                      <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                        <Utensils className="w-4 h-4 shrink-0 text-emerald-600" /> Beslenme tavsiyesi
                      </p>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {latestLog.suggested_changes.nutrition_tip}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Progressive Overload Recommendations */}
              {latestLog.suggested_changes?.recommendations &&
                latestLog.suggested_changes.recommendations.length > 0 && (
                  <div>
                    <h4 className="section-title flex items-center gap-1.5">
                      <Zap className="w-4 h-4 shrink-0 text-emerald-600" /> Progressive overload önerileri
                    </h4>

                    <ul className="mt-2 divide-y divide-slate-100">
                      {latestLog.suggested_changes.recommendations.map((rec, i) => (
                        <li
                          key={i}
                          className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{rec.exercise}</p>
                            {rec.reason && (
                              <p className="text-xs text-slate-500 mt-0.5">{rec.reason}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 tabular-nums">
                            {rec.old_val && (
                              <span className="text-sm text-slate-400 line-through">{rec.old_val}</span>
                            )}
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {rec.new_val}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>

                    {!latestLog.applied && (
                      <div className="mt-2 pt-4 border-t border-slate-100 sm:flex sm:justify-end">
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={handleApplyChanges}
                          className="btn-primary btn-block sm:w-auto"
                        >
                          <Check />
                          {isApplying ? "Uygulanıyor..." : "Programıma uygula"}
                        </button>
                      </div>
                    )}

                    {appliedSuccessMessage && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                        <span className="min-w-0">{appliedSuccessMessage}</span>
                      </div>
                    )}
                  </div>
                )}
            </article>
          ) : (
            <div className="card text-center py-10">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">Henüz değerlendirme yok</p>
              <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto">
                Harun Hoca&apos;dan ilk analizini almak için yukarıdaki &quot;{copy.newAnalysis}&quot; butonuna bas.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: AI HAFIZA DOSYASI ── */}
      {activeTab === "memory" && (
        <div className="animate-fade-in">
          <AiMemoryTimeline logs={logs} />
        </div>
      )}

      {/* Overlays (display:contents keeps them out of the space-y margin flow) */}
      <div className="contents">
      {/* Chat History Sessions Drawer */}
      <ChatHistoryDrawer
        isOpen={isHistoryDrawerOpen}
        onClose={() => setIsHistoryDrawerOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={handleStartNewSession}
        onDeleteSession={handleDeleteSession}
        onRefresh={fetchSessions}
      />

      {/* Voice Coach Modal */}
      <VoiceCoachModal
        isOpen={isVoiceOpen}
        onClose={() => setIsVoiceOpen(false)}
        onSendMessage={(text) => handleSendMessage(text)}
      />

      {/* Full AI Program Generator Modal */}
      <AiProgramGeneratorModal
        isOpen={isProgramGenOpen}
        onClose={() => setIsProgramGenOpen(false)}
        onProgramApplied={() => {
          handleRunEvaluation();
        }}
      />
      </div>
    </div>
  );
}
