import { authedFetch } from "@/lib/authed-fetch";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useState } from "react";
import { ClipboardList, Loader2, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/weekly-quiz")({
  head: () => ({
    meta: [
      { property: "og:title", content: 'Weekly Quiz — EduAssist.AI' },
      { property: "og:description", content: 'Generate and publish a weekly quiz for all students.' },
      { property: "og:url", content: "https://eduassistaiorchidstheinternationalschool.lovable.app/weekly-quiz" },
      { property: "og:type", content: "website" },
      
      { title: "Weekly Quiz — EduAssist.AI" },
      { name: "description", content: "Generate and publish a weekly quiz for all students." },
    ],
  }),
  component: WeeklyQuizPage,
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

function WeeklyQuizPage() {
  const { session, role } = useAuth();
  const allowed = role === "teacher" || role === "admin";
  const [grade, setGrade] = useState("6");
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [pack, setPack] = useState<Pack | null>(null);
  const [publishing, setPublishing] = useState(false);

  async function generate() {
    setLoading(true);
    setPack(null);
    try {
      const r = await authedFetch("/api/teacher-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `Create this week's quiz for all Class ${grade} students on ${subject}${topic ? `, focused on: ${topic}` : ""}. Mix easy, medium and a couple of challenging questions.`,
          grade,
          subject,
          kind: "quiz",
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setPack(j);
      toast.success("Weekly quiz ready!");
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function publish() {
    if (!session || !pack) return;
    setPublishing(true);
    const body =
      `${pack.instructions}\n\n` +
      pack.mcqs
        .map((q, i) => `Q${i + 1}. ${q.question}\n${q.options.map((o, j) => `   ${String.fromCharCode(65 + j)}. ${o}`).join("\n")}`)
        .join("\n\n");
    const { error } = await supabase.from("announcements").insert({
      created_by: session.user.id,
      title: `Weekly Quiz — Class ${grade} ${subject}`,
      body,
      audience: "all",
    });
    setPublishing(false);
    if (error) return toast.error(error.message);
    toast.success("Quiz published to all students!");
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <ClipboardList className="h-4 w-4" /> Weekly Quiz
        </p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
          One click — <span className="text-gradient">quiz for the whole class</span>
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Auto-generate a CBSE-aligned weekly quiz and publish it to every student as an announcement.
        </p>

        {!allowed && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-4 text-sm text-muted-foreground">
            Only teachers and admins can generate the weekly quiz.
          </div>
        )}

        {allowed && (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="text-sm font-bold">Quiz setup</h2>
              <label className="mt-4 block text-xs font-semibold">Class
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-xs font-semibold">Subject
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm">
                  {["Mathematics","Science","Physics","Chemistry","Biology","English","Hindi","Social Science","Computer Science"].map(s => <option key={s}>{s}</option>)}
                </select>
              </label>
              <label className="mt-3 block text-xs font-semibold">Topic (optional)
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Motion and Time"
                  className="mt-1 w-full rounded-md border border-input bg-background px-2 py-2 text-sm"
                />
              </label>
              <button
                onClick={generate}
                disabled={loading}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Generating..." : "Generate weekly quiz"}
              </button>
              {pack && (
                <button
                  onClick={publish}
                  disabled={publishing}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-xs font-semibold hover:bg-accent disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" /> {publishing ? "Publishing..." : "Publish to all students"}
                </button>
              )}
            </div>

            <div>
              {!pack && (
                <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                  <p className="text-sm text-muted-foreground">Generated quiz will appear here.</p>
                </div>
              )}
              {pack && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-xl font-bold">{pack.title}</h2>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase text-primary">{pack.difficulty}</span>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{pack.instructions}</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                    <h3 className="text-sm font-bold">Questions</h3>
                    <ol className="mt-3 space-y-3 text-sm">
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
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
