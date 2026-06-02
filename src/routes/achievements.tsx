import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Lock, Trophy, ArrowLeft } from "lucide-react";
import { BADGE_DEFS, useFocusMode } from "@/components/FocusMode";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { property: "og:title", content: 'Achievements — EduAssist.AI' },
      { property: "og:description", content: "All badges you've unlocked from focus sessions and study streaks." },
      { property: "og:url", content: "https://eduassistaiorchidstheinternationalschool.lovable.app/achievements" },
      { property: "og:type", content: "website" },
      
      { title: "Achievements — EduAssist.AI" },
      { name: "description", content: "All badges you've unlocked from focus sessions and study streaks." },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { badges, stats } = useFocusMode();
  const unlockedCount = badges.length;
  const total = BADGE_DEFS.length;
  const pct = Math.round((unlockedCount / total) * 100);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>

        <section className="mt-6 overflow-hidden rounded-3xl gradient-primary p-8 shadow-elegant">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-primary-foreground/80">Your achievements</p>
              <h1 className="mt-2 text-3xl font-bold text-primary-foreground md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
                {unlockedCount} of {total} badges unlocked
              </h1>
              <p className="mt-2 text-primary-foreground/90">
                {stats.totalCompleted} focus sessions completed · {stats.todayCount} today
              </p>
            </div>
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-card text-primary shadow-elegant">
              <Trophy className="h-9 w-9" />
            </div>
          </div>
          <div className="mt-6 h-3 w-full overflow-hidden rounded-full bg-primary-foreground/20">
            <motion.div
              className="h-3 rounded-full bg-card"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2 text-xs text-primary-foreground/80">{pct}% complete</p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>All badges</h2>
          <p className="text-sm text-muted-foreground">Unlock more by completing focus sessions</p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BADGE_DEFS.map((def, i) => {
              const unlocked = badges.includes(def.id);
              return (
                <motion.div
                  key={def.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className={`relative flex items-start gap-4 rounded-2xl border p-5 shadow-soft transition ${
                    unlocked
                      ? "border-border bg-card hover:-translate-y-0.5 hover:shadow-elegant"
                      : "border-dashed border-border/60 bg-secondary/30"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white ${
                      unlocked ? "" : "bg-muted-foreground/30"
                    }`}
                    style={unlocked ? { backgroundColor: def.color } : {}}
                  >
                    {unlocked ? def.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                      {def.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{def.description}</p>
                    {unlocked && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        Unlocked
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
