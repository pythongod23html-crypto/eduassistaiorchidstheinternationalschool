import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { Sparkles, FileText, Brain, ListChecks, Calculator, Target, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/revision")({
  head: () => ({
    meta: [
      { title: "Smart Revision Generator — EduAssist.AI" },
      { name: "description", content: "Paste a chapter or notes and instantly get summaries, flashcards, quizzes, and exam points." },
    ],
  }),
  component: RevisionPage,
});

type Pack = {
  title: string;
  summary: string;
  notes: string[];
  flashcards: { front: string; back: string }[];
  questions: { question: string; answer: string; type: string }[];
  quiz: { question: string; options: string[]; answerIndex: number }[];
  formulas: string[];
  examPoints: string[];
};

function RevisionPage() {
  const { session } = useAuth();
  const [grade, setGrade] = useState("10");
  const [subject, setSubject] = useState("Science");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleFile(file: File) {
    const text = await file.text();
    setContent(text.slice(0, 50000));
  }

  async function generate() {
    if (content.trim().length < 50) {
      toast.error("Add at least a paragraph of material.");
      return;
    }
    setLoading(true);
    setPack(null);
    try {
      const r = await fetch("/api/revision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, content }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setPack(j);
      toast.success("Revision pack ready!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate");
    } finally {
      setLoading(false);
    }
  }

  async function savePack() {
    if (!pack || !session) {
      toast.error("Sign in to save.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("study_packs").insert({
      created_by: session.user.id,
      title: pack.title,
      subject,
      grade,
      source_text: content.slice(0, 5000),
      payload: pack,
    });
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Saved to your library.");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="h-4 w-4" /> Smart Revision Generator
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Turn any chapter into a complete <span className="text-gradient">revision pack</span>
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Paste your notes, a PDF's text, or a chapter — get summaries, flashcards, important questions, a quiz, formulas and exam tips, calibrated to your CBSE grade.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
            <h2 className="text-sm font-bold">Material</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="text-xs font-semibold">Class
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="text-xs font-semibold">Subject
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  {["Mathematics","Science","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science"].map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label className="mt-4 block text-xs font-semibold">Paste chapter / notes
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the chapter, notes, or extracted PDF text here..."
                className="mt-1 h-72 w-full resize-y rounded-md border border-input bg-background p-3 text-sm"
              />
            </label>
            <label className="mt-3 block text-xs font-semibold">Or upload a .txt / .md file
              <input
                type="file"
                accept=".txt,.md,.text,text/plain"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                className="mt-1 block w-full text-xs"
              />
            </label>
            <button
              onClick={generate}
              disabled={loading}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Generating..." : "Generate revision pack"}
            </button>
          </section>

          <section>
            {!pack && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <div>
                  <Brain className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">Your revision pack will appear here.</p>
                </div>
              </div>
            )}
            {pack && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>{pack.title}</h2>
                      <p className="text-xs text-muted-foreground">Class {grade} · {subject}</p>
                    </div>
                    <button
                      onClick={savePack}
                      disabled={saving}
                      className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-60"
                    >
                      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                      Save to library
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{pack.summary}</p>
                </div>

                <Card icon={ListChecks} title="Revision notes">
                  <ul className="space-y-2 text-sm">
                    {pack.notes.map((n, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{n}</span></li>)}
                  </ul>
                </Card>

                <Card icon={Brain} title="Flashcards">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {pack.flashcards.map((f, i) => (
                      <div key={i} className="rounded-xl border border-border bg-background p-3">
                        <p className="text-xs font-semibold text-primary">{f.front}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{f.back}</p>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card icon={FileText} title="Important questions">
                  <ol className="space-y-3 text-sm">
                    {pack.questions.map((q, i) => (
                      <li key={i} className="rounded-xl border border-border bg-background p-3">
                        <p className="font-semibold">{i + 1}. {q.question} <span className="ml-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase">{q.type}</span></p>
                        <p className="mt-1 text-xs text-muted-foreground">{q.answer}</p>
                      </li>
                    ))}
                  </ol>
                </Card>

                <Card icon={Target} title="Practice quiz">
                  <ol className="space-y-3 text-sm">
                    {pack.quiz.map((q, i) => (
                      <li key={i} className="rounded-xl border border-border bg-background p-3">
                        <p className="font-semibold">{i + 1}. {q.question}</p>
                        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                          {q.options.map((o, j) => (
                            <li key={j} className={`rounded-md px-2 py-1 text-xs ${j === q.answerIndex ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground"}`}>
                              {String.fromCharCode(65 + j)}. {o}
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ol>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                  <Card icon={Calculator} title="Key formulas & definitions">
                    <ul className="space-y-2 text-sm">
                      {pack.formulas.map((f, i) => <li key={i} className="rounded-md bg-secondary/40 px-2 py-1">{f}</li>)}
                    </ul>
                  </Card>
                  <Card icon={Sparkles} title="Exam preparation points">
                    <ul className="space-y-2 text-sm">
                      {pack.examPoints.map((p, i) => <li key={i} className="flex gap-2"><span className="text-primary">★</span>{p}</li>)}
                    </ul>
                  </Card>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Card({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h3 className="flex items-center gap-2 text-sm font-bold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
