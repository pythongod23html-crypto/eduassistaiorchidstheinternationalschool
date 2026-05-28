import { cn } from "@/lib/utils";
import clauseImg from "@/assets/clause-tutor.png";

type State = "idle" | "thinking" | "speaking" | "answering";

interface ClauseAvatarProps {
  state?: State;
  size?: number;
  className?: string;
}

/**
 * Clause — the EduAssist.AI tutor mascot.
 * A soft glowing squircle blob with a friendly face.
 * States:
 *  - idle: gentle floating + breathing, eyes open, smiling
 *  - thinking: eyes closed happily, rotating aura rings
 *  - speaking: subtle wobble, mouth animates
 */
export function ClauseAvatar({ state = "idle", size = 96, className }: ClauseAvatarProps) {
  const thinking = state === "thinking";
  const answering = state === "answering";
  const speaking = state === "speaking";
  return (
    <div
      className={cn("clause-wrap relative inline-block select-none", className)}
      style={{ width: size, height: size }}
      aria-label="Clause the AI tutor"
    >
      {/* outer soft glow */}
      <div className="clause-glow clause-glow-pink absolute inset-[-22%] rounded-full blur-2xl" />
      <div className="clause-glow clause-glow-mint absolute inset-[-22%] rounded-full blur-2xl" />

      {/* rotating aura rings — only visible while thinking */}
      <div
        className={cn(
          "clause-rings absolute inset-[-10%] transition-opacity duration-500",
          thinking || answering ? "opacity-100" : "opacity-0",
        )}
      >
        <svg viewBox="0 0 100 100" className="clause-ring-a absolute inset-0 h-full w-full">
          <circle cx="50" cy="50" r="44" fill="none" stroke="url(#clause-grad-a)" strokeWidth="4" strokeLinecap="round" strokeDasharray="60 220" />
          <defs>
            <linearGradient id="clause-grad-a" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#67e8f9" />
            </linearGradient>
          </defs>
        </svg>
        <svg viewBox="0 0 100 100" className="clause-ring-b absolute inset-0 h-full w-full">
          <circle cx="50" cy="50" r="46" fill="none" stroke="url(#clause-grad-b)" strokeWidth="3" strokeLinecap="round" strokeDasharray="40 240" />
          <defs>
            <linearGradient id="clause-grad-b" x1="1" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="100%" stopColor="#7dd3fc" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* the tutor body — cartoon robot mascot */}
      <div
        className={cn(
          "clause-blob relative h-full w-full",
          thinking && "clause-blob-thinking",
          speaking && "clause-blob-speak",
          answering && "clause-blob-answer",
        )}
      >
        <img
          src={clauseImg}
          alt="Clause"
          draggable={false}
          className="h-full w-full object-contain drop-shadow-[0_8px_24px_rgba(120,160,255,0.45)]"
        />
      </div>

      {/* answering — scanning band sweeps across the blob with shimmering glyphs */}
      {answering && (
        <div className="clause-scan-wrap pointer-events-none absolute left-0 right-0 top-1/2 -translate-y-1/2">
          <div className="clause-scan relative mx-auto flex items-center justify-around overflow-hidden rounded-[14px] border border-sky-300/70 bg-sky-100/40 px-2 backdrop-blur-[2px]"
               style={{ width: "108%", height: `${Math.max(18, size * 0.28)}px`, marginLeft: "-4%" }}>
            <span className="clause-glyph" />
            <span className="clause-glyph clause-glyph-2" />
            <span className="clause-glyph clause-glyph-3" />
            <span className="clause-glyph clause-glyph-4" />
            <div className="clause-scan-sheen absolute inset-y-0 w-1/3" />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClauseAvatar;