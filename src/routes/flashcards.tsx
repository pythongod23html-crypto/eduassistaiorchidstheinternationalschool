import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Loader2, Sparkles, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards Generator — EduAssist.AI" },
      { name: "description", content: "Generate CBSE study flashcards on any topic and review with flip animations." },
    ],
  }),
  component: FlashcardsPage,
});

const GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "Social Science", "History", "Geography", "Political Science", "Economics",
  "English", "Hindi", "Computer Science", "Accountancy", "Business Studies",
];

type Card = { front: string; back: string; hint?: string };
type Deck = { title: string; cards: Card[] };

function FlashcardsPage() {
  const [grade, setGrade] = useState("8");
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setDeck(null); setIdx(0); setFlipped(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "flashcards", grade, subject, topic, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setDeck(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const next = () => { if (!deck) return; setFlipped(false); setIdx((i) => Math.min(i + 1, deck.cards.length - 1)); };
  const prev = () => { setFlipped(false); setIdx((i) => Math.max(i - 1, 0)); };

  const card = deck?.cards[idx];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Flashcards <span className="text-gradient">Generator</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Memorize faster with AI-generated study cards.</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Grade</span>
              <select value={grade} onChange={(e) => setGrade(e.target.value)} className="rounded-lg border bg-background px-3 py-2">
                {GRADES.map((g) => <option key={g} value={g}>Class {g}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Subject</span>
              <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-lg border bg-background px-3 py-2">
                {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Cards</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-lg border bg-background px-3 py-2">
                {[5, 8, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2 md:col-span-4">
              <span className="text-muted-foreground">Topic</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
                placeholder="e.g. Periodic Table, French Revolution, Trigonometry Identities"
                className="rounded-lg border bg-background px-3 py-2"
              />
            </label>
          </div>
          <button
            onClick={generate}
            disabled={loading || !topic.trim()}
            className="mt-4 inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Generating…" : "Generate Flashcards"}
          </button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {deck && card && (
          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{deck.title}</h2>
              <span className="text-sm text-muted-foreground">{idx + 1} / {deck.cards.length}</span>
            </div>

            <button
              onClick={() => setFlipped((f) => !f)}
              className="group relative block h-72 w-full select-none rounded-2xl border bg-card p-8 text-left shadow-elegant transition hover:shadow-lg"
              style={{ perspective: "1200px" }}
            >
              <div
                className="relative h-full w-full transition-transform duration-500"
                style={{ transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "none" }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center" style={{ backfaceVisibility: "hidden" }}>
                  <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Front</span>
                  <p className="text-2xl font-semibold">{card.front}</p>
                  {card.hint && <p className="mt-3 text-sm text-muted-foreground italic">Hint: {card.hint}</p>}
                  <p className="mt-6 text-xs text-muted-foreground">Click to flip</p>
                </div>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <span className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">Back</span>
                  <p className="text-xl">{card.back}</p>
                </div>
              </div>
            </button>

            <div className="mt-5 flex items-center justify-between gap-3">
              <button onClick={prev} disabled={idx === 0} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-secondary disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button onClick={() => { setIdx(0); setFlipped(false); }} className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
                <RotateCcw className="h-4 w-4" /> Restart
              </button>
              <button onClick={next} disabled={idx === deck.cards.length - 1} className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60">
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}