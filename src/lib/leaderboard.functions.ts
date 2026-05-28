import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type LeaderboardRow = {
  student_id: string;
  student_name: string;
  class_grade: string | null;
  total_points: number;
  quiz_count: number;
  avg_score: number;
};

/**
 * Public leaderboard for authenticated users (student/parent/teacher/admin).
 * Uses admin client to aggregate across all students — returns only name + grade
 * + score totals (no PII, no fee info).
 */
export const getLeaderboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { data: records, error } = await supabaseAdmin
      .from("performance_records")
      .select("student_id, score, total");
    if (error) throw new Error(error.message);

    const agg = new Map<string, { points: number; count: number; pctSum: number }>();
    for (const r of records ?? []) {
      const cur = agg.get(r.student_id) ?? { points: 0, count: 0, pctSum: 0 };
      cur.points += Number(r.score) || 0;
      cur.count += 1;
      cur.pctSum += (Number(r.score) / Math.max(1, Number(r.total))) * 100;
      agg.set(r.student_id, cur);
    }

    const ids = Array.from(agg.keys());
    if (ids.length === 0) return { rows: [] as LeaderboardRow[] };

    const { data: students, error: sErr } = await supabaseAdmin
      .from("students")
      .select("id, student_name, class_grade")
      .in("id", ids);
    if (sErr) throw new Error(sErr.message);

    const rows: LeaderboardRow[] = (students ?? []).map((s) => {
      const a = agg.get(s.id)!;
      return {
        student_id: s.id,
        student_name: s.student_name,
        class_grade: s.class_grade,
        total_points: Math.round(a.points),
        quiz_count: a.count,
        avg_score: Math.round(a.pctSum / a.count),
      };
    });
    rows.sort((a, b) => b.total_points - a.total_points);
    return { rows };
  });
