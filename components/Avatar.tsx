"use client";

type AvatarStatus = "idle" | "talking" | "listening" | "thinking";

interface AvatarProps {
  status: AvatarStatus;
}

const STATUS_LABEL: Record<AvatarStatus, string> = {
  idle: "",
  talking: "Spricht...",
  listening: "Hört zu...",
  thinking: "Denkt...",
};

export default function Avatar({ status }: AvatarProps) {
  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Outer glow ring container */}
      <div className="relative flex items-center justify-center">

        {/* Pulse rings — only visible when talking */}
        {status === "talking" && (
          <>
            <span
              className="absolute inline-flex h-32 w-32 rounded-full bg-brand-500 opacity-0 animate-pulse-ring"
              style={{ animationDelay: "0s" }}
            />
            <span
              className="absolute inline-flex h-32 w-32 rounded-full bg-brand-500 opacity-0 animate-pulse-ring"
              style={{ animationDelay: "0.4s" }}
            />
            <span
              className="absolute inline-flex h-32 w-32 rounded-full bg-brand-500 opacity-0 animate-pulse-ring"
              style={{ animationDelay: "0.8s" }}
            />
          </>
        )}

        {/* Main avatar circle */}
        <div
          className={[
            "relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
            status === "idle"
              ? "bg-brand-900 border-2 border-brand-700 animate-pulse [animation-duration:3s]"
              : status === "talking"
              ? "bg-brand-800 border-2 border-brand-400 shadow-[0_0_32px_rgba(26,86,219,0.5)]"
              : status === "listening"
              ? "bg-emerald-900 border-2 border-emerald-400 shadow-[0_0_32px_rgba(16,185,129,0.4)]"
              : /* thinking */
                "bg-slate-800 border-2 border-slate-500 shadow-[0_0_20px_rgba(100,116,139,0.3)]",
          ].join(" ")}
        >
          {/* Idle / Talking: HR monogram */}
          {(status === "idle" || status === "talking") && (
            <span className="font-mono text-2xl font-bold tracking-widest text-brand-200 drop-shadow">
              HR
            </span>
          )}

          {/* Listening: 5-bar waveform */}
          {status === "listening" && (
            <div className="flex items-center gap-1 h-10">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`block w-1.5 rounded-full bg-emerald-400 animate-wave-bar wave-bar-${i}`}
                  style={{ height: "100%", transformOrigin: "bottom" }}
                />
              ))}
            </div>
          )}

          {/* Thinking: 3-dot bounce */}
          {status === "thinking" && (
            <div className="flex items-center gap-1.5">
              {[1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`block w-2 h-2 rounded-full bg-slate-300 animate-typing-dot typing-dot-${i}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status label */}
      <div className="h-5 flex items-center justify-center">
        {STATUS_LABEL[status] && (
          <span
            className={[
              "text-xs font-mono tracking-widest uppercase px-2 py-0.5 rounded",
              status === "talking"
                ? "text-brand-300 bg-brand-900/60"
                : status === "listening"
                ? "text-emerald-300 bg-emerald-900/40"
                : "text-slate-400 bg-slate-800/60",
            ].join(" ")}
          >
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>
    </div>
  );
}
