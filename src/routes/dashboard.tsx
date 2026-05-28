import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SparkRemembers } from "@/components/SparkRemembers";
import {
  Flame, Trophy, Clock3, Target, BookOpen, Calculator, FlaskConical,
  Brain, Languages, Globe2, ArrowRight, Sparkles, CalendarDays, MessageCircle,
  Zap, Award, Moon, Star,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — EduAssist.AI" },
      { name: "description", content: "Your personal learning dashboard: streaks, progress, recent chats and daily practice." },
    ],
  }),
  component: Dashboard,
});

const subjectShortcuts = [
  { name: "Mathematics", icon: Calculator, color: "from-blue-500 to-indigo-500", topic: "Quadratic Equations" },
  { name: "Physics", icon: Sparkles, color: "from-violet-500 to-purple-500", topic: "Light & Reflection" },
  { name: "Chemistry", icon: FlaskConical, color: "from-emerald-500 to-teal-500", topic: "Acids and Bases" },
  { name: "Biology", icon: Brain, color: "from-pink-500 to-rose-500", topic: "Life Processes" },
  { name: "English", icon: BookOpen, color: "from-amber-500 to-orange-500", topic: "Essay Writing" },
  { name: "Hindi", icon: Languages, color: "from-red-500 to-pink-500", topic: "व्याकरण" },
  { name: "Social Science", icon: Globe2, color: "from-cyan-500 to-sky-500", topic: "Nationalism in India" },
];

const recentChats = [
  { title: "Pythagoras theorem proof", subject: "Math · Class 10", time: "2h ago" },
  { title: "Difference between mitosis and meiosis", subject: "Biology · Class 11", time: "Yesterday" },
  { title: "Summary of The Last Lesson", subject: "English · Class 12", time: "2d ago" },
];

const dailyQuestions = [
  { q: "What is the SI unit of force?", subject: "Physics" },
  { q: "Solve: 2x + 3 = 11", subject: "Math" },
  { q: "Name the largest gland in human body.", subject: "Biology" },
];

function Dashboard() {
  const [poppedBadge, setPoppedBadge] = useState<string | null>(null);
  const xp = 1240;
  const xpToNext = 1500;
  const level = 7;
  const badges = [
    { id: "streak", name: "7-Day Streak Master", icon: Flame, tint: "from-orange-500 to-red-500", earned: true },
    { id: "science", name: "Science Wizard", icon: FlaskConical, tint: "from-emerald-500 to-teal-500", earned: true },
    { id: "night", name: "Late Night Scholar", icon: Moon, tint: "from-indigo-500 to-purple-500", earned: true },
    { id: "math", name: "Math Maestro", icon: Calculator, tint: "from-blue-500 to-indigo-500", earned: true },
    { id: "quiz", name: "Quiz Champ", icon: Trophy, tint: "from-amber-500 to-yellow-500", earned: false },
    { id: "star", name: "Rising Star", icon: Star, tint: "from-pink-500 to-rose-500", earned: false },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome */}
        <section className="relative overflow-hidden rounded-3xl gradient-primary p-8 shadow-elegant md:p-10">
          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/80">Welcome back, Aarav 👋</p>
              <h1 className="mt-2 text-3xl font-bold text-primary-foreground md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
                Ready for today's learning?
              </h1>
              <p className="mt-2 max-w-lg text-primary-foreground/90">
                You have <strong>3 recommended revisions</strong> and <strong>5 practice questions</strong> waiting for you.
              </p>
            </div>
            <Link
              to="/chat"
              className="inline-flex items-center gap-2 self-start rounded-full bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-elegant md:self-auto"
            >
              Ask the AI Tutor <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <StatCard icon={Flame} label="Study streak" value="12 days" tint="from-orange-500 to-red-500" />
          <StatCard icon={Trophy} label="Topics mastered" value="48" tint="from-amber-500 to-yellow-500" />
          <StatCard icon={Clock3} label="Time this week" value="6h 24m" tint="from-blue-500 to-indigo-500" />
          <StatCard icon={Target} label="Accuracy" value="87%" tint="from-emerald-500 to-teal-500" />
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-3">
          {/* Continue learning */}
          <section className="lg:col-span-2">
            {/* Gamification */}
            <div className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Zap className="h-4 w-4" /> Level {level}
                  </p>
                  <h3 className="mt-1 text-lg font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
                    {xp} / {xpToNext} XP
                  </h3>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant">
                  <Award className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-3 rounded-full gradient-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(xp / xpToNext) * 100}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {xpToNext - xp} XP to Level {level + 1}. Keep going!
              </p>

              <h4 className="mt-6 text-sm font-bold">Badges & Achievements</h4>
              <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {badges.map((b) => (
                  <motion.button
                    key={b.id}
                    onClick={() => b.earned && setPoppedBadge(b.id)}
                    whileHover={b.earned ? { scale: 1.08, rotate: -3 } : {}}
                    whileTap={b.earned ? { scale: 0.95 } : {}}
                    animate={poppedBadge === b.id ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                    transition={{ duration: 0.6 }}
                    onAnimationComplete={() => setPoppedBadge((id) => (id === b.id ? null : id))}
                    className={`flex flex-col items-center gap-1 rounded-2xl p-3 text-center transition ${b.earned ? "border border-border bg-background hover:shadow-elegant" : "border border-dashed border-border bg-secondary/30 opacity-50"}`}
                    title={b.name}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${b.tint} text-white ${!b.earned ? "grayscale" : ""}`}>
                      <b.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-semibold leading-tight">{b.name}</span>
                  </motion.button>
                ))}
              </div>
              <AnimatePresence>
                {poppedBadge && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-3 text-center text-xs font-semibold text-primary"
                  >
                    🎉 {badges.find((b) => b.id === poppedBadge)?.name} unlocked!
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <SectionTitle title="Continue learning" sub="Pick up where you left off" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {subjectShortcuts.slice(0, 4).map(s => (
                <Link
                  to="/chat"
                  key={s.name}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                    <s.icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.topic}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <SectionTitle title="All subjects" sub="Tap to start a new chat" />
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {subjectShortcuts.map(s => (
                  <Link to="/chat" key={s.name} className="rounded-2xl border border-border bg-card p-4 text-center shadow-soft transition hover:-translate-y-0.5 hover:shadow-elegant">
                    <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                      <s.icon className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-xs font-semibold">{s.name}</p>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* Right column */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Exam countdown</h3>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="mt-4 text-4xl font-extrabold text-gradient" style={{ fontFamily: "Sora, Inter, sans-serif" }}>42 days</p>
              <p className="mt-1 text-xs text-muted-foreground">Until CBSE board exams</p>
              <div className="mt-4 h-2 w-full rounded-full bg-secondary">
                <div className="h-2 rounded-full gradient-primary" style={{ width: "62%" }} />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">62% of revision plan complete</p>
            </div>

            <SparkRemembers />

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold">Recent chats</h3>
              <ul className="mt-4 space-y-3">
                {recentChats.map(c => (
                  <li key={c.title} className="flex items-start gap-3 rounded-xl p-2 transition hover:bg-secondary/60">
                    <MessageCircle className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium leading-snug">{c.title}</p>
                      <p className="text-xs text-muted-foreground">{c.subject} · {c.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-sm font-semibold">Daily practice</h3>
              <ul className="mt-4 space-y-3">
                {dailyQuestions.map((q, i) => (
                  <li key={i} className="rounded-xl border border-border bg-secondary/40 p-3">
                    <p className="text-xs font-semibold text-primary">{q.subject}</p>
                    <p className="mt-1 text-sm">{q.q}</p>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint }: { icon: any; label: string; value: string; tint: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${tint} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SectionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <div>
      <h2 className="text-xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>{title}</h2>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}