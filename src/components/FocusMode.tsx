import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Coffee,
  Sparkles,
  SkipForward,
  Settings2,
  Trophy,
  Lock,
  Flame,
  Star,
  Target,
  Crown,
  Footprints,
  Ban,
  Award,
  Medal,
  X,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

type Phase = "idle" | "focus" | "break" | "longBreak";

type Durations = {
  focus: number; // seconds
  break: number;
  longBreak: number;
  longBreakEvery: number; // every N focus sessions
};

const DEFAULTS: Durations = {
  focus: 25 * 60,
  break: 5 * 60,
  longBreak: 15 * 60,
  longBreakEvery: 4,
};

const STORAGE_KEY = "focus-mode-settings-v1";
const STATS_KEY = "focus-mode-stats-v1";

// ======================== BADGES ========================

export type BadgeId =
  | "first_focus"
  | "focused_five"
  | "deep_worker"
  | "marathon_runner"
  | "zen_master"
  | "streak_starter"
  | "daily_devoted"
  | "break_skipper"
  | "perfectionist";

export type BadgeDef = {
  id: BadgeId;
  name: string;
  description: string;
  icon: ReactNode;
  color: string;
};

export const BADGE_DEFS: BadgeDef[] = [
  {
    id: "first_focus",
    name: "First Focus",
    description: "Complete your first focus session",
    icon: <Star className="h-4 w-4" />,
    color: "#f59e0b",
  },
  {
    id: "focused_five",
    name: "Focused Five",
    description: "Complete 5 focus sessions",
    icon: <Target className="h-4 w-4" />,
    color: "#3b82f6",
  },
  {
    id: "deep_worker",
    name: "Deep Worker",
    description: "Complete 10 focus sessions",
    icon: <Flame className="h-4 w-4" />,
    color: "#ef4444",
  },
  {
    id: "marathon_runner",
    name: "Marathon Runner",
    description: "Complete 25 focus sessions",
    icon: <Footprints className="h-4 w-4" />,
    color: "#8b5cf6",
  },
  {
    id: "zen_master",
    name: "Zen Master",
    description: "Complete 50 focus sessions",
    icon: <Crown className="h-4 w-4" />,
    color: "#10b981",
  },
  {
    id: "streak_starter",
    name: "Streak Starter",
    description: "Complete 3 sessions in one day",
    icon: <Award className="h-4 w-4" />,
    color: "#f97316",
  },
  {
    id: "daily_devoted",
    name: "Daily Devoted",
    description: "Complete 8 sessions in one day",
    icon: <Medal className="h-4 w-4" />,
    color: "#ec4899",
  },
  {
    id: "break_skipper",
    name: "Break Skipper",
    description: "Skip a break at least once",
    icon: <Ban className="h-4 w-4" />,
    color: "#6366f1",
  },
  {
    id: "perfectionist",
    name: "Perfectionist",
    description: "Complete 5 sessions without skipping breaks",
    icon: <Trophy className="h-4 w-4" />,
    color: "#eab308",
  },
];

// ======================== TYPES ========================

type Stats = {
  totalCompleted: number;
  todayDate: string; // YYYY-MM-DD
  todayCount: number;
  consecutiveNoSkip: number;
  hasSkippedBreak: boolean;
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function loadStats(): Stats {
  if (typeof window === "undefined") {
    return { totalCompleted: 0, todayDate: todayStr(), todayCount: 0, consecutiveNoSkip: 0, hasSkippedBreak: false };
  }
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) {
      return { totalCompleted: 0, todayDate: todayStr(), todayCount: 0, consecutiveNoSkip: 0, hasSkippedBreak: false };
    }
    const s = JSON.parse(raw) as Stats;
    // Reset daily count if date changed
    if (s.todayDate !== todayStr()) {
      s.todayDate = todayStr();
      s.todayCount = 0;
    }
    return s;
  } catch {
    return { totalCompleted: 0, todayDate: todayStr(), todayCount: 0, consecutiveNoSkip: 0, hasSkippedBreak: false };
  }
}

function saveStats(s: Stats) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  } catch {
    /* noop */
  }
}

function loadBadges(): BadgeId[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("focus-mode-badges-v1");
    if (!raw) return [];
    return JSON.parse(raw) as BadgeId[];
  } catch {
    return [];
  }
}

function saveBadges(badges: BadgeId[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("focus-mode-badges-v1", JSON.stringify(badges));
  } catch {
    /* noop */
  }
}

function checkBadges(stats: Stats, existing: BadgeId[]): BadgeId[] {
  const have = new Set(existing);
  const newlyUnlocked: BadgeId[] = [];
  const maybe = (id: BadgeId, condition: boolean) => {
    if (condition && !have.has(id)) {
      have.add(id);
      newlyUnlocked.push(id);
    }
  };
  maybe("first_focus", stats.totalCompleted >= 1);
  maybe("focused_five", stats.totalCompleted >= 5);
  maybe("deep_worker", stats.totalCompleted >= 10);
  maybe("marathon_runner", stats.totalCompleted >= 25);
  maybe("zen_master", stats.totalCompleted >= 50);
  maybe("streak_starter", stats.todayCount >= 3);
  maybe("daily_devoted", stats.todayCount >= 8);
  maybe("break_skipper", stats.hasSkippedBreak);
  maybe("perfectionist", stats.consecutiveNoSkip >= 5);
  return newlyUnlocked;
}

// ======================== CONTEXT ========================

type Ctx = {
  phase: Phase;
  seconds: number; // remaining seconds in current phase
  totalSeconds: number; // total seconds for current phase
  running: boolean;
  onBreak: boolean; // break or longBreak overlay
  completedFocus: number;
  durations: Durations;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skipBreak: () => void;
  setDurations: (d: Partial<Durations>) => void;
  badges: BadgeId[];
  newBadges: BadgeId[];
  dismissNewBadge: (id: BadgeId) => void;
  stats: Stats;
};

const FocusCtx = createContext<Ctx | null>(null);

export function useFocusMode() {
  const ctx = useContext(FocusCtx);
  if (!ctx) throw new Error("useFocusMode must be used within FocusModeProvider");
  return ctx;
}

function loadDurations(): Durations {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    const parsed = JSON.parse(raw);
    return {
      focus: clamp(parsed.focus, 60, 90 * 60) || DEFAULTS.focus,
      break: clamp(parsed.break, 60, 60 * 60) || DEFAULTS.break,
      longBreak: clamp(parsed.longBreak, 60, 60 * 60) || DEFAULTS.longBreak,
      longBreakEvery: clamp(parsed.longBreakEvery, 2, 8) || DEFAULTS.longBreakEvery,
    };
  } catch {
    return DEFAULTS;
  }
}

function clamp(n: unknown, min: number, max: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(min, Math.min(max, Math.round(v)));
}

function phaseDuration(phase: Phase, d: Durations) {
  if (phase === "focus") return d.focus;
  if (phase === "break") return d.break;
  if (phase === "longBreak") return d.longBreak;
  return d.focus;
}

function playChime() {
  try {
    const AC =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
        .AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    const master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);

    // A proper alarm: three rising bell-like tones with a soft sustain.
    // Sequence: 880Hz → 1175Hz → 1568Hz (A5 → D6 → G6).
    const notes: Array<{ freq: number; at: number; dur: number }> = [
      { freq: 880, at: 0.0, dur: 0.45 },
      { freq: 1174.66, at: 0.5, dur: 0.45 },
      { freq: 1567.98, at: 1.0, dur: 0.9 },
    ];

    const t0 = ctx.currentTime + 0.02;
    notes.forEach(({ freq, at, dur }) => {
      // Two oscillators per note for a richer bell texture.
      const oscA = ctx.createOscillator();
      const oscB = ctx.createOscillator();
      const g = ctx.createGain();
      oscA.type = "sine";
      oscB.type = "triangle";
      oscA.frequency.setValueAtTime(freq, t0 + at);
      oscB.frequency.setValueAtTime(freq * 2, t0 + at);
      oscA.connect(g);
      oscB.connect(g);
      g.connect(master);
      g.gain.setValueAtTime(0.0001, t0 + at);
      g.gain.exponentialRampToValueAtTime(0.6, t0 + at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      oscA.start(t0 + at);
      oscB.start(t0 + at);
      oscA.stop(t0 + at + dur + 0.05);
      oscB.stop(t0 + at + dur + 0.05);
    });

    const totalMs = (notes[notes.length - 1].at + notes[notes.length - 1].dur + 0.2) * 1000;
    setTimeout(() => ctx.close().catch(() => {}), totalMs + 200);
  } catch {
    /* noop */
  }
}

export function FocusModeProvider({ children }: { children: ReactNode }) {
  const [durations, setDurationsState] = useState<Durations>(DEFAULTS);
  const [phase, setPhase] = useState<Phase>("idle");
  const [running, setRunning] = useState(false);
  const [completedFocus, setCompletedFocus] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [badges, setBadges] = useState<BadgeId[]>([]);
  const [newBadges, setNewBadges] = useState<BadgeId[]>([]);
  const [stats, setStats] = useState<Stats>(() =>
    typeof window !== "undefined" ? loadStats() : { totalCompleted: 0, todayDate: todayStr(), todayCount: 0, consecutiveNoSkip: 0, hasSkippedBreak: false }
  );

  // Hydrate from localStorage on mount (client-only, avoids SSR mismatch).
  useEffect(() => {
    setDurationsState(loadDurations());
    setStats(loadStats());
    setBadges(loadBadges());
  }, []);

  // Drift-free timing: store the absolute end timestamp and the remaining
  // amount when paused. The ticker just bumps `now` once per second.
  const endAtRef = useRef<number | null>(null);
  const remainingRef = useRef<number>(durations.focus * 1000);

  // Keep remaining in sync when durations change while idle.
  useEffect(() => {
    if (phase === "idle" && !running) {
      remainingRef.current = durations.focus * 1000;
      setNow(Date.now());
    }
  }, [durations.focus, phase, running]);

  // RAF-throttled tick when running.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const tick = () => {
      setNow(Date.now());
      raf = window.setTimeout(tick, 250) as unknown as number;
    };
    tick();
    return () => clearTimeout(raf);
  }, [running]);

  const totalSeconds = phaseDuration(phase === "idle" ? "focus" : phase, durations);

  const seconds = (() => {
    if (!running || endAtRef.current == null) {
      return Math.max(0, Math.ceil(remainingRef.current / 1000));
    }
    return Math.max(0, Math.ceil((endAtRef.current - now) / 1000));
  })();

  // Detect phase completion.
  const completingRef = useRef(false);
  useEffect(() => {
    if (!running || endAtRef.current == null) return;
    if (now < endAtRef.current) return;
    if (completingRef.current) return;
    completingRef.current = true;

    const finishedPhase = phase;
    playChime();
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(
          finishedPhase === "focus" ? "Focus session complete" : "Break over",
          {
            body:
              finishedPhase === "focus"
                ? "Nice work. Time for a break."
                : "Back to it — your next focus session is ready.",
            silent: true,
          },
        );
      } catch {
        /* noop */
      }
    }

    if (finishedPhase === "focus") {
      const nextCount = completedFocus + 1;
      setCompletedFocus(nextCount);

      // Update persistent stats and badges
      setStats((prev) => {
        const nextStats: Stats = {
          ...prev,
          totalCompleted: prev.totalCompleted + 1,
          todayCount: prev.todayDate === todayStr() ? prev.todayCount + 1 : 1,
          todayDate: todayStr(),
          consecutiveNoSkip: prev.consecutiveNoSkip + 1,
        };
        saveStats(nextStats);

        const currentBadges = loadBadges();
        const newlyUnlocked = checkBadges(nextStats, currentBadges);
        if (newlyUnlocked.length) {
          const allBadges = [...currentBadges, ...newlyUnlocked];
          saveBadges(allBadges);
          setBadges(allBadges);
          setNewBadges((prevNew) => [...prevNew, ...newlyUnlocked]);
        }
        return nextStats;
      });

      const goLong = nextCount % durations.longBreakEvery === 0;
      const nextPhase: Phase = goLong ? "longBreak" : "break";
      const ms = phaseDuration(nextPhase, durations) * 1000;
      endAtRef.current = Date.now() + ms;
      remainingRef.current = ms;
      setPhase(nextPhase);
    } else {
      // break ended → queue next focus, paused (user starts it).
      const ms = durations.focus * 1000;
      endAtRef.current = null;
      remainingRef.current = ms;
      setPhase("focus");
      setRunning(false);
    }

    // Allow next completion to fire.
    setTimeout(() => {
      completingRef.current = false;
    }, 0);
  }, [now, running, phase, completedFocus, durations]);

  const start = useCallback(() => {
    let p = phase;
    if (p === "idle") {
      p = "focus";
      setPhase("focus");
      remainingRef.current = durations.focus * 1000;
    }
    // Resume from remaining.
    endAtRef.current = Date.now() + remainingRef.current;
    setRunning(true);
    setNow(Date.now());
    // Request notification permission lazily on first start.
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, [phase, durations.focus]);

  const pause = useCallback(() => {
    if (endAtRef.current != null) {
      remainingRef.current = Math.max(0, endAtRef.current - Date.now());
    }
    endAtRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    endAtRef.current = null;
    remainingRef.current = durations.focus * 1000;
    setRunning(false);
    setPhase("idle");
    setCompletedFocus(0);
  }, [durations.focus]);

  const skipBreak = useCallback(() => {
    endAtRef.current = null;
    remainingRef.current = durations.focus * 1000;
    setRunning(false);
    setPhase("idle");

    // Update stats: mark break skipped, reset consecutive
    setStats((prev) => {
      const nextStats: Stats = {
        ...prev,
        hasSkippedBreak: true,
        consecutiveNoSkip: 0,
      };
      saveStats(nextStats);

      const currentBadges = loadBadges();
      const newlyUnlocked = checkBadges(nextStats, currentBadges);
      if (newlyUnlocked.length) {
        const allBadges = [...currentBadges, ...newlyUnlocked];
        saveBadges(allBadges);
        setBadges(allBadges);
        setNewBadges((prevNew) => [...prevNew, ...newlyUnlocked]);
      }
      return nextStats;
    });
  }, [durations.focus]);

  const dismissNewBadge = useCallback((id: BadgeId) => {
    setNewBadges((prev) => prev.filter((b) => b !== id));
  }, []);

  const setDurations = useCallback((d: Partial<Durations>) => {
    setDurationsState((prev) => {
      const next: Durations = {
        focus: clamp(d.focus ?? prev.focus, 60, 90 * 60),
        break: clamp(d.break ?? prev.break, 60, 60 * 60),
        longBreak: clamp(d.longBreak ?? prev.longBreak, 60, 60 * 60),
        longBreakEvery: clamp(d.longBreakEvery ?? prev.longBreakEvery, 2, 8),
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      phase,
      seconds,
      totalSeconds,
      running,
      onBreak: phase === "break" || phase === "longBreak",
      completedFocus,
      durations,
      start,
      pause,
      reset,
      skipBreak,
      setDurations,
      badges,
      newBadges,
      dismissNewBadge,
      stats,
    }),
    [phase, seconds, totalSeconds, running, completedFocus, durations, start, pause, reset, skipBreak, setDurations, badges, newBadges, dismissNewBadge, stats],
  );

  return (
    <FocusCtx.Provider value={value}>
      {children}
      <BreakOverlay />
      <BadgeUnlockToasts />
    </FocusCtx.Provider>
  );
}

function fmt(s: number) {
  const safe = Math.max(0, s | 0);
  const m = Math.floor(safe / 60).toString().padStart(2, "0");
  const sec = (safe % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

// ======================== BADGE UI ========================

function BadgeUnlockToasts() {
  const { newBadges, dismissNewBadge } = useFocusMode();
  return (
    <AnimatePresence>
      {newBadges.map((id) => {
        const def = BADGE_DEFS.find((b) => b.id === id);
        if (!def) return null;
        return (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-[200] flex items-center gap-3 rounded-2xl border border-border bg-popover px-4 py-3 shadow-elegant"
          >
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: def.color }}
            >
              {def.icon}
            </div>
            <div>
              <p className="text-xs font-semibold text-popover-foreground">Badge Unlocked!</p>
              <p className="text-[11px] text-muted-foreground">{def.name}</p>
            </div>
            <button
              onClick={() => dismissNewBadge(id)}
              className="ml-1 grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}

function BadgeShowcase({ onClose }: { onClose: () => void }) {
  const { badges, stats } = useFocusMode();
  return (
    <motion.div
      initial={{ opacity: 0, y: -4, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-elegant"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Your Badges</p>
        <button
          onClick={onClose}
          className="grid h-5 w-5 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="mb-3 flex gap-2 rounded-xl bg-secondary/50 p-2">
        <div className="flex-1 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">{stats.totalCompleted}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">{stats.todayCount}</p>
          <p className="text-[10px] text-muted-foreground">Today</p>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 text-center">
          <p className="text-lg font-bold tabular-nums text-foreground">{badges.length}</p>
          <p className="text-[10px] text-muted-foreground">Badges</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {BADGE_DEFS.map((def) => {
          const unlocked = badges.includes(def.id);
          return (
            <div
              key={def.id}
              className={`flex flex-col items-center rounded-xl border p-2 transition ${
                unlocked
                  ? "border-border bg-card"
                  : "border-dashed border-border/60 bg-muted/30 opacity-50"
              }`}
              title={def.description}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-white ${
                  unlocked ? "" : "bg-muted-foreground/30"
                }`}
                style={unlocked ? { backgroundColor: def.color } : {}}
              >
                {unlocked ? def.icon : <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <span className="mt-1.5 text-center text-[10px] font-medium leading-tight text-foreground">
                {def.name}
              </span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ======================== WIDGET ========================

export function FocusTimerWidget({ className = "" }: { className?: string }) {
  const {
    phase,
    seconds,
    totalSeconds,
    running,
    completedFocus,
    durations,
    start,
    pause,
    reset,
    setDurations,
    badges,
  } = useFocusMode();
  const active = phase !== "idle";
  const progress = totalSeconds > 0 ? 1 - seconds / totalSeconds : 0;
  const [openSettings, setOpenSettings] = useState(false);
  const [openBadges, setOpenBadges] = useState(false);

  return (
    <div
      className={`relative flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 shadow-soft backdrop-blur ${className}`}
      aria-label="Focus mode timer"
    >
      <ProgressRing progress={progress} active={active}>
        <Zap className="h-3 w-3" />
      </ProgressRing>
      <span className="font-mono text-sm font-bold tabular-nums" aria-live="polite">
        {fmt(seconds)}
      </span>
      {!running ? (
        <button
          onClick={start}
          aria-label="Start focus session"
          className="grid h-6 w-6 place-items-center rounded-full text-foreground transition hover:bg-accent"
        >
          <Play className="h-3.5 w-3.5" />
        </button>
      ) : (
        <button
          onClick={pause}
          aria-label="Pause focus session"
          className="grid h-6 w-6 place-items-center rounded-full text-foreground transition hover:bg-accent"
        >
          <Pause className="h-3.5 w-3.5" />
        </button>
      )}
      {active && (
        <button
          onClick={reset}
          aria-label="Reset timer"
          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      )}
      <button
        onClick={() => setOpenSettings((v) => !v)}
        aria-label="Timer settings"
        className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Settings2 className="h-3.5 w-3.5" />
      </button>
      <button
        onClick={() => setOpenBadges((v) => !v)}
        aria-label="Your badges"
        className={`grid h-6 w-6 place-items-center rounded-full transition hover:bg-accent ${
          badges.length > 0 ? "text-primary" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <Trophy className="h-3.5 w-3.5" />
        {badges.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground">
            {badges.length}
          </span>
        )}
      </button>
      {completedFocus > 0 && (
        <span
          className="ml-1 rounded-full bg-secondary px-1.5 text-[10px] font-bold tabular-nums text-secondary-foreground"
          title={`${completedFocus} focus session${completedFocus === 1 ? "" : "s"} completed`}
        >
          {completedFocus}
        </span>
      )}

      <AnimatePresence>
        {openSettings && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-elegant"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Timer settings
            </p>
            <SettingRow
              label="Focus"
              value={Math.round(durations.focus / 60)}
              min={1}
              max={90}
              suffix="min"
              onChange={(v) => setDurations({ focus: v * 60 })}
            />
            <SettingRow
              label="Short break"
              value={Math.round(durations.break / 60)}
              min={1}
              max={60}
              suffix="min"
              onChange={(v) => setDurations({ break: v * 60 })}
            />
            <SettingRow
              label="Long break"
              value={Math.round(durations.longBreak / 60)}
              min={1}
              max={60}
              suffix="min"
              onChange={(v) => setDurations({ longBreak: v * 60 })}
            />
            <SettingRow
              label="Long break every"
              value={durations.longBreakEvery}
              min={2}
              max={8}
              suffix="sessions"
              onChange={(v) => setDurations({ longBreakEvery: v })}
            />
            <button
              onClick={() => setOpenSettings(false)}
              className="mt-2 w-full rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground transition hover:bg-accent"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openBadges && <BadgeShowcase onClose={() => setOpenBadges(false)} />}
      </AnimatePresence>
    </div>
  );
}

function SettingRow({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-2">
      <span className="text-xs text-foreground">{label}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          className="grid h-6 w-6 place-items-center rounded-md border border-border text-xs hover:bg-accent"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="w-16 text-center font-mono text-xs tabular-nums">
          {value} {suffix}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          className="grid h-6 w-6 place-items-center rounded-md border border-border text-xs hover:bg-accent"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function ProgressRing({
  progress,
  active,
  children,
}: {
  progress: number;
  active: boolean;
  children: ReactNode;
}) {
  const size = 24;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = c * Math.max(0, Math.min(1, progress));
  return (
    <div className="relative flex h-6 w-6 items-center justify-center">
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-border"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          className={active ? "text-primary transition-[stroke-dasharray] duration-500" : "text-muted-foreground/40"}
        />
      </svg>
      <span
        className={`grid h-4 w-4 place-items-center rounded-full ${active ? "text-primary" : "text-muted-foreground"}`}
      >
        {children}
      </span>
    </div>
  );
}

function BreakOverlay() {
  const { onBreak, phase, seconds, totalSeconds, completedFocus, skipBreak } = useFocusMode();
  const isLong = phase === "longBreak";
  const progress = totalSeconds > 0 ? 1 - seconds / totalSeconds : 0;
  return (
    <AnimatePresence>
      {onBreak && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.92, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative mx-4 max-w-md overflow-hidden rounded-3xl border border-white/30 bg-white/40 p-10 text-center shadow-elegant backdrop-blur-2xl dark:border-white/10 dark:bg-white/5"
          >
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 8, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant"
              >
                <Coffee className="h-8 w-8" />
              </motion.div>
              <h2
                className="mt-6 text-2xl font-bold text-foreground"
                style={{ fontFamily: "Sora, Inter, sans-serif" }}
              >
                {isLong ? "Long break — you earned it." : "Great session! Stretch and rest your eyes."}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Spark has paused your chat. Look 20 feet away and breathe.
              </p>

              <div className="relative mx-auto mt-8 h-40 w-40">
                <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="none" className="text-border" />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 45 * progress} ${2 * Math.PI * 45}`}
                    className="text-primary transition-[stroke-dasharray] duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p
                    className="font-mono text-4xl font-extrabold text-gradient tabular-nums"
                    style={{ fontFamily: "Sora, Inter, sans-serif" }}
                  >
                    {fmt(seconds)}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-muted-foreground">
                    {isLong ? "long break" : "break"}
                  </p>
                </div>
              </div>

              {completedFocus > 0 && (
                <p className="mt-4 text-xs text-muted-foreground">
                  {completedFocus} focus session{completedFocus === 1 ? "" : "s"} completed today
                </p>
              )}

              <button
                onClick={skipBreak}
                className="mt-8 inline-flex items-center gap-2 rounded-full border border-border bg-background/80 px-5 py-2 text-xs font-semibold text-foreground transition hover:bg-accent"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip break
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
