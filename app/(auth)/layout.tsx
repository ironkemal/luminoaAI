export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left: Brand panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-shrink-0 flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #1a56db 0%, #0e3a9e 55%, #071f5e 100%)" }}
      >
        {/* Noise texture */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Glow orbs */}
        <div
          className="absolute top-0 right-0 w-72 h-72 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(99,152,255,0.3) 0%, transparent 70%)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(99,152,255,0.15) 0%, transparent 70%)",
            transform: "translate(-30%, 30%)",
          }}
        />

        {/* Grid pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="auth-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        <div className="relative z-10 flex flex-col h-full p-12 py-14">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-auto">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-4.5 h-4.5 w-[18px] h-[18px]">
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
            </div>
            <span className="text-[17px] font-bold text-white tracking-tight">
              Lumino<span style={{ opacity: 0.6 }}>AI</span>
            </span>
          </div>

          {/* Main content */}
          <div className="mb-10">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-8"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.15)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              KI-Karriere-Coaching
            </div>

            <h2 className="text-[2.4rem] font-extrabold text-white leading-[1.15] tracking-[-0.02em] mb-5">
              Meistere jedes<br />
              Karrieregespräch.
            </h2>
            <p style={{ color: "rgba(180,200,255,0.85)" }} className="text-[15px] leading-relaxed max-w-[280px]">
              Trainiere mit KI-gestütztem Voice-Coaching für Vorstellungsgespräche, Gehaltsverhandlungen und mehr.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3 mb-12">
            {[
              { icon: "🎙️", label: "Echtzeit-Sprachgespräche mit KI-HR-Manager" },
              { icon: "📄", label: "CV-Upload für personalisierte Stressfragen" },
              { icon: "📊", label: "Objektive Analyse deiner Soft Skills" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-[15px] flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  {f.icon}
                </div>
                <span className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{f.label}</span>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <div className="flex -space-x-2">
              {["#93c5fd", "#818cf8", "#6ee7b7"].map((c, i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: c, borderColor: "rgba(10,30,80,0.5)" }}
                >
                  {["J", "M", "A"][i]}
                </div>
              ))}
            </div>
            <p className="text-xs leading-snug" style={{ color: "rgba(200,215,255,0.75)" }}>
              <span className="text-white font-semibold">500+</span> Gespräche simuliert.<br />
              Tritt jetzt der Community bei.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10 overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#1a56db" }}>
            <svg viewBox="0 0 24 24" fill="white" className="w-4 h-4">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">
            Lumino<span style={{ color: "#1a56db" }}>AI</span>
          </span>
        </div>

        <div className="w-full max-w-[400px]">
          {children}
        </div>

        <p className="mt-12 text-xs text-slate-400">© 2026 Lumino AI · Alle Rechte vorbehalten</p>
      </div>
    </div>
  );
}
