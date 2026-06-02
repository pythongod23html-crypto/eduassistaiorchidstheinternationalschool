import { authedFetch } from "@/lib/authed-fetch";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Loader2, Sparkles, Printer, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/worksheet")({
  head: () => ({
    meta: [
      { property: "og:title", content: 'Printable Worksheet Generator — EduAssist.AI' },
      { property: "og:description", content: 'Generate printable CBSE practice worksheets with answer keys.' },
      { property: "og:url", content: "https://eduassistaiorchidstheinternationalschool.lovable.app/worksheet" },
      { property: "og:type", content: "website" },
      
      { title: "Printable Worksheet Generator — EduAssist.AI" },
      { name: "description", content: "Generate printable CBSE practice worksheets with answer keys." },
    ],
  }),
  component: WorksheetPage,
});

const GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "Social Science", "History", "Geography", "Political Science", "Economics",
  "English", "Hindi", "Computer Science", "Accountancy", "Business Studies",
];

type Q = { prompt: string; answer: string };
type Section = { heading: string; marks: number; questions: Q[] };
type Worksheet = { title: string; instructions: string; sections: Section[] };

function WorksheetPage() {
  const [grade, setGrade] = useState("8");
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Worksheet | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setSheet(null); setShowAnswers(false);
    try {
      const res = await authedFetch("/api/worksheet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, topic, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setSheet(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const totalMarks = sheet?.sections.reduce((sum, s) => sum + s.marks * s.questions.length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="print:hidden">
        <Header />
      </div>
      <main className="mx-auto max-w-4xl px-6 py-10 print:py-0 print:px-0 print:max-w-none">
        <div className="mb-6 print:hidden">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Printable <span className="text-gradient">Worksheet</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Generate exam-style worksheets you can print or share.</p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-soft print:hidden">
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
              <span className="text-muted-foreground">Difficulty</span>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as "easy" | "medium" | "hard")} className="rounded-lg border bg-background px-3 py-2">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-muted-foreground">Topic</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Light reflection"
                className="rounded-lg border bg-background px-3 py-2"
                onKeyDown={(e) => e.key === "Enter" && generate()}
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || !topic.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating…" : "Generate worksheet"}
            </button>
            {sheet && (
              <>
                <button
                  onClick={() => setShowAnswers((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition hover:bg-accent"
                >
                  {showAnswers ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showAnswers ? "Hide answers" : "Show answers"}
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm font-medium transition hover:bg-accent"
                >
                  <Printer className="h-4 w-4" />
                  Print / Save PDF
                </button>
              </>
            )}
            {error && <span className="text-sm text-destructive">{error}</span>}
          </div>
        </div>

        {sheet && (
          <article className="mt-8 rounded-2xl border bg-card p-8 shadow-soft print:mt-0 print:rounded-none print:border-0 print:shadow-none print:p-10">
            <header className="mb-6 border-b pb-4">
              <div className="flex flex-wrap items-end justify-between gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                <span>Class {grade} · {subject}</span>
                <span>Total marks: {totalMarks}</span>
              </div>
              <h2 className="mt-2 text-2xl font-bold print:text-3xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>{sheet.title}</h2>
              <p className="mt-1 text-sm italic text-muted-foreground">{sheet.instructions}</p>
              <div className="mt-4 flex flex-wrap gap-x-10 gap-y-2 text-sm">
                <span>Name: <span className="inline-block min-w-[12rem] border-b border-foreground/40" /></span>
                <span>Date: <span className="inline-block min-w-[8rem] border-b border-foreground/40" /></span>
              </div>
            </header>

            <div className="space-y-8">
              {sheet.sections.map((sec, si) => {
                let qNum = 0;
                // global numbering across sections
                const start = sheet.sections.slice(0, si).reduce((a, s) => a + s.questions.length, 0);
                return (
                  <section key={si}>
                    <h3 className="mb-3 text-lg font-semibold">
                      Section {String.fromCharCode(65 + si)} — {sec.heading}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({sec.marks} mark{sec.marks > 1 ? "s" : ""} each)
                      </span>
                    </h3>
                    <ol className="space-y-4">
                      {sec.questions.map((q, qi) => {
                        qNum = start + qi + 1;
                        return (
                          <li key={qi} className="flex gap-3">
                            <span className="font-medium">{qNum}.</span>
                            <div className="flex-1">
                              <p>{q.prompt}</p>
                              {showAnswers ? (
                                <p className="mt-1 rounded-md bg-muted/60 px-3 py-2 text-sm">
                                  <span className="font-semibold">Ans:</span> {q.answer}
                                </p>
                              ) : (
                                <div className="mt-2 space-y-2">
                                  <div className="h-px w-full border-b border-dashed border-foreground/30" />
                                  <div className="h-px w-full border-b border-dashed border-foreground/30" />
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                );
              })}
            </div>

            <footer className="mt-10 border-t pt-3 text-center text-xs text-muted-foreground print:fixed print:bottom-4 print:left-0 print:right-0">
              Generated with EduAssist.AI
            </footer>
          </article>
        )}
      </main>

      <style>{`
        @media print {
          @page { size: A4; margin: 18mm; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  );
}
