"use client";

import { useState } from "react";
import { AiCoachLog } from "@/types";
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
  CheckCircle2
} from "lucide-react";

interface AiCoachViewProps {
  initialLogs: AiCoachLog[];
}

export default function AiCoachView({ initialLogs }: AiCoachViewProps) {
  const [logs, setLogs] = useState<AiCoachLog[]>(initialLogs);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedSuccessMessage, setAppliedSuccessMessage] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    {
      role: "assistant",
      content:
        "Merhaba! Ben Lumino Smart PT koçunuz. 100 kg lean cut ve body recomposition hedefleriniz, 24.5 kg dambıl setleri, ab-wheel antrenmanları ve tokluk sağlayan makro beslenme dengesi hakkında dilediğinizi sorabilirsiniz.",
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isChatSending) return;

    const userText = inputMessage.trim();
    setInputMessage("");
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
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Şu anda yanıt üretilemedi, lütfen tekrar deneyin.",
        },
      ]);
    } finally {
      setIsChatSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-600" /> Yapay Zeka Antrenör & Karar Motoru
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Progressive overload kararları, plato tespiti ve veritabanı senkronizasyonu
          </p>
        </div>

        <button
          type="button"
          disabled={isEvaluating}
          onClick={handleRunEvaluation}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm tap-effect flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? "animate-spin" : ""}`} />
          {isEvaluating ? "Analiz Ediliyor..." : "Yeni AI Değerlendirmesi Yap"}
        </button>
      </div>

      {/* Latest AI Evaluation Card */}
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
            Yukarıdaki &quot;Yeni AI Değerlendirmesi Yap&quot; butonuna basarak ilk analiz raporunuzu oluşturabilirsiniz.
          </p>
        </div>
      )}

      {/* Interactive AI PT Chat Section */}
      <div className="surface-card p-6 flex flex-col h-[480px]">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Bot className="w-5 h-5 text-emerald-600" />
          <h3 className="text-sm font-bold text-slate-900">
            AI PT ile Canlı Danışmanlık ve Sohbet
          </h3>
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
        <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
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
    </div>
  );
}
