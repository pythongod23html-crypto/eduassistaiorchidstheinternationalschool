import { authedFetch } from "@/lib/authed-fetch";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useState } from "react";
import { Loader2, Sparkles, Check, X, RotateCcw, Trophy } from "lucide-react";

export const Route = createFileRoute("/quiz")({
  head: () => ({
    meta: [
      { title: "Quiz Generator — EduAssist.AI" },
      { name: "description", content: "Instantly generate CBSE practice quizzes on any topic, for any grade." },
    ],
  }),
  component: QuizPage,
});

const GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "Social Science", "History", "Geography", "Political Science", "Economics",
  "English", "Hindi", "Computer Science", "Accountancy", "Business Studies",
];

type Question = { question: string; options: string[]; answerIndex: number; explanation: string };
type Quiz = { title: string; questions: Question[] };

function QuizPage() {
  const [grade, setGrade] = useState("8");
  const [subject, setSubject] = useState("Science");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true); setError(null); setQuiz(null); setAnswers({}); setSubmitted(false);
    try {
      const res = await authedFetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "quiz", grade, subject, topic, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate");
      setQuiz(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const score = quiz ? quiz.questions.reduce((s, q, i) => s + (answers[i] === q.answerIndex ? 1 : 0), 0) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Quiz <span className="text-gradient">Generator</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Instant CBSE-aligned practice quizzes on any topic.</p>
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
            <label className="flex flex-col gap-1 text-sm sm:col-span-2 md:col-span-1">
              <span className="text-muted-foreground">Questions</span>
              <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="rounded-lg border bg-background px-3 py-2">
                {[3, 5, 8, 10, 15].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2 md:col-span-4">
              <span className="text-muted-foreground">Topic</span>
              <input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") generate(); }}
                placeholder="e.g. Photosynthesis, Quadratic Equations, Mughal Empire"
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
            {loading ? "Generating…" : "Generate Quiz"}
          </button>
          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        </div>

        {quiz && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-semibold">{quiz.title}</h2>
            {quiz.questions.map((q, i) => {
              const picked = answers[i];
              return (
                <div key={i} className="rounded-2xl border bg-card p-5 shadow-soft">
                  <p className="font-medium">{i + 1}. {q.question}</p>
                  <div className="mt-3 grid gap-2">
                    {q.options.map((opt, j) => {
                      const isPicked = picked === j;
                      const isCorrect = j === q.answerIndex;
                      const showState = submitted && (isPicked || isCorrect);
                      return (
                        <button
                          key={j}
                          disabled={submitted}
                          onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                          className={`flex items-center justify-between rounded-lg border px-4 py-2.5 text-left text-sm transition ${
                            showState && isCorrect ? "border-green-500/60 bg-green-500/10" :
                            showState && isPicked && !isCorrect ? "border-destructive/60 bg-destructive/10" :
                            isPicked ? "border-primary bg-primary/10" : "hover:bg-secondary"
                          }`}
                        >
                          <span>{opt}</span>
                          {showState && isCorrect && <Check className="h-4 w-4 text-green-600" />}
                          {showState && isPicked && !isCorrect && <X className="h-4 w-4 text-destructive" />}
                        </button>
                      );
                    })}
                  </div>
                  {submitted && (
                    <p className="mt-3 rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
                      <strong className="text-foreground">Explanation: </strong>{q.explanation}
                    </p>
                  )}
                </div>
              );
            })}

            <div className="flex flex-wrap items-center gap-3">
              {!submitted ? (
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={Object.keys(answers).length !== quiz.questions.length}
                  className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elegant disabled:opacity-60"
                >
                  Submit Quiz
                </button>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold">
                    <Trophy className="h-4 w-4 text-primary" />
                    Score: {score} / {quiz.questions.length}
                  </div>
                  <button
                    onClick={() => { setAnswers({}); setSubmitted(false); }}
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                  >
                    <RotateCcw className="h-4 w-4" /> Retry
                  </button>
                  <button
                    onClick={generate}
                    className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold hover:bg-secondary"
                  >
                    <Sparkles className="h-4 w-4" /> New Quiz
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}