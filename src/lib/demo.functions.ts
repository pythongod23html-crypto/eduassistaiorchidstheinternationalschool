import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMAIL_DOMAIN = "eduassist.local";
const DEMO_PASSWORD = "Demo1234";
const u2e = (u: string) => `${u.toLowerCase()}@${EMAIL_DOMAIN}`;

type Role = "admin" | "teacher" | "student" | "parent";

async function ensureUser(username: string, role: Role, meta: Record<string, unknown> = {}) {
  const email = u2e(username);
  // Try to find by listing — admin API doesn't expose getByEmail directly, but createUser
  // will fail with "already registered" which we treat as success.
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { username, role, ...meta },
  });
  if (created?.user) {
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role }).select();
    return created.user.id;
  }
  // Already exists — find existing user via listUsers (page through up to 500).
  if (error && /registered|exists/i.test(error.message)) {
    let page = 1;
    while (page <= 5) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      const match = list?.users.find((u) => u.email?.toLowerCase() === email);
      if (match) return match.id;
      if (!list || list.users.length < 200) break;
      page++;
    }
  }
  throw new Error(`Failed to ensure user ${username}: ${error?.message ?? "not found"}`);
}

/**
 * Idempotent: seeds the demo accounts + sample scores used by the login page
 * and the leaderboard. Safe to call from the public login page.
 */
export const seedDemo = createServerFn({ method: "POST" }).handler(async () => {
  // Admin + teacher
  await ensureUser("admin_demo", "admin");
  await ensureUser("teacher_demo", "teacher");

  // 3 students + 3 parents
  const studentSeed = [
    { code: "1000000001", name: "Aarav Sharma", grade: "8", points: [85, 92, 78, 88] },
    { code: "1000000002", name: "Diya Patel", grade: "8", points: [95, 90, 87, 93] },
    { code: "1000000003", name: "Rohan Verma", grade: "7", points: [70, 75, 82, 68] },
  ];

  for (const s of studentSeed) {
    const studentUsername = `${s.code}_OIS`;
    const parentUsername = `p${s.code}_OIS`;
    const studentId = await ensureUser(studentUsername, "student", { student_code: s.code });
    const parentId = await ensureUser(parentUsername, "parent", { student_code: s.code });

    // Upsert student row
    const { data: existing } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("student_code", s.code)
      .maybeSingle();

    let row = existing;
    if (!row) {
      const { data: ins, error: insErr } = await supabaseAdmin
        .from("students")
        .insert({
          student_code: s.code,
          student_name: s.name,
          class_grade: s.grade,
          student_user_id: studentId,
          parent_user_id: parentId,
          fee_amount_due: 0,
          fee_status: "paid",
        })
        .select("id")
        .single();
      if (insErr) throw new Error(insErr.message);
      row = ins;
    } else {
      await supabaseAdmin
        .from("students")
        .update({ student_user_id: studentId, parent_user_id: parentId })
        .eq("id", row.id);
    }

    // Seed performance records once
    const { count } = await supabaseAdmin
      .from("performance_records")
      .select("id", { count: "exact", head: true })
      .eq("student_id", row!.id);

    if (!count) {
      const subjects = ["Math", "Science", "English", "Social Studies"];
      await supabaseAdmin.from("performance_records").insert(
        s.points.map((p, i) => ({
          student_id: row!.id,
          subject: subjects[i % subjects.length],
          score: p,
          total: 100,
          kind: "quiz",
        })),
      );
    }
  }

  return { ok: true };
});
