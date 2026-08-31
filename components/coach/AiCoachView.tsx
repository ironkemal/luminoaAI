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
  MessageSquare
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
        body: JSON.stringify({ action: "evaluate", userId: currentUser?.id }),
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

  const handleSendMessage = async (customQuery?: string): Promise<string> => {
    const userText = customQuery || inputMessage.trim();
    if (!userText) return "";

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
    <div className="space-y-5 animate-fade-in max-w-4xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#E2F952]" />
            <span>{t("coachTitle")}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-normal">
            {t("coachSubtitle")}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold text-xs border border-white/[0.08] tap-effect flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5 text-[#E2F952]" />
            {t("tabVoice")}
          </button>

          <button
            type="button"
            onClick={() => setIsProgramGenOpen(true)}
            className="px-3 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold text-xs border border-white/[0.08] tap-effect flex items-center gap-1.5"
          >
            <CalendarDays className="w-3.5 h-3.5 text-amber-400" />
            {t("tabGenerator")}
          </button>

          <button
            type="button"
            disabled={isEvaluating}
            onClick={handleRunEvaluation}
            className="px-3.5 py-2 rounded-xl btn-primary disabled:opacity-50 text-xs font-black tap-effect flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
            {isEvaluating ? "Analiz Ediliyor..." : "Yeni Analiz Yap"}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-[#11151D] border border-white/[0.08] p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all tap-effect flex items-center gap-1.5 ${
            activeTab === "chat"
              ? "bg-white/[0.12] text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#E2F952]" />
          {t("tabChat")}
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all tap-effect flex items-center gap-1.5 ${
            activeTab === "analysis"
              ? "bg-white/[0.12] text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t("tabAnalysis")}
        </button>

        <button
          onClick={() => setActiveTab("memory")}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all tap-effect flex items-center gap-1.5 ${
            activeTab === "memory"
              ? "bg-white/[0.12] text-white"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          {t("tabMemory")}
        </button>
      </div>

      {/* ── TAB 1: SOHBET ── */}
      {activeTab === "chat" && (
        <div className="surface-card p-4 sm:p-5 flex flex-col h-[580px] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                AI Antrenör Sohbeti & Canlı Programlama
              </h3>
              <p className="text-[10px] text-slate-400">
                Doğrudan konuşarak program hazırlatabilir ve tek tıkla kaydedebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => setIsVoiceOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-semibold flex items-center gap-1 tap-effect"
            >
              <Mic className="w-3 h-3 text-[#E2F952]" /> Sesli
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3.5 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#1E2538] text-white font-medium rounded-br-none"
                      : "bg-[#141822] border border-white/[0.08] text-slate-200 rounded-bl-none font-normal"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* Action Proposal Card */}
                {msg.actionProposal && msg.actionProposal.program_data && (
                  <div className="mt-2 max-w-[85%] sm:max-w-[78%] p-3.5 bg-[#171C26] rounded-xl border border-white/[0.1] space-y-2.5 animate-slide-up">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#E2F952]" />
                      <h4 className="text-xs font-bold text-white">
                        {msg.actionProposal.title || "Yeni Program Önerisi"}
                      </h4>
                    </div>

                    {msg.actionProposal.description && (
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {msg.actionProposal.description}
                      </p>
                    )}

                    {msg.actionProposal.program_data.routines && (
                      <div className="space-y-1 pt-1">
                        {msg.actionProposal.program_data.routines.map((r: any, rIdx: number) => (
                          <div
                            key={rIdx}
                            className="p-2 bg-[#0E121A] rounded-lg border border-white/[0.04] text-[11px] flex items-center justify-between"
                          >
                            <span className="font-semibold text-white">
                              {r.sequence_order}. {r.name}
                            </span>
                            <span className="text-slate-400 text-[10px]">
                              {r.exercises?.length || 0} Egzersiz
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-1">
                      {msg.proposalApplied ? (
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          Program Veritabanına Yüklendi
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={applyingProposalIndex === idx}
                          onClick={() => handleApplyChatProposal(idx, msg.actionProposal)}
                          className="w-full py-2.5 rounded-lg btn-primary text-xs tap-effect flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current" />
                          {applyingProposalIndex === idx
                            ? "Kaydediliyor..."
                            : "Bu Programı Onayla ve Veritabanına Kaydet"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-[#141822] border border-white/[0.08] text-slate-400 rounded-xl px-3 py-2 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E2F952] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E2F952] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E2F952] animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((prompt, pIdx) => (
              <button
                key={pIdx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-lg bg-[#141822] hover:bg-[#1A202C] border border-white/[0.06] text-[11px] font-medium text-slate-300 whitespace-nowrap tap-effect transition-colors flex-shrink-0"
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
            className="pt-2 border-t border-white/[0.06] flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Antrenöre yazın: 'Bana yeni bir 4 günlük split hazırla'..."
              className="flex-1 px-3.5 py-2.5 bg-[#090B0E] border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#E2F952]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isChatSending}
              className="px-4 py-2.5 btn-primary disabled:opacity-50 text-xs tap-effect flex items-center justify-center rounded-xl"
            >
              <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: GELİŞİM ANALİZİ ── */}
      {activeTab === "analysis" && (
        <div className="space-y-4 animate-fade-in">
          {latestLog ? (
            <div className="surface-card p-5 md:p-6 space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-white/[0.06] text-[#E2F952]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      AI PT Değerlendirmesi
                    </h3>
                    <p className="text-[10px] text-slate-400">
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
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-bold text-xs border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Devrede
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-bold text-xs border border-amber-500/20">
                    Onay Bekliyor
                  </span>
                )}
              </div>

              {/* Evaluation Summary */}
              <div className="p-3.5 rounded-xl bg-[#090B0E] border border-white/[0.06] text-xs text-slate-300 leading-relaxed font-normal">
                {latestLog.evaluation_summary}
              </div>

              {/* Recomp & Nutrition */}
              {latestLog.suggested_changes?.recomp_assessment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#141822] border border-white/[0.06] text-xs">
                    <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                      <Flame className="w-3.5 h-3.5 text-[#FF6B4A]" /> Recomposition Durumu
                    </span>
                    <p className="text-slate-300 font-normal">
                      {latestLog.suggested_changes.recomp_assessment.explanation}
                    </p>
                    <p className="text-[10px] text-[#E2F952] font-bold mt-1.5">
                      Tahmin: {latestLog.suggested_changes.recomp_assessment.estimated_progress}
                    </p>
                  </div>

                  {latestLog.suggested_changes?.nutrition_tip && (
                    <div className="p-3.5 rounded-xl bg-[#141822] border border-white/[0.06] text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5 mb-1">
                        <Utensils className="w-3.5 h-3.5 text-amber-400" /> Beslenme Tavsiyesi
                      </span>
                      <p className="text-slate-300 font-normal">
                        {latestLog.suggested_changes.nutrition_tip}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Overload Recommendations */}
              {latestLog.suggested_changes?.recommendations &&
                latestLog.suggested_changes.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#E2F952]" /> Önerilen Progressive Overload Revizyonları
                    </h4>

                    <div className="space-y-1.5">
                      {latestLog.suggested_changes.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-[#090B0E] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                        >
                          <div>
                            <span className="font-semibold text-white">{rec.exercise}</span>
                            {rec.reason && (
                              <p className="text-[10px] text-slate-400 mt-0.5">{rec.reason}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {rec.old_val && (
                              <span className="text-slate-500 line-through text-[11px]">
                                {rec.old_val}
                              </span>
                            )}
                            <ArrowUpRight className="w-3 h-3 text-[#E2F952]" />
                            <span className="font-bold text-[#E2F952] bg-[#E2F952]/10 px-2 py-0.5 rounded-md">
                              {rec.new_val}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!latestLog.applied && (
                      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-end">
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={handleApplyChanges}
                          className="px-4 py-2.5 rounded-xl btn-primary text-xs font-black tap-effect flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          {isApplying ? "Uygulanıyor..." : "Hedefleri Programıma Uygula"}
                        </button>
                      </div>
                    )}

                    {appliedSuccessMessage && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-2 mt-2">
                        <CheckCircle2 className="w-4 h-4" />
                        {appliedSuccessMessage}
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div className="surface-card p-10 text-center">
              <Bot className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Henüz bir AI değerlendirmesi oluşturulmadı.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Yukarıdaki &quot;Yeni Analiz Yap&quot; butonuna basabilirsiniz.
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
