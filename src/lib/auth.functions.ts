import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const EMAIL_DOMAIN = "eduassist.local";

function usernameToEmail(username: string): string {
  return `${username.toLowerCase()}@${EMAIL_DOMAIN}`;
}

function generatePassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 10; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin only");
}

/** Convert a username (student/parent/admin-email) to the email used by Supabase auth. */
export const resolveLoginEmail = createServerFn({ method: "POST" })
  .inputValidator((input) => z.object({ username: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const u = data.username.trim();
    if (u.includes("@")) return { email: u };
    return { email: usernameToEmail(u) };
  });

/** Admin: create a student + linked parent account. */
export const createStudentAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        student_code: z.string().regex(/^[0-9]{10}$/, "Must be 10 digits"),
        student_name: z.string().min(1).max(120),
        class_grade: z.string().max(20).optional(),
        fee_amount_due: z.number().min(0).default(0),
        fee_status: z.enum(["paid", "due", "overdue"]).default("paid"),
        fee_notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);

    const studentUsername = `${data.student_code}_OIS`;
    const parentUsername = `p${data.student_code}_OIS`;
    const password = generatePassword();

    // Create student auth user
    const { data: studentUser, error: sErr } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(studentUsername),
      password,
      email_confirm: true,
      user_metadata: { username: studentUsername, role: "student", student_code: data.student_code },
    });
    if (sErr || !studentUser.user) throw new Error(sErr?.message ?? "Failed to create student account");

    // Create parent auth user (same password)
    const { data: parentUser, error: pErr } = await supabaseAdmin.auth.admin.createUser({
      email: usernameToEmail(parentUsername),
      password,
      email_confirm: true,
      user_metadata: { username: parentUsername, role: "parent", student_code: data.student_code },
    });
    if (pErr || !parentUser.user) {
      await supabaseAdmin.auth.admin.deleteUser(studentUser.user.id);
      throw new Error(pErr?.message ?? "Failed to create parent account");
    }

    // Assign roles
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert([
      { user_id: studentUser.user.id, role: "student" },
      { user_id: parentUser.user.id, role: "parent" },
    ]);
    if (rErr) throw new Error(rErr.message);

    // Insert student row
    const { data: student, error: stErr } = await supabaseAdmin
      .from("students")
      .insert({
        student_code: data.student_code,
        student_name: data.student_name,
        class_grade: data.class_grade ?? null,
        
        student_user_id: studentUser.user.id,
        parent_user_id: parentUser.user.id,
        fee_amount_due: data.fee_amount_due,
        fee_status: data.fee_status,
        fee_notes: data.fee_notes ?? null,
      })
      .select()
      .single();
    if (stErr) throw new Error(stErr.message);

    return {
      student,
      credentials: {
        student: { username: studentUsername, password },
        parent: { username: parentUsername, password },
      },
    };
  });

/** Admin: list all students with credentials. */
export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { students: data ?? [] };
  });

/** Admin: update a student's fee info. */
export const updateStudentFee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        id: z.string().uuid(),
        fee_amount_due: z.number().min(0),
        fee_status: z.enum(["paid", "due", "overdue"]),
        fee_notes: z.string().max(500).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin
      .from("students")
      .update({
        fee_amount_due: data.fee_amount_due,
        fee_status: data.fee_status,
        fee_notes: data.fee_notes ?? null,
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Admin: delete a student + linked accounts. */
export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("students")
      .select("student_user_id, parent_user_id")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("students").delete().eq("id", data.id);
    if (row.student_user_id) await supabaseAdmin.auth.admin.deleteUser(row.student_user_id);
    if (row.parent_user_id) await supabaseAdmin.auth.admin.deleteUser(row.parent_user_id);
    return { ok: true };
  });

/** Get current session role + linked student (for student or parent). */
export const getMyContext = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);

    const roleList = (roles ?? []).map((r: { role: string }) => r.role as string);
    const role = roleList.includes("admin")
      ? "admin"
      : roleList.includes("teacher")
        ? "teacher"
        : roleList.includes("parent")
          ? "parent"
          : roleList.includes("student")
            ? "student"
            : null;

    type StudentInfo = {
      id: string;
      student_code: string;
      student_name: string;
      class_grade: string | null;
      fee_amount_due: number | null;
      fee_status: string | null;
      fee_notes: string | null;
    };
    let student: StudentInfo | null = null;
    if (role === "student") {
      // Students must NOT see fee details — exclude fee columns.
      const { data } = await supabaseAdmin
        .from("students")
        .select("id,student_code,student_name,class_grade")
        .eq("student_user_id", context.userId)
        .maybeSingle();
      student = data ? { ...data, fee_amount_due: null, fee_status: null, fee_notes: null } : null;
    } else if (role === "parent") {
      const { data } = await supabaseAdmin
        .from("students")
        .select("id,student_code,student_name,class_grade,fee_amount_due,fee_status,fee_notes")
        .eq("parent_user_id", context.userId)
        .maybeSingle();
      student = data;
    }

    return { role, student, userId: context.userId };
  });