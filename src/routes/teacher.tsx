import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useState } from "react";
import { GraduationCap, Sparkles, Loader2, Megaphone, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher AI Assistant — EduAssist.AI" },
      { name: "description", content: "Generate quizzes, worksheets, and homework with a single prompt. Share with your class." },
    ],
  }),
  component: TeacherPage,
});

type Pack = {
  title: string;
  instructions: string;
  difficulty: string;
  mcqs: { question: string; options: string[]; answerIndex: number }[];
  shortAnswers: { question: string; answer: string }[];
  longAnswers: { question: string; answer: string }[];
  answerKey: string;
};

function TeacherPage() {
  const { session, role } = useAuth();
  const [grade, setGrade] = useState("6");
  const [subject, setSubject] = useState("Science");
  const [kind, setKind] = useState<"quiz" | "worksheet" | "homework" | "test">("quiz");
  const [prompt, setPrompt] = useState("Create a Class 6 science quiz on motion");
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);

  // Announcement
  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [posting, setPosting] = useState(false);

  async function generate() {
    setLoading(true);
    setPack(null);
    try {
      const r = await fetch("/api/teacher-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, grade, subject, kind }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setPack(j);
      toast.success("Generated!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function postAnnouncement() {
    if (!session) return toast.error("Sign in first.");
    if (annTitle.trim().length < 3) return toast.error("Add a title.");
    setPosting(true);
    const { error } = await supabase.from("announcements").insert({
      created_by: session.user.id,
      title: annTitle,
      body: annBody,
      audience: "all",
    });
    setPosting(false);
    if (error) return toast.error(error.message);
    setAnnTitle("");
    setAnnBody("");
    toast.success("Announcement posted.");
  }

  const canPostAnn = role === "admin" || role === "teacher";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <GraduationCap className="h-4 w-4" /> Teacher AI Assistant
          </p>
          <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Type a prompt — get a <span className="text-gradient">full classroom pack</span>
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            MCQs, short / long questions, instructions, difficulty rating, and an answer key — all CBSE / NCERT-aligned.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          <section className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-sm font-bold">Build material</h2>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <label className="text-xs font-semibold">Class
                  <select value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold col-span-2">Subject
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                    {["Mathematics","Science","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science"].map(s => <option key={s}>{s}</option>)}
                  </select>
                </label>
              </div>
              <label className="mt-3 block text-xs font-semibold">Format
                <select value={kind} onChange={(e) => setKind(e.target.value as any)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                  <option value="quiz">Quiz</option>
                  <option value="worksheet">Worksheet</option>
                  <option value="homework">Homework</option>
                  <option value="test">Revision test</option>
                </select>
              </label>
              <label className="mt-3 block text-xs font-semibold">Prompt
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="mt-1 h-28 w-full resize-y rounded-md border border-input bg-background p-3 text-sm"
                />
              </label>
              <button
                onClick={generate}
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating..." : "Generate"}
              </button>
            </div>

            {canPostAnn && (
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h2 className="flex items-center gap-2 text-sm font-bold">
                  <Megaphone className="h-4 w-4 text-primary" /> Post announcement
                </h2>
                <input
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Title (e.g. Homework for Tuesday)"
                  className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
                <textarea
                  value={annBody}
                  onChange={(e) => setAnnBody(e.target.value)}
                  placeholder="Details for students and parents..."
                  className="mt-2 h-24 w-full resize-y rounded-md border border-input bg-background p-3 text-sm"
                />
                <button
                  onClick={postAnnouncement}
                  disabled={posting}
                  className="mt-3 inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-xs font-semibold hover:bg-accent"
                >
                  <Send className="h-3 w-3" /> Publish
                </button>
              </div>
            )}

            {!canPostAnn && (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-4 text-xs text-muted-foreground">
                Sign in as a teacher or admin to post announcements and assignments.{" "}
                <Link to="/login" className="font-semibold text-primary">Sign in</Link>
              </div>
            )}
          </section>

          <section>
            {!pack && (
              <div className="flex h-full min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                <div>
                  <GraduationCap className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">Your generated pack will appear here.</p>
                </div>
              </div>
            )}
            {pack && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>{pack.title}</h2>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">{pack.difficulty}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{pack.instructions}</p>
                </div>

                <Section title="MCQs">
                  <ol className="space-y-3 text-sm">
                    {pack.mcqs.map((q, i) => (
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
                </Section>

                <Section title="Short answer">
                  <ol className="space-y-2 text-sm">
                    {pack.shortAnswers.map((q, i) => (
                      <li key={i} className="rounded-xl border border-border bg-background p-3">
                        <p className="font-semibold">{i + 1}. {q.question}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{q.answer}</p>
                      </li>
                    ))}
                  </ol>
                </Section>

                <Section title="Long answer">
                  <ol className="space-y-2 text-sm">
                    {pack.longAnswers.map((q, i) => (
                      <li key={i} className="rounded-xl border border-border bg-background p-3">
                        <p className="font-semibold">{i + 1}. {q.question}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{q.answer}</p>
                      </li>
                    ))}
                  </ol>
                </Section>

                <Section title="Answer key">
                  <pre className="whitespace-pre-wrap rounded-xl border border-border bg-background p-3 text-xs">{pack.answerKey}</pre>
                </Section>
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <h3 className="text-sm font-bold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}
