"use client";

import { useState } from "react";
import { AiCoachLog } from "@/types";
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

export default function AiCoachView({ initialLogs }: AiCoachViewProps) {
  const [logs, setLogs] = useState<AiCoachLog[]>(initialLogs);
  const [activeTab, setActiveTab] = useState<"analysis" | "memory" | "chat">("analysis");

  // Modals
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isProgramGenOpen, setIsProgramGenOpen] = useState(false);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessMessage, setAppliedSuccessMessage] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Merhaba! Ben Lumino Smart PT koçunuz. 100 kg lean cut ve body recomposition hedefleriniz, 24.5 kg dambıl setleri, ab-wheel antrenmanları ve tokluk sağlayan makro beslenme dengesi hakkında dilediğinizi sorabilir veya yukarıdaki mikrofona basarak benimle sesli konuşabilirsiniz.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatSending, setIsChatSending] = useState(false);

  const latestLog = logs[0];

  const handleRunEvaluation = async () => {
    setIsEvaluating(true);
    setAppliedSuccessMessage(null);
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "evaluate" }),
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
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "apply_changes",
          suggestedChanges: latestLog.suggested_changes,
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

    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          question: userText,
          messages: messages,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Yanıt üretilemedi.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
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

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-600" /> Yapay Zeka Antrenör & Karar Motoru
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dinamik program yazma yetkisi, canlı sesli PT ve karar hafıza matrisi
          </p>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Voice Coach Button */}
          <button
            type="button"
            onClick={() => setIsVoiceOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 shadow-sm tap-effect flex items-center gap-2"
          >
            <Mic className="w-4 h-4 text-emerald-600 animate-pulse" />
            Sesli PT ile Konuş
          </button>

          {/* AI Program Generator */}
          <button
            type="button"
            onClick={() => setIsProgramGenOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-2"
          >
            <CalendarDays className="w-4 h-4 text-amber-400" />
            AI Program Yazdır
          </button>

          {/* Re-evaluate */}
          <button
            type="button"
            disabled={isEvaluating}
            onClick={handleRunEvaluation}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
            {isEvaluating ? "Analiz Ediliyor..." : "Yeni Analiz Yap"}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-2 ${
            activeTab === "analysis"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Gelişim Analizi & Hedefler
        </button>

        <button
          onClick={() => setActiveTab("memory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-2 ${
            activeTab === "memory"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-slate-700" />
          AI Hafıza & Karar Geçmişi
        </button>

        <button
          onClick={() => setActiveTab("chat")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all tap-effect flex items-center gap-2 ${
            activeTab === "chat"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
          Sohbet & Danışmanlık
        </button>
      </div>

      {/* ── TAB 1: Gelişim Analizi ── */}
      {activeTab === "analysis" && (
        <div className="space-y-6 animate-fade-in">
          {latestLog ? (
            <div className="surface-card p-6 md:p-8 space-y-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                    <Sparkles className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Son Dönem AI PT Değerlendirmesi
                    </h3>
                    <p className="text-[11px] text-slate-400">
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
                  <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Programda Devrede
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-amber-50 text-amber-700 font-bold text-xs border border-amber-200">
                    Onay Bekliyor
                  </span>
                )}
              </div>

              {/* Evaluation Summary Text */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs text-slate-700 leading-relaxed font-medium">
                {latestLog.evaluation_summary}
              </div>

              {/* Recomposition & Nutrition Highlights */}
              {latestLog.suggested_changes?.recomp_assessment && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 text-xs">
                    <span className="font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <Flame className="w-4 h-4 text-emerald-600" /> Recomposition Durumu
                    </span>
                    <p className="text-slate-700">
                      {latestLog.suggested_changes.recomp_assessment.explanation}
                    </p>
                    <p className="text-[11px] text-emerald-700 font-bold mt-1.5">
                      Tahmin: {latestLog.suggested_changes.recomp_assessment.estimated_progress}
                    </p>
                  </div>

                  {latestLog.suggested_changes?.nutrition_tip && (
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-xs">
                      <span className="font-bold text-amber-800 flex items-center gap-1.5 mb-1">
                        <Utensils className="w-4 h-4 text-amber-600" /> Beslenme & Tokluk Stratejisi
                      </span>
                      <p className="text-slate-700">
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" /> Önerilen Progressive Overload Revizyonları
                    </h4>

                    <div className="space-y-2">
                      {latestLog.suggested_changes.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{rec.exercise}</span>
                            {rec.reason && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{rec.reason}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {rec.old_val && (
                              <span className="text-slate-400 line-through">
                                {rec.old_val}
                              </span>
                            )}
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {rec.new_val}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Apply Button */}
                    {!latestLog.applied && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          disabled={isApplying}
                          onClick={handleApplyChanges}
                          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          {isApplying ? "Uygulanıyor..." : "Önerilen Hedefleri Programıma Uygula (Supabase Güncelle)"}
                        </button>
                      </div>
                    )}

                    {appliedSuccessMessage && (
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 mt-3 animate-fade-in">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {appliedSuccessMessage}
                      </div>
                    )}
                  </div>
                )}
            </div>
          ) : (
            <div className="surface-card p-12 text-center">
              <Bot className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Henüz bir AI değerlendirmesi oluşturulmadı.</p>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Yukarıdaki &quot;Yeni Analiz Yap&quot; butonuna basarak ilk analiz raporunuzu oluşturabilirsiniz.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: AI Hafıza Dosyası (Karar Matrisi) ── */}
      {activeTab === "memory" && (
        <div className="animate-fade-in">
          <AiMemoryTimeline logs={logs} />
        </div>
      )}

      {/* ── TAB 3: Sohbet & Danışmanlık ── */}
      {activeTab === "chat" && (
        <div className="surface-card p-6 flex flex-col h-[520px] animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                AI PT ile Canlı Danışmanlık ve Sohbet
              </h3>
            </div>

            <button
              onClick={() => setIsVoiceOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-1.5 tap-effect"
            >
              <Mic className="w-3.5 h-3.5" /> Sesli Moda Geç
            </button>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 scrollbar-thin">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-800 rounded-bl-none font-medium"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatSending && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-400 rounded-2xl px-4 py-2.5 text-xs rounded-bl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-3 border-t border-slate-100 flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Örn: 24.5 kg dambıl ile squat yaparken nelere dikkat etmeliyim?..."
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isChatSending}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold tap-effect flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
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
