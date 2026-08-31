"use client";

import { useState } from "react";
import { ChatSession } from "@/types";
import { useLanguage } from "@/lib/i18n";
import {
  History,
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  X,
  ChevronRight,
  Sparkles,
  RefreshCw
} from "lucide-react";

interface ChatHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRefresh?: () => void;
}

export default function ChatHistoryDrawer({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onRefresh,
}: ChatHistoryDrawerProps) {
  const { t, language } = useLanguage();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!isOpen) return null;

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-fade-in">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
      />

      {/* Drawer Panel */}
      <div className="relative w-84 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between p-5 z-10 animate-slide-right overflow-y-auto border-l border-slate-200">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {t("chatSessions")}
                </h3>
                <p className="text-[10px] text-slate-400">
                  {t("chatSessionsDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {onRefresh && (
                <button
                  type="button"
                  onClick={handleRefreshClick}
                  title="Senkronize Et / Yenile"
                  className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl tap-effect"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-emerald-600" : ""}`} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl tap-effect"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* New Chat Button */}
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm tap-effect flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t("startNewChat")}</span>
          </button>

          {/* Sessions List */}
          <div className="space-y-2 pt-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
              {t("savedSessions")} ({sessions.length})
            </p>

            {sessions.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
                <Clock className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">
                  {t("noSavedSessions")}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {t("chatSessionsDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[65vh] overflow-y-auto pr-1 scrollbar-thin">
                {sessions.map((sess) => {
                  const isCurrent = sess.id === currentSessionId;
                  const lastMsg = sess.messages?.[sess.messages.length - 1]?.content || "";

                  return (
                    <div
                      key={sess.id}
                      className={`group p-3 rounded-2xl border transition-all tap-effect flex items-center justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? "bg-emerald-50/70 border-emerald-300 text-slate-900 shadow-sm"
                          : "bg-slate-50/60 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 text-slate-800"
                      }`}
                      onClick={() => {
                        onSelectSession(sess);
                        onClose();
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isCurrent ? "text-emerald-600" : "text-slate-400"}`} />
                          <h4 className="text-xs font-bold truncate">
                            {sess.title || t("newChat")}
                          </h4>
                        </div>
                        {lastMsg && (
                          <p className="text-[10px] text-slate-500 truncate mt-0.5">
                            {lastMsg}
                          </p>
                        )}
                        <p className="text-[9px] text-slate-400 mt-1">
                          {new Date(sess.updated_at || sess.created_at).toLocaleDateString(language === "tr" ? "tr-TR" : language === "de" ? "de-DE" : "en-US", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })} • {sess.messages?.length || 0}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(language === "tr" ? "Bu sohbet oturumunu silmek istediğinize emin misiniz?" : "Delete this session?")) {
                            onDeleteSession(sess.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity tap-effect"
                        title={t("delete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 text-center">
          {t("syncDeviceNotice")}
        </div>
      </div>
    </div>
  );
}
