import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Award } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeaderboard } from "@/lib/leaderboard.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard — EduAssist.AI" }] }),
  component: LeaderboardPage,
});

function rankIcon(i: number) {
  if (i === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (i === 1) return <Medal className="h-5 w-5 text-gray-400" />;
  if (i === 2) return <Award className="h-5 w-5 text-amber-700" />;
  return <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{i + 1}</span>;
}

function LeaderboardPage() {
  const { session, student } = useAuth();
  const fetchBoard = useServerFn(getLeaderboard);
  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchBoard(),
    enabled: !!session,
  });

  const rows = data?.rows ?? [];
  const myId = student?.id;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1">
          <div className="flex items-center gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur">
            <SidebarTrigger />
            <h1 className="text-base font-semibold">Leaderboard</h1>
          </div>
          <div className="mx-auto max-w-3xl px-4 py-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Top performers
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ranked by total quiz points across all subjects.
                </p>
              </CardHeader>
              <CardContent>
                {!session ? (
                  <p className="text-sm text-muted-foreground">Please sign in to view the leaderboard.</p>
                ) : isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading…</p>
                ) : rows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No quiz data yet — take a quiz to get on the board!</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {rows.map((r, i) => {
                      const mine = myId && r.student_id === myId;
                      return (
                        <li
                          key={r.student_id}
                          className={`flex items-center justify-between gap-4 py-3 ${mine ? "rounded-lg bg-primary/5 px-2" : ""}`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                              {rankIcon(i)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">
                                {r.student_name} {mine && <span className="text-xs text-primary">(you)</span>}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Grade {r.class_grade ?? "—"} · {r.quiz_count} quiz{r.quiz_count === 1 ? "" : "zes"} · avg {r.avg_score}%
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">{r.total_points}</p>
                            <p className="text-xs text-muted-foreground">points</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
