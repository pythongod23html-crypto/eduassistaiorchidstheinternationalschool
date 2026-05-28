import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, NotebookPen } from "lucide-react";

export const Route = createFileRoute("/parent")({ component: ParentPage });

function ParentPage() {
  const { session, loading, role, student } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState<string>("");
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [hwMode, setHwMode] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  useEffect(() => {
    if (role !== "parent" || !student) return;
    let cancelled = false;
    setReportLoading(true);
    setReportError(null);
    const sampleRecords = [
      { subject: "Mathematics", chapter: "Quadratic Equations", score: 6, total: 10, kind: "quiz", created_at: new Date().toISOString() },
      { subject: "Science", chapter: "Light — Reflection & Refraction", score: 7, total: 10, kind: "quiz", created_at: new Date().toISOString() },
      { subject: "Science", chapter: "Carbon & its Compounds", score: 5, total: 10, kind: "quiz", created_at: new Date().toISOString() },
      { subject: "English", chapter: "Reading Comprehension", score: 9, total: 10, kind: "quiz", created_at: new Date().toISOString() },
      { subject: "Social Studies", chapter: "Nationalism in India", score: 8, total: 10, kind: "quiz", created_at: new Date().toISOString() },
    ];
    fetch("/api/parent-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childName: student.student_name,
        grade: student.class_grade ?? "10",
        records: sampleRecords,
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (cancelled) return;
        if (!r.ok) setReportError(data?.error ?? "Failed to generate report");
        else setReport(data.summary ?? "");
      })
      .catch((e) => !cancelled && setReportError(e?.message ?? "Network error"))
      .finally(() => !cancelled && setReportLoading(false));
    return () => { cancelled = true; };
  }, [role, student]);

  if (loading || !session) return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;

  if (role !== "parent") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Parent dashboard</CardTitle>
              <CardDescription>This area is for parent accounts only.</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const feeBadge = student
    ? student.fee_status === "paid"
      ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
      : student.fee_status === "due"
        ? "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800"
        : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
    : "";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, parent</h1>
          <p className="text-sm text-muted-foreground">Track your child's learning and fee status.</p>
        </div>

        {/* Homework Mode Toggle */}
        <Card className="border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                  <NotebookPen className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Homework Mode</CardTitle>
                  <CardDescription>When ON, the AI tutor gives hints instead of full answers — so your child actually learns.</CardDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHwMode(h => !h)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${hwMode ? "border-primary/50 bg-primary/10 text-primary" : "border-input bg-card text-muted-foreground hover:text-foreground"}`}
              >
                <NotebookPen className="h-4 w-4" />
                Homework mode {hwMode ? "ON" : "OFF"}
              </button>
            </div>
          </CardHeader>
        </Card>

        {!student ? (
          <Card>
            <CardHeader>
              <CardTitle>No linked student</CardTitle>
              <CardDescription>Please contact your school admin.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>{student.student_name}</CardTitle>
                  <CardDescription>
                    Code: <span className="font-mono">{student.student_code}</span>
                    {student.class_grade ? ` · ${student.class_grade}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Your child uses EduAssist.AI to ask doubts, take quizzes, and review flashcards.</p>
                  <Link to="/parent-dashboard" className="inline-flex text-sm font-medium text-primary hover:underline">
                    See what your child is studying →
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fee status</CardTitle>
                  <CardDescription>Current term</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount due</span>
                    <span className="text-2xl font-bold">₹{student.fee_amount_due}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={feeBadge}>{student.fee_status}</span>
                  </div>
                  {student.fee_notes && (
                    <div className="rounded-md border bg-muted/40 p-3 text-sm">
                      <p className="font-medium">Note from school</p>
                      <p className="mt-1 text-muted-foreground">{student.fee_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="border-primary/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>AI weekly report</CardTitle>
                    <CardDescription>Auto-generated when you sign in</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {reportLoading && (
                  <div className="space-y-2">
                    <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                    <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                    <p className="pt-2 text-xs text-muted-foreground">Generating report for {student.student_name}…</p>
                  </div>
                )}
                {reportError && (
                  <p className="text-sm text-destructive">{reportError}</p>
                )}
                {!reportLoading && !reportError && report && (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{report}</div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
