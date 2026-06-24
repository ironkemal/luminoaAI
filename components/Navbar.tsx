"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

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

  const initials = userName
    ? userName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  const displayName = userName?.split(" ")[0] ?? "Profil";

  return (
    <nav
      className="sticky top-0 z-50 w-full"
      style={{
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(226,232,240,0.7)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 0 rgba(0,0,0,0.02)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 group select-none"
          style={{ textDecoration: "none" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105"
            style={{ background: "linear-gradient(135deg, #1a56db 0%, #1340b8 100%)", boxShadow: "0 2px 8px rgba(26,86,219,0.3)" }}
          >
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <span className="text-[15px] font-bold tracking-tight text-slate-900">
            Lumino<span style={{ color: "#1a56db" }}>AI</span>
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* User avatar + name */}
          <div
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-lg"
            style={{ background: "#F8FAFC", border: "1px solid #E8EDF5" }}
          >
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #1a56db, #7c3aed)" }}
            >
              {initials}
            </div>
            <span className="text-sm font-medium text-slate-600">{displayName}</span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Abmelden</span>
              </>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
