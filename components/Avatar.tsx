"use client";

type AvatarStatus = "idle" | "talking" | "listening" | "thinking";

interface AvatarProps {
  status: AvatarStatus;
  size?: "sm" | "md";
}

const STATUS_LABEL: Record<AvatarStatus, string> = {
  idle: "",
  talking: "Spricht...",
  listening: "Hört zu...",
  thinking: "Denkt...",
};

export default function Avatar({ status, size = "md" }: AvatarProps) {
  const dim = size === "sm" ? "w-9 h-9" : "w-32 h-32";
  const ringDim = size === "sm" ? "h-9 w-9" : "h-32 w-32";
  const textSize = size === "sm" ? "text-xs" : "text-2xl";

  return (
    <div className={`flex flex-col items-center ${size === "sm" ? "gap-0" : "gap-3"} select-none`}>
      <div className="relative flex items-center justify-center">

        {/* Pulse rings — talking state (only in md) */}
        {status === "talking" && size === "md" && (
          <>
            <span
              className={`absolute inline-flex ${ringDim} rounded-full opacity-0 animate-pulse-ring`}
              style={{ background: "rgba(26,86,219,0.18)", animationDelay: "0s" }}
            />
            <span
              className={`absolute inline-flex ${ringDim} rounded-full opacity-0 animate-pulse-ring`}
              style={{ background: "rgba(26,86,219,0.12)", animationDelay: "0.4s" }}
            />
            <span
              className={`absolute inline-flex ${ringDim} rounded-full opacity-0 animate-pulse-ring`}
              style={{ background: "rgba(26,86,219,0.07)", animationDelay: "0.8s" }}
            />
          </>
        )}

        {/* Main avatar circle */}
        <div
          className={[
            `relative z-10 ${dim} rounded-full flex items-center justify-center transition-all duration-500`,
            status === "idle" ? "animate-pulse [animation-duration:3s]" : "",
          ].join(" ")}
          style={{
            background:
              status === "idle" ? "#EEF3FF"
              : status === "talking" ? "#DBEAFE"
              : status === "listening" ? "#ECFDF5"
              : "#F1F5F9",
            border:
              status === "idle" ? "2.5px solid #BFDBFE"
              : status === "talking" ? "2.5px solid #1a56db"
              : status === "listening" ? "2.5px solid #34D399"
              : "2.5px solid #CBD5E1",
            boxShadow:
              status === "talking" ? "0 0 32px rgba(26,86,219,0.18)"
              : status === "listening" ? "0 0 28px rgba(52,211,153,0.18)"
              : "0 2px 12px rgba(0,0,0,0.05)",
          }}
        >
          {/* Idle / Talking: HR monogram */}
          {(status === "idle" || status === "talking") && (
            <span
              className={`font-bold ${textSize} tracking-widest`}
              style={{ color: status === "talking" ? "#1a56db" : "#93C5FD" }}
            >
              HR
            </span>
          )}

          {/* Listening: 5-bar waveform */}
          {status === "listening" && (
            <div className={`flex items-center gap-1 ${size === "sm" ? "h-4" : "h-10"}`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  className={`block w-1.5 rounded-full animate-wave-bar wave-bar-${i}`}
                  style={{ height: "100%", transformOrigin: "bottom", background: "#10B981" }}
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
                  className={`block w-2.5 h-2.5 rounded-full animate-typing-dot typing-dot-${i}`}
                  style={{ background: "#94A3B8" }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status label — hide in sm */}
      <div className={`h-5 flex items-center justify-center ${size === "sm" ? "hidden" : ""}`}>
        {STATUS_LABEL[status] && (
          <span
            className="text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 rounded-full"
            style={
              status === "talking"
                ? { color: "#1a56db", background: "#EEF3FF", border: "1px solid #BFDBFE" }
                : status === "listening"
                ? { color: "#059669", background: "#ECFDF5", border: "1px solid #A7F3D0" }
                : { color: "#64748B", background: "#F1F5F9", border: "1px solid #E2E8F0" }
            }
          >
            {STATUS_LABEL[status]}
          </span>
        )}
      </div>
    </div>
  );
}
