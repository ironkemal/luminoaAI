"use client";

import { useEffect, useState } from "react";
import { ChatSession } from "@/types";
import { useLanguage } from "@/lib/i18n";
import {
  Plus,
  Trash2,
  MessageSquare,
  Clock,
  X,
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

  // Lock body scroll + close on Escape while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRefreshClick = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const dateLocale = language === "tr" ? "tr-TR" : language === "de" ? "de-DE" : "en-US";

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden />

      <div role="dialog" aria-modal="true" aria-labelledby="chat-history-title" className="sheet sm:max-h-[80dvh]">
        {/* Grabber (mobile) */}
        <div className="sm:hidden flex justify-center pt-2.5" aria-hidden>
          <span className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-2 px-4 pt-2 pb-3 sm:pt-4 border-b border-slate-100">
          <div className="min-w-0 flex-1">
            <h3 id="chat-history-title" className="section-title truncate">
              {t("chatSessions")}
            </h3>
            <p className="text-xs text-slate-500 truncate">
              {t("chatSessionsDesc")} · <span className="tabular-nums">{sessions.length}</span>
            </p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefreshClick}
              aria-label="Senkronize Et / Yenile"
              title="Senkronize Et / Yenile"
              className="icon-btn"
            >
              <RefreshCw className={isRefreshing ? "animate-spin text-emerald-600" : ""} />
            </button>
          )}
          <button type="button" onClick={onClose} aria-label="Kapat" className="icon-btn">
            <X />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {sessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700">{t("noSavedSessions")}</p>
              <p className="mt-1 text-xs text-slate-500">{t("chatSessionsDesc")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 px-2 py-1">
              {sessions.map((sess) => {
                const isCurrent = sess.id === currentSessionId;
                const lastMsg = sess.messages?.[sess.messages.length - 1]?.content || "";

                return (
                  <li key={sess.id} className="group flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSession(sess);
                        onClose();
                      }}
                      aria-current={isCurrent ? "true" : undefined}
                      className={`tap-effect flex-1 min-w-0 flex items-start gap-3 text-left px-2 py-3 rounded-xl transition-colors ${
                        isCurrent ? "bg-emerald-50/70" : "md:hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`shrink-0 mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center ${
                          isCurrent ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900 truncate">
                          {sess.title || t("newChat")}
                        </span>
                        {lastMsg && (
                          <span className="block text-xs text-slate-500 truncate mt-0.5">{lastMsg}</span>
                        )}
                        <span className="block text-xs text-slate-400 mt-1 tabular-nums">
                          {new Date(sess.updated_at || sess.created_at).toLocaleDateString(dateLocale, {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          · {sess.messages?.length || 0} mesaj
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(language === "tr" ? "Bu sohbet oturumunu silmek istediğinize emin misiniz?" : "Delete this session?")) {
                          onDeleteSession(sess.id);
                        }
                      }}
                      className="icon-btn text-slate-400 hover:text-red-600 hover:bg-red-50 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                      aria-label={t("delete")}
                      title={t("delete")}
                    >
                      <Trash2 className="!w-4 !h-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pt-3 pb-4 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="btn-primary btn-block"
          >
            <Plus />
            {t("startNewChat")}
          </button>
          <p className="text-xs text-slate-400 text-center">{t("syncDeviceNotice")}</p>
        </div>
      </div>
    </>
  );
}
