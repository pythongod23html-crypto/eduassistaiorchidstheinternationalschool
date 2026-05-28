import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Clock, FileText, Upload, Send, CheckCircle2, Sparkles, AlertTriangle, Zap, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/exam-mode")({
  head: () => ({
    meta: [
      { title: "Mock Exam Mode — EduAssist.AI" },
      { name: "description", content: "Distraction-free timed mock exam with Spark's grading rubric." },
    ],
  }),
  component: ExamModePage,
});

const EXAM_MINUTES = 60;

function fmt(s: number) {
  const h = Math.floor(s / 3600).toString().padStart(2, "0");
  const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

function ExamModePage() {
  const [seconds, setSeconds] = useState(EXAM_MINUTES * 60);
  const [running, setRunning] = useState(true);
  const [answer, setAnswer] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!running || submitted) return;
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setSubmitted(true);
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, submitted]);

  const onFile = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) return;
    const r = new FileReader();
    r.onload = () => setImageData(r.result as string);
    r.readAsDataURL(file);
  };

  const submit = () => {
    setSubmitted(true);
    setRunning(false);
  };

  const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const lowTime = seconds < 5 * 60;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Strict top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-elegant">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mock Exam Mode</p>
              <h1 className="text-sm font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
                Spark tutor is disabled during this exam
              </h1>
            </div>
          </div>
          <div className={`flex items-center gap-3 rounded-2xl border px-5 py-2.5 ${lowTime ? "border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400" : "border-border bg-card"}`}>
            <Clock className={`h-5 w-5 ${lowTime ? "animate-pulse" : ""}`} />
            <span className="font-mono text-2xl font-extrabold tabular-nums" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              {fmt(seconds)}
            </span>
          </div>
          <button
            onClick={submit}
            disabled={submitted}
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95 disabled:opacity-50"
          >
            <Send className="h-4 w-4" /> Submit Exam
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.main
            key="exam"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 gap-6 p-6 lg:grid-cols-2"
          >
            {/* Question viewer */}
            <section className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Question Paper</h2>
                <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">Section A</span>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <h3>Q1. (5 marks)</h3>
                  <p>
                    Derive the quadratic formula starting from the standard form
                    <code> ax² + bx + c = 0 </code> using the method of completing the square.
                    Show every step clearly.
                  </p>
                  <h3>Q2. (3 marks)</h3>
                  <p>
                    Solve <code>2x² − 7x + 3 = 0</code> using the quadratic formula and verify
                    your roots by substitution.
                  </p>
                  <h3>Q3. (2 marks)</h3>
                  <p>
                    For what values of <code>k</code> does the equation
                    <code> x² + kx + 4 = 0 </code> have equal real roots?
                  </p>
                  <hr />
                  <p className="text-xs text-muted-foreground">
                    Instructions: Answer all questions. You may upload a photo of handwritten work.
                  </p>
                </div>
              </div>
            </section>

            {/* Answer panel */}
            <section className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <div className="flex items-center gap-2 border-b border-border px-5 py-3">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Your Answer</h2>
                <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">{wordCount} words</span>
              </div>
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here. Show all working clearly…"
                className="min-h-[280px] flex-1 resize-none bg-transparent p-5 text-sm leading-relaxed text-foreground focus:outline-none"
              />
              {imageData && (
                <div className="border-t border-border p-3">
                  <div className="relative inline-block">
                    <img src={imageData} alt="Uploaded work" className="max-h-40 rounded-lg border border-border" />
                    <button
                      onClick={() => setImageData(null)}
                      className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-foreground text-background"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between gap-2 border-t border-border bg-secondary/40 px-4 py-3">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-xs font-semibold text-foreground transition hover:bg-accent"
                >
                  <Upload className="h-3.5 w-3.5" /> Upload handwritten work
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <AlertTriangle className="h-3 w-3" /> AI tutor & Socratic hints are disabled
                </p>
              </div>
            </section>
          </motion.main>
        ) : (
          <ExamReport key="report" answer={answer} timeUsed={EXAM_MINUTES * 60 - seconds} hasImage={!!imageData} />
        )}
      </AnimatePresence>
    </div>
  );
}

function ExamReport({ answer, timeUsed, hasImage }: { answer: string; timeUsed: number; hasImage: boolean }) {
  // Simulated scoring (mocked Spark analysis)
  const words = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const base = Math.min(85, 40 + Math.floor(words / 4) + (hasImage ? 8 : 0));
  const total = Math.max(20, Math.min(95, base));
  const breakdown = [
    { name: "Conceptual clarity", score: Math.min(10, Math.round(total / 10)), max: 10 },
    { name: "Step-by-step working", score: Math.min(10, Math.round((total - 5) / 10)), max: 10 },
    { name: "Final accuracy", score: Math.min(10, Math.round((total - 8) / 10)), max: 10 },
    { name: "Presentation", score: hasImage ? 9 : 7, max: 10 },
  ];
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto w-full max-w-4xl flex-1 p-6"
    >
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-elegant">
        <div className="relative overflow-hidden gradient-primary p-8 text-primary-foreground">
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" /> Spark grading report
              </p>
              <h1 className="mt-2 text-3xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
                Exam Rubric & Score
              </h1>
              <p className="mt-1 text-sm text-primary-foreground/85">
                Time used: {Math.floor(timeUsed / 60)}m {timeUsed % 60}s · {words} words written
              </p>
            </div>
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Trophy className="h-6 w-6" />
              <p className="mt-1 text-2xl font-extrabold tabular-nums">{total}</p>
              <p className="text-[10px] uppercase tracking-wider">/ 100</p>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-8">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Rubric breakdown</h2>
            <div className="mt-4 space-y-3">
              {breakdown.map((b) => (
                <div key={b.name}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{b.name}</span>
                    <span className="font-mono tabular-nums">{b.score} / {b.max}</span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-2 rounded-full gradient-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(b.score / b.max) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-secondary/40 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> What you did well
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
              <li>Clear attempt at deriving the formula with structured steps.</li>
              <li>Correct identification of coefficients in Q2.</li>
              {hasImage && <li>Handwritten work uploaded for clarity — well organised.</li>}
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Where Spark would push you
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/90">
              <li>Justify each algebraic move when completing the square.</li>
              <li>For Q3, state the discriminant condition explicitly before solving.</li>
              <li>Always verify roots — even one substitution earns presentation marks.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-xs text-muted-foreground">
              This report is generated by Spark and saved to your memory ledger.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
            >
              Take another exam
            </button>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
