import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Brain, Sparkles, AlertTriangle, CheckCircle2, BookOpen, Clock3 } from "lucide-react";

export const Route = createFileRoute("/parent-dashboard")({
  head: () => ({
    meta: [
      { title: "Parent Dashboard — EduAssist.AI" },
      { name: "description", content: "Track your child's learning progress, quiz accuracy, subject mastery and AI recommendations." },
    ],
  }),
  component: ParentDashboard,
});

const timePerSubject = [
  { subject: "Math", minutes: 320 },
  { subject: "Science", minutes: 280 },
  { subject: "English", minutes: 180 },
  { subject: "Hindi", minutes: 110 },
  { subject: "Social", minutes: 195 },
  { subject: "CS", minutes: 145 },
];

const quizAccuracy = [
  { week: "W1", accuracy: 62 },
  { week: "W2", accuracy: 68 },
  { week: "W3", accuracy: 71 },
  { week: "W4", accuracy: 65 },
  { week: "W5", accuracy: 78 },
  { week: "W6", accuracy: 84 },
  { week: "W7", accuracy: 87 },
];

const mastery = [
  { subject: "Math", score: 78 },
  { subject: "Physics", score: 65 },
  { subject: "Chemistry", score: 72 },
  { subject: "Biology", score: 88 },
  { subject: "English", score: 81 },
  { subject: "Hindi", score: 60 },
];

const weakAreas = [
  { chapter: "Quadratic Equations", subject: "Mathematics · Class 10", level: "Needs practice" },
  { chapter: "Light — Reflection & Refraction", subject: "Physics · Class 10", level: "Weak" },
  { chapter: "Carbon & its Compounds", subject: "Chemistry · Class 10", level: "Needs practice" },
];

function ParentDashboard() {
  const { session, loading, role, student } = useAuth();
  const navigate = useNavigate();
  const [planAssigned, setPlanAssigned] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  const totalMinutes = useMemo(() => timePerSubject.reduce((a, b) => a + b.minutes, 0), []);

  if (loading || !session) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (role !== "parent") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Parent dashboard</CardTitle>
              <CardDescription>This analytics dashboard is for parent accounts only.</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10 space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Parent Analytics</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              {student?.student_name ?? "Your child"}'s progress
            </h1>
            <p className="text-sm text-muted-foreground">
              {student?.class_grade ? `${student.class_grade} · ` : ""}Last 7 days of learning activity
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/parent" className="rounded-full border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent">Profile & fees</Link>
            <Link to="/parent-chat" className="rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft">Help desk</Link>
          </div>
        </div>

        {/* Stat row */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatTile icon={Clock3} label="Total study time" value={`${Math.round(totalMinutes / 60)}h ${totalMinutes % 60}m`} tint="from-blue-500 to-indigo-500" />
          <StatTile icon={CheckCircle2} label="Avg. quiz accuracy" value="87%" tint="from-emerald-500 to-teal-500" />
          <StatTile icon={BookOpen} label="Topics mastered" value="32" tint="from-amber-500 to-orange-500" />
          <StatTile icon={Sparkles} label="Active streak" value="12 days" tint="from-violet-500 to-fuchsia-500" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Time spent per subject</CardTitle>
              <CardDescription>Minutes across the last 7 days</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timePerSubject}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="subject" stroke="currentColor" fontSize={12} />
                  <YAxis stroke="currentColor" fontSize={12} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Bar dataKey="minutes" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quiz accuracy over time</CardTitle>
              <CardDescription>Weekly average %</CardDescription>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={quizAccuracy}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="week" stroke="currentColor" fontSize={12} />
                  <YAxis stroke="currentColor" fontSize={12} domain={[40, 100]} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12 }} />
                  <Line type="monotone" dataKey="accuracy" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Subject mastery</CardTitle>
              <CardDescription>Overall topic mastery score</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={mastery}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Mastery" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.35} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-1 border-primary/30">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>AI Recommendations & Weak Areas</CardTitle>
                  <CardDescription>NCERT chapters that need attention</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {weakAreas.map((w) => (
                <div key={w.chapter} className="flex items-start gap-3 rounded-xl border border-border bg-secondary/40 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{w.chapter}</p>
                    <p className="text-xs text-muted-foreground">{w.subject}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                    {w.level}
                  </span>
                </div>
              ))}
              <Button
                onClick={() => setPlanAssigned(true)}
                className="w-full gradient-primary text-primary-foreground"
                size="lg"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                {planAssigned ? "Practice plan assigned ✓" : "Generate & assign practice plan"}
              </Button>
              {planAssigned && (
                <p className="rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  A 7-day revision plan covering the chapters above has been added to your child's planner.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}