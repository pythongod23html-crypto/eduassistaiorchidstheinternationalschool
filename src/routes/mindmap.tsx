import { authedFetch } from "@/lib/authed-fetch";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Loader2, Sparkles, Network } from "lucide-react";

export const Route = createFileRoute("/mindmap")({
  head: () => ({
    meta: [
      { property: "og:title", content: 'Mind Map Generator — EduAssist.AI' },
      { property: "og:description", content: 'Visualize any CBSE topic as a structured, AI-generated mind map.' },
      { property: "og:url", content: "https://eduassistaiorchidstheinternationalschool.lovable.app/mindmap" },
      { property: "og:type", content: "website" },
      
      { title: "Mind Map Generator — EduAssist.AI" },
      { name: "description", content: "Visualize any CBSE topic as a structured, AI-generated mind map." },
    ],
  }),
  component: MindMapPage,
});

const GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "Social Science", "History", "Geography", "Political Science", "Economics",
  "English", "Hindi", "Computer Science", "Accountancy", "Business Studies",
];

type Child = { label: string; detail: string };
type Branch = { label: string; children: Child[] };
type MindMap = { title: string; summary: string; branches: Branch[] };

const BRANCH_COLORS = [
  "hsl(220 90% 56%)",
  "hsl(160 75% 42%)",
  "hsl(280 70% 58%)",
  "hsl(20 90% 56%)",
  "hsl(340 80% 58%)",
  "hsl(45 95% 50%)",
  "hsl(195 85% 48%)",
];

function MindMapPage() {
  const [grade, setGrade] = useState("8");
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<MindMap | null>(null);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setMap(null);
    try {
      const res = await authedFetch("/api/mindmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setMap(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Mind Map <span className="text-gradient">Generator</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Turn any topic into a clear, visual study map.</p>
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
            <label className="flex flex-col gap-1 text-sm sm:col-span-2">
              <span className="text-muted-foreground">Topic</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Trigonometric identities"
                className="rounded-lg border bg-background px-3 py-2"
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </label>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating…" : "Generate mind map"}
            </button>
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        </div>

        {map && (
          <section className="mt-8 rounded-2xl border bg-card p-6 shadow-soft">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>{map.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{map.summary}</p>
              </div>
              <Network className="h-6 w-6 text-muted-foreground" />
            </div>

            {/* Radial-feel hierarchical layout */}
            <div className="flex flex-col items-center gap-8">
              <div className="rounded-full bg-primary px-6 py-3 text-center font-semibold text-primary-foreground shadow-lg">
                {map.title}
              </div>

              <div className="grid w-full gap-5 md:grid-cols-2">
                {map.branches.map((b, i) => {
                  const color = BRANCH_COLORS[i % BRANCH_COLORS.length];
                  return (
                    <div
                      key={i}
                      className="rounded-xl border bg-background/60 p-5 shadow-sm transition hover:shadow-md"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: color }}
                        >
                          {i + 1}
                        </span>
                        <h3 className="text-lg font-semibold">{b.label}</h3>
                      </div>
                      <ul className="space-y-2">
                        {b.children.map((c, j) => (
                          <li key={j} className="flex gap-2">
                            <span
                              className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{ background: color }}
                            />
                            <div>
                              <div className="text-sm font-medium">{c.label}</div>
                              <div className="text-xs text-muted-foreground">{c.detail}</div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
