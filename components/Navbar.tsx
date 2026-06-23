"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function UserCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6.168 18.849A4 4 0 0 1 10 16h4a4 4 0 0 1 3.832 2.849" strokeLinecap="round" />
    </svg>
  );
}

interface NavbarProps {
  userName?: string | null;
}

export default function Navbar({ userName }: NavbarProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } catch (err) {
      console.error("Logout error:", err);
      setIsLoggingOut(false);
    }
  };

  const displayName = userName
    ? userName.split(" ")[0]
    : "Profil";

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(226,232,240,0.8)",
        boxShadow: "0 1px 0 rgba(0,0,0,0.04)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <a
          href="/dashboard"
          className="flex items-center gap-2.5 select-none group"
          style={{ textDecoration: "none" }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{ background: "#1a56db" }}
          >
            <SparkleIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">
            Lumino<span style={{ color: "#1a56db" }}>AI</span>
          </span>
        </a>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* User chip */}
          <div
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <UserCircleIcon className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-600">{displayName}</span>
          </div>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
            style={{
              background: isLoggingOut ? "#f1f5f9" : "transparent",
              color: isLoggingOut ? "#94a3b8" : "#64748b",
              border: "1px solid transparent",
              cursor: isLoggingOut ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!isLoggingOut) {
                (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "#e2e8f0";
                (e.currentTarget as HTMLButtonElement).style.color = "#334155";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoggingOut) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#64748b";
              }
            }}
          >
            {isLoggingOut ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={3} strokeOpacity={0.3} />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={3} strokeLinecap="round" />
                </svg>
                <span className="hidden sm:inline">Abmelden…</span>
              </>
            ) : (
              <>
                <LogOutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Abmelden</span>
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
