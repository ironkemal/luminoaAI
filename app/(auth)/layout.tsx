"use client";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#05091a]">
      {/* Ambient background orbs */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Top-left deep blue orb */}
        <div
          className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle, #1a56db 0%, #0e3380 45%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        {/* Bottom-right subtle orb */}
        <div
          className="absolute -bottom-40 -right-20 w-[480px] h-[480px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, #103d96 0%, #061a40 50%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Center faint glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] opacity-10"
          style={{
            background:
              "radial-gradient(ellipse, #1a56db 0%, transparent 65%)",
            filter: "blur(100px)",
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {children}
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/20 tracking-wide whitespace-nowrap">
        © 2026 Lumino AI · Alle Rechte vorbehalten
      </p>
    </div>
  );
}
