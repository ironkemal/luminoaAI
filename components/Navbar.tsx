"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Dumbbell, Activity, CalendarDays, Bot, Lock } from "lucide-react";
import { lockApp } from "@/lib/auth-pin";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  // Hide in workout player for complete focus
  if (pathname.includes("/workout/player")) {
    return null;
  }

  const handleLock = () => {
    lockApp();
    window.location.reload();
  };

  const navLinks = [
    { href: "/workout", label: "Antrenman", icon: Dumbbell },
    { href: "/metrics", label: "Ölçüm & Kilo", icon: Activity },
    { href: "/routines", label: "Programlar", icon: CalendarDays },
    { href: "/coach", label: "AI Antrenör", icon: Bot },
  ];

  return (
    <header className="sticky top-0 z-30 w-full bg-white/85 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link
          href="/workout"
          className="flex items-center gap-2.5 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1">
              Lumino<span className="text-emerald-600">PT</span>
            </span>
            <span className="hidden sm:block text-[10px] font-medium text-slate-400 -mt-1 tracking-wider uppercase">
              Smart Fitness Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href === "/workout" && pathname === "/") ||
              pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action / Lock */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">100 kg</span>
            <span className="text-slate-400">|</span>
            <span>Recomp Modu</span>
          </div>

          <button
            type="button"
            onClick={handleLock}
            title="Uygulamayı Kilitle"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 tap-effect"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
