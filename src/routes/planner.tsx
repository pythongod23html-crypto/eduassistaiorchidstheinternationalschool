import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Sparkles, CheckCircle2, Circle, Wand2 } from "lucide-react";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Revision Planner — EduAssist.AI" },
      { name: "description", content: "Auto-generate a day-by-day CBSE revision plan aligned to your exam date and syllabus." },
    ],
  }),
  component: PlannerPage,
});

type Task = { id: string; day: number; date: string; subject: string; topic: string; done: boolean };

const SUBJECT_TOPICS: Record<string, string[]> = {
  Mathematics: [
    "Real Numbers — revision",
    "Polynomials — practice",
    "Linear Equations in 2 Variables",
    "Quadratic Equations — solving",
    "Arithmetic Progressions",
    "Triangles — similarity",
    "Coordinate Geometry",
    "Trigonometry — identities",
    "Application of Trigonometry",
    "Circles & Tangents",
    "Surface Areas & Volumes",
    "Statistics & Probability",
    "PYQ — Set 1",
    "PYQ — Set 2",
  ],
  Science: [
    "Chemical Reactions & Equations",
    "Acids, Bases & Salts",
    "Metals & Non-metals",
    "Carbon & its Compounds",
    "Life Processes",
    "Control & Coordination",
    "Reproduction in Organisms",
    "Heredity & Evolution",
    "Light — Reflection",
    "Light — Refraction",
    "Human Eye & Colourful World",
    "Electricity",
    "Magnetic Effects of Current",
    "Our Environment — revision",
  ],
  English: [
    "First Flight — prose recap",
    "Footprints without Feet — stories",
    "Poetry — themes & devices",
    "Grammar — tenses",
    "Grammar — modals & clauses",
    "Writing — letter formats",
    "Writing — analytical paragraph",
    "Reading comprehension drill",
    "PYQ — Section A",
    "PYQ — Section B",
    "Vocabulary boost",
    "Mock test 1",
    "Mock test 2",
    "Revision sweep",
  ],
  "Social Science": [
    "History — Nationalism in Europe",
    "History — Nationalism in India",
    "History — Making of Global World",
    "Geography — Resources",
    "Geography — Agriculture",
    "Geography — Manufacturing",
    "Political Science — Power-sharing",
    "Political Science — Federalism",
    "Political Science — Democracy",
    "Economics — Development",
    "Economics — Sectors",
    "Economics — Money & Credit",
    "Map work practice",
    "PYQ revision",
  ],
};

function PlannerPage() {
  const [subject, setSubject] = useState<keyof typeof SUBJECT_TOPICS>("Mathematics");
  const [examDate, setExamDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [generated, setGenerated] = useState(false);

  const today = useMemo(() => new Date(), []);

  const generate = () => {
    const exam = new Date(examDate);
    const days = Math.max(1, Math.min(14, Math.ceil((+exam - +today) / (1000 * 60 * 60 * 24))));
    const topics = SUBJECT_TOPICS[subject] ?? [];
    const next: Task[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const topic = topics[i % topics.length] ?? "Revision";
      next.push({
        id: `${i}-${Date.now()}`,
        day: i + 1,
        date: date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
        subject,
        topic,
        done: false,
      });
    }
    setTasks(next);
    setGenerated(true);
  };

  const toggle = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const columns: Array<{ key: "todo" | "today" | "done"; title: string; filter: (t: Task) => boolean; tint: string }> = [
    { key: "today", title: "Today & Tomorrow", filter: (t) => !t.done && t.day <= 2, tint: "border-primary/40" },
    { key: "todo", title: "Upcoming", filter: (t) => !t.done && t.day > 2, tint: "border-amber-400/40" },
    { key: "done", title: "Completed", filter: (t) => t.done, tint: "border-emerald-400/40" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10 space-y-8 animate-in fade-in duration-500">
        <div>
          <p className="text-sm font-medium text-primary">AI Revision Planner</p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Plan smarter, not harder
          </h1>
          <p className="text-sm text-muted-foreground">Auto-generate a day-by-day CBSE study schedule aligned to your exam date.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generate schedule</CardTitle>
            <CardDescription>Pick a subject and the date of your upcoming exam.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-[1fr,1fr,auto] md:items-end">
              <div className="space-y-2">
                <Label>Subject</Label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value as keyof typeof SUBJECT_TOPICS)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {Object.keys(SUBJECT_TOPICS).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Exam date</Label>
                <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              </div>
              <Button onClick={generate} size="lg" className="gradient-primary text-primary-foreground">
                <Wand2 className="mr-2 h-4 w-4" />
                Auto-generate
              </Button>
            </div>
          </CardContent>
        </Card>

        {generated && (
          <div className="grid gap-4 md:grid-cols-3">
            {columns.map((col) => {
              const items = tasks.filter(col.filter);
              return (
                <div key={col.key} className={`rounded-2xl border-2 ${col.tint} bg-card p-4 shadow-soft`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-bold">{col.title}</h3>
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    <AnimatePresence>
                      {items.map((t) => (
                        <motion.button
                          key={t.id}
                          layout
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          onClick={() => toggle(t.id)}
                          className="flex w-full items-start gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/40"
                        >
                          {t.done ? (
                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${t.done ? "line-through text-muted-foreground" : ""}`}>
                              {t.topic}
                            </p>
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              Day {t.day} · {t.date} · {t.subject}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </AnimatePresence>
                    {items.length === 0 && (
                      <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        Nothing here yet
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!generated && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold">Your AI plan will appear here</h3>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Choose a subject and exam date above, then hit "Auto-generate" to build a day-by-day CBSE-aligned revision plan.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}