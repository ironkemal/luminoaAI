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
              content: `🎉 ${data.message || "Yeni programınız başarıyla veritabanına yüklendi ve aktif edildi!"} Artık Antrenman ve Programlar sayfalarınızdan yeni rutininize hemen başlayabilirsiniz.`,
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
    "📊 Son ağırlıklarımı ve hacmimi analiz et",
    "⚡ Omuzlara daha çok odaklanan bir split hazırla",
    "🥗 100 kg Lean Cut tokluk ve beslenme tavsiyesi ver",
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Bot className="w-5 h-5" />
            </div>
            <span>{t("coachTitle")}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {t("coachSubtitle")}
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Voice Coach Button */}
          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs border border-emerald-500/30 shadow-md shadow-emerald-500/10 tap-effect flex items-center gap-2 transition-all"
          >
            <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
            {t("tabVoice")}
          </button>

          {/* AI Program Generator */}
          <button
            type="button"
            onClick={() => setIsProgramGenOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-white/[0.1] text-white font-bold text-xs shadow-md tap-effect flex items-center gap-2 transition-all"
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            {t("tabGenerator")}
          </button>

          {/* Re-evaluate */}
          <button
            type="button"
            disabled={isEvaluating}
            onClick={handleRunEvaluation}
            className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-300 hover:to-teal-500 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/25 tap-effect flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
            {isEvaluating ? "Analiz Ediliyor..." : "Yeni Analiz Yap"}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-white/[0.08] p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-2 ${
            activeTab === "chat"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          {t("tabChat")}
        </button>

        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-2 ${
            activeTab === "analysis"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {t("tabAnalysis")}
        </button>

        <button
          onClick={() => setActiveTab("memory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-2 ${
            activeTab === "memory"
              ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-black shadow-md shadow-emerald-500/30"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          {t("tabMemory")}
        </button>
      </div>

      {/* ── TAB 1: SOHBET & AGENTIC EYLEMLER ── */}
      {activeTab === "chat" && (
        <div className="surface-card p-5 md:p-6 flex flex-col h-[600px] animate-fade-in border-emerald-500/20">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  AI Antrenör Sohbeti & Canlı Programlama
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  Metin üzerinden konuşarak yeni program yazdırabilir ve tek tıkla veritabanınıza uygulayabilirsiniz.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsVoiceOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5 tap-effect border border-emerald-500/20"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-400" /> Sesli Mod
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-bold rounded-br-none shadow-md shadow-emerald-500/20"
                      : "bg-slate-900/90 border border-white/[0.08] text-slate-200 rounded-bl-none font-medium shadow-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* ── ACTION PROPOSAL CARD ── */}
                {msg.actionProposal && msg.actionProposal.program_data && (
                  <div className="mt-2.5 max-w-[88%] sm:max-w-[80%] p-4 bg-slate-900/95 rounded-2xl border border-emerald-500/40 shadow-xl shadow-emerald-500/10 animate-slide-up space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-xs font-black text-white">
                        {msg.actionProposal.title || "AI Tarafından Oluşturulan Yeni Program"}
                      </h4>
                    </div>

                    {msg.actionProposal.description && (
                      <p className="text-[11px] text-slate-300 leading-snug font-medium">
                        {msg.actionProposal.description}
                      </p>
                    )}

                    {/* Routines Summary */}
                    {msg.actionProposal.program_data.routines && (
                      <div className="space-y-1.5 pt-1">
                        {msg.actionProposal.program_data.routines.map((r: any, rIdx: number) => (
                          <div
                            key={rIdx}
                            className="p-2.5 bg-slate-950 rounded-xl border border-white/[0.08] text-[11px] flex items-center justify-between"
                          >
                            <span className="font-bold text-white">
                              {r.sequence_order}. {r.name}
                            </span>
                            <span className="text-emerald-300 font-extrabold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                              {r.exercises?.length || 0} Egzersiz
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Apply Button */}
                    <div className="pt-2">
                      {msg.proposalApplied ? (
                        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          Program Veritabanına Yüklendi ve Aktif Edildi
                        </div>
                      ) : (
                        <button
                          type="button"
                          disabled={applyingProposalIndex === idx}
                          onClick={() => handleApplyChatProposal(idx, msg.actionProposal)}
                          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 tap-effect flex items-center justify-center gap-2 transition-all"
                        >
                          <Zap className="w-4 h-4 fill-current" />
                          {applyingProposalIndex === idx
                            ? "Veritabanına Yükleniyor..."
                            : "⚡ Bu Programı Onayla ve Veritabanına Kaydet"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-slate-900 border border-white/[0.08] text-slate-400 rounded-2xl px-4 py-2.5 text-xs rounded-bl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
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
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-white/[0.08] text-[11px] font-semibold text-slate-300 whitespace-nowrap tap-effect transition-colors flex-shrink-0"
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
            className="pt-2 border-t border-white/[0.08] flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Antrenöre yazın: 'Bana yeni bir 4 günlük split hazırla'..."
              className="flex-1 px-4 py-3 bg-slate-950 border border-white/[0.1] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isChatSending}
              className="px-5 py-3 bg-gradient-to-r from-emerald-400 to-teal-600 hover:from-emerald-300 hover:to-teal-500 disabled:opacity-50 text-slate-950 rounded-2xl text-xs font-black tap-effect flex items-center justify-center shadow-md shadow-emerald-500/20"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>
        </div>
      )}

      {/* ── TAB 2: GELİŞİM ANALİZİ ── */}
      {activeTab === "analysis" && (
        <div className="space-y-6 animate-fade-in">
          {latestLog ? (
            <div className="surface-card p-6 md:p-8 space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Son Dönem AI PT Değerlendirmesi
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">
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
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-bold text-xs border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Programda Devrede
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 font-bold text-xs border border-amber-500/30">
                    Onay Bekliyor
                  </span>
                )}
              </div>

              {/* Evaluation Summary Text */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-white/[0.08] text-xs text-slate-300 leading-relaxed font-medium">
                {latestLog.evaluation_summary}
              </div>

              {/* Recomposition & Nutrition Highlights */}
              {latestLog.suggested_changes?.recomp_assessment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 text-xs">
                    <span className="font-black text-emerald-300 flex items-center gap-1.5 mb-1.5">
                      <Flame className="w-4 h-4 text-emerald-400" /> Recomposition Durumu
                    </span>
                    <p className="text-slate-300 font-medium leading-relaxed">
                      {latestLog.suggested_changes.recomp_assessment.explanation}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-bold mt-2">
                      Tahmin: {latestLog.suggested_changes.recomp_assessment.estimated_progress}
                    </p>
                  </div>

                  {latestLog.suggested_changes?.nutrition_tip && (
                    <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 text-xs">
                      <span className="font-black text-amber-300 flex items-center gap-1.5 mb-1.5">
                        <Utensils className="w-4 h-4 text-amber-400" /> Beslenme & Tokluk Stratejisi
                      </span>
                      <p className="text-slate-300 font-medium leading-relaxed">
                        {latestLog.suggested_changes.nutrition_tip}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Structured Recommendations Table */}
              {latestLog.suggested_changes?.recommendations &&
                latestLog.suggested_changes.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> Önerilen Progressive Overload Revizyonları
                    </h4>

                    <div className="space-y-2">
                      {latestLog.suggested_changes.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-900 border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">{rec.exercise}</span>
                            {rec.reason && (
                              <p className="text-[11px] text-slate-400 mt-0.5 font-normal">{rec.reason}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {rec.old_val && (
                              <span className="text-slate-500 line-through">
                                {rec.old_val}
                              </span>
                            )}
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-black text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                              {rec.new_val}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Apply Button */}
                    {!latestLog.applied && (
                      <div className="mt-5 pt-4 border-t border-white/[0.08] flex items-center justify-end">
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={handleApplyChanges}
                          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-600 hover:from-emerald-300 hover:to-teal-500 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/30 tap-effect flex items-center gap-2"
                        >
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          {isApplying ? "Uygulanıyor..." : "Önerilen Hedefleri Programıma Uygula (Supabase Güncelle)"}
                        </button>
                      </div>
                    )}

                    {appliedSuccessMessage && (
                      <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 mt-3 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {appliedSuccessMessage}
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div className="surface-card p-12 text-center">
              <Bot className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <p className="text-sm font-bold text-white">Henüz bir AI değerlendirmesi oluşturulmadı.</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">
                Yukarıdaki &quot;Yeni Analiz Yap&quot; butonuna basarak ilk analiz raporunuzu oluşturabilirsiniz.
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
