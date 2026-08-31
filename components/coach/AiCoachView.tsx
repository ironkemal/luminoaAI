"use client";

import { useState } from "react";
import { AiCoachLog } from "@/types";
import { getCurrentUser } from "@/lib/auth-pin";
import { useLanguage } from "@/lib/i18n";
import VoiceCoachModal from "@/components/coach/VoiceCoachModal";
import AiProgramGeneratorModal from "@/components/coach/AiProgramGeneratorModal";
import AiMemoryTimeline from "@/components/coach/AiMemoryTimeline";
import {
  Bot,
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
  PlusCircle,
  Dumbbell
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
  const { t } = useLanguage();
  const [logs, setLogs] = useState<AiCoachLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<"analysis" | "memory" | "chat">("chat");

  // AI Thinking Mode (Fast 1-2s vs Deep Reasoning)
  const [aiMode, setAiMode] = useState<"fast" | "deep">("fast");

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isProgramGenOpen, setIsProgramGenOpen] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessMessage, setAppliedSuccessMessage] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Merhaba! Ben Lumino AI Baş Antrenörünüzüm. 100 kg Lean Cut sürecinizi, 24.5 kg dambıl antrenmanlarınızı ve beslenmenizi analiz ediyorum. Bana dilediğinizi yazabilirsiniz. Örneğin 'bana yeni bir program yaz' derseniz sizin için sıfırdan komple bir döngü programı oluşturup veritabanınıza yükleyebilirim!",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);
  const [applyingProposalIndex, setApplyingProposalIndex] = useState<number | null>(null);

  const latestLog = logs[0];

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setAppliedSuccessMessage(null);
    const currentUser = getCurrentUser();
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evaluate", userId: currentUser?.id, mode: aiMode }),
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
    const currentUser = getCurrentUser();
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_changes",
          suggestedChanges: latestLog.suggested_changes,
          userId: currentUser?.id,
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
    setMessages((prev) => [...prev, { role: "user", content: userText }]);
    setIsChatSending(true);

    const currentUser = getCurrentUser();

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          question: userText,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          userId: currentUser?.id,
          mode: activeMode,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Yanıt üretilemedi.";
      const actionProposal = data.action_proposal || null;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
          actionProposal,
        },
      ]);
      return reply;
    } catch (err) {
      console.error("Chat error:", err);
      const fallback = "Şu anda yanıt üretilemedi, lütfen tekrar deneyin.";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
      return fallback;
    } finally {
      setIsChatSending(false);
    }
  };

  const handleApplyChatProposal = async (msgIndex: number, proposal: any) => {
    setApplyingProposalIndex(msgIndex);
    const currentUser = getCurrentUser();

    try {
      if (proposal.type === "create_program" && proposal.program_data) {
        const res = await fetch("/api/ai-coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "apply_full_program",
            generatedProgram: proposal.program_data,
            userId: currentUser?.id,
          }),
        });

        const data = await res.json();
        if (data.success) {
          setMessages((prev) =>
            prev.map((m, idx) => (idx === msgIndex ? { ...m, proposalApplied: true } : m))
          );
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `✓ ${data.message || "Yeni programınız başarıyla veritabanına yüklendi ve aktif edildi!"}`,
            },
          ]);
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
    "💡 Bana 4 günlük yeni bir program yaz",
    "📊 Son ağırlıklarımı analiz et",
    "⚡ Omuzlara odaklanan bir split hazırla",
    "🥗 100 kg Lean Cut beslenme stratejisi",
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-600" />
            <span>{t("coachTitle")}</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t("coachSubtitle")}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* AI Thinking Mode Toggle Pill */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold shadow-inner">
            <button
              type="button"
              onClick={() => setAiMode("fast")}
              title="Anlık yanıtlar (1-2s)"
              className={`px-2.5 py-1.5 rounded-lg transition-all tap-effect flex items-center gap-1 ${
                aiMode === "fast"
                  ? "bg-emerald-600 text-white shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Hızlı (1-2s)</span>
            </button>

            <button
              type="button"
              onClick={() => setAiMode("deep")}
              title="Kapsamlı analiz ve derin akıl yürütme"
              className={`px-2.5 py-1.5 rounded-lg transition-all tap-effect flex items-center gap-1 ${
                aiMode === "deep"
                  ? "bg-indigo-600 text-white shadow-sm font-black"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Derin Düşünme</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            {t("tabVoice")}
          </button>

          <button
            type="button"
            onClick={() => setIsProgramGenOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {t("tabGenerator")}
          </button>

          <button
            type="button"
            disabled={isEvaluating}
            onClick={handleRunEvaluation}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm tap-effect flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
            {isEvaluating ? "Analiz Ediliyor..." : "Yeni Analiz Yap"}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-1.5 ${
            activeTab === "chat"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
          {t("tabChat")}
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-1.5 ${
            activeTab === "analysis"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          {t("tabAnalysis")}
        </button>

        <button
          onClick={() => setActiveTab("memory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-1.5 ${
            activeTab === "memory"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-indigo-500" />
          {t("tabMemory")}
        </button>
      </div>

      {/* ── TAB 1: SOHBET & AGENTIC AI ── */}
      {activeTab === "chat" && (
        <div className="surface-card p-4 md:p-6 flex flex-col h-[600px] animate-fade-in">
          {/* Chat Header Info */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">
                  AI Antrenör Sohbeti & Canlı Programlama
                </h3>
                {aiMode === "deep" ? (
                  <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200 flex items-center gap-1">
                    <Brain className="w-3 h-3" /> Derin Düşünme Modu Aktif
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Hızlı Mod (1-2s)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Konuşarak doğrudan yeni program hazırlatabilir veya antrenmanınızı revize ettirebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => setIsVoiceOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200/80 flex items-center gap-1 tap-effect"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600" /> Sesli Görüşme
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white font-medium rounded-br-none shadow-sm"
                      : "bg-slate-100 text-slate-800 rounded-bl-none border border-slate-200/60 font-normal"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Agentic Action Proposal Card */}
                {msg.actionProposal && msg.actionProposal.program_data && (
                  <div className="mt-3 max-w-[90%] sm:max-w-[80%] p-4 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-xl border border-emerald-500/30 space-y-3 animate-slide-up">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-extrabold text-white">
                          {msg.actionProposal.title || "Yeni Antrenman Programı Önerisi"}
                        </h4>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                        AI Programlama
                      </span>
                    </div>

                    {msg.actionProposal.description && (
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {msg.actionProposal.description}
                      </p>
                    )}

                    {/* Routine Preview Cards */}
                    {msg.actionProposal.program_data.routines && (
                      <div className="space-y-1.5 pt-1">
                        {msg.actionProposal.program_data.routines.map((r: any, rIdx: number) => (
                          <div
                            key={rIdx}
                            className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-xs flex items-center justify-between"
                          >
                            <span className="font-bold text-white">
                              {r.sequence_order}. {r.name}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              {r.exercises?.length || 0} Egzersiz
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2">
                      {msg.proposalApplied ? (
                        <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4" />
                          Program Başarıyla Veritabanına Yüklendi ve Aktif Edildi
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={applyingProposalIndex === idx}
                          onClick={() => handleApplyChatProposal(idx, msg.actionProposal)}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs tap-effect shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          {applyingProposalIndex === idx
                            ? "Veritabanına Kaydediliyor..."
                            : "Bu Programı Onayla ve Uygulamama Yükle"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 border border-slate-200 text-slate-500 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${aiMode === "deep" ? "bg-indigo-600" : "bg-emerald-600"} animate-bounce`} />
                  <span className={`w-2 h-2 rounded-full ${aiMode === "deep" ? "bg-indigo-600" : "bg-emerald-600"} animate-bounce [animation-delay:0.2s]`} />
                  <span className={`w-2 h-2 rounded-full ${aiMode === "deep" ? "bg-indigo-600" : "bg-emerald-600"} animate-bounce [animation-delay:0.4s]`} />
                  <span className="text-[11px] font-bold text-slate-600">
                    {aiMode === "deep" ? "Derin akıl yürütme yapılıyor..." : "Yanıt üretiliyor..."}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
            {quickPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 whitespace-nowrap tap-effect transition-colors flex-shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-2 border-t border-slate-100 flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  aiMode === "deep"
                    ? "Derin Düşünme modunda antrenörünüze yazın (örn: 'Bana 4 haftalık periyodizasyon hazırla')..."
                    : "Antrenörünüze yazın (örn: 'Naber', 'Bugün ne yapalım?')..."
                }
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 pr-24"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => setAiMode(aiMode === "fast" ? "deep" : "fast")}
                  className={`px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 tap-effect transition-all ${
                    aiMode === "deep"
                      ? "bg-indigo-100 text-indigo-800 border border-indigo-200"
                      : "bg-slate-200/80 text-slate-700"
                  }`}
                  title="Model modunu değiştir"
                >
                  {aiMode === "deep" ? <Brain className="w-3 h-3 text-indigo-600" /> : <Zap className="w-3 h-3 text-emerald-600" />}
                  <span>{aiMode === "deep" ? "Derin" : "Hızlı"}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isChatSending}
              className={`px-5 py-3 ${
                aiMode === "deep" ? "bg-indigo-600 hover:bg-indigo-700" : "bg-emerald-600 hover:bg-emerald-700"
              } disabled:opacity-50 text-white rounded-2xl tap-effect flex items-center justify-center shadow-sm`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: GELİŞİM ANALİZİ ── */}
      {activeTab === "analysis" && (
        <div className="space-y-4 animate-fade-in">
          {latestLog ? (
            <div className="surface-card p-6 space-y-5">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      AI PT Değerlendirmesi
                    </h3>
                    <p className="text-xs text-slate-400">
                      {new Date(latestLog.created_at).toLocaleDateString("tr-TR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>

                {latestLog.applied ? (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Devrede
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
                    Onay Bekliyor
                  </span>
                )}
              </div>

              {/* Evaluation Summary */}
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 leading-relaxed font-medium">
                {latestLog.evaluation_summary}
              </div>

              {/* Recomp & Nutrition Assessment */}
              {latestLog.suggested_changes?.recomp_assessment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200/70 rounded-2xl text-xs">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1">
                      <Flame className="w-4 h-4 text-emerald-600" /> Recomposition Durumu
                    </span>
                    <p className="text-slate-700">
                      {latestLog.suggested_changes.recomp_assessment.explanation}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-bold mt-2">
                      Tahmin: {latestLog.suggested_changes.recomp_assessment.estimated_progress}
                    </p>
                  </div>

                  {latestLog.suggested_changes?.nutrition_tip && (
                    <div className="p-4 bg-amber-50/50 border border-amber-200/70 rounded-2xl text-xs">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                        <Utensils className="w-4 h-4 text-amber-600" /> Beslenme Tavsiyesi
                      </span>
                      <p className="text-slate-700">
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-emerald-600" /> Önerilen Progressive Overload Revizyonları
                    </h4>

                    <div className="space-y-2">
                      {latestLog.suggested_changes.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{rec.exercise}</span>
                            {rec.reason && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{rec.reason}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2.5">
                            {rec.old_val && (
                              <span className="text-slate-400 line-through text-xs">
                                {rec.old_val}
                              </span>
                            )}
                            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                            <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                              {rec.new_val}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!latestLog.applied && (
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={handleApplyChanges}
                          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          {isApplying ? "Uygulanıyor..." : "Hedefleri Programıma Uygula"}
                        </button>
                      </div>
                    )}

                    {appliedSuccessMessage && (
                      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 mt-3">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {appliedSuccessMessage}
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div className="surface-card p-10 text-center text-slate-400 text-xs">
              <Bot className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              Henüz bir AI değerlendirmesi oluşturulmadı. Yukarıdaki &quot;Yeni Analiz Yap&quot; butonuna basabilirsiniz.
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
  );
}
