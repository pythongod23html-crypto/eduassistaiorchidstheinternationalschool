import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Validates the Bearer token on a server route request and returns the
 * authenticated user id. Returns a Response (401/403) on failure that the
 * caller should return directly.
 */
export async function requireUser(
  request: Request,
): Promise<{ userId: string } | Response> {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
  if (!token) return json({ error: "Unauthorized" }, 401);

  const supaUrl = process.env.SUPABASE_URL!;
  const supaAnon = process.env.SUPABASE_PUBLISHABLE_KEY!;
  const userClient = createClient(supaUrl, supaAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return json({ error: "Unauthorized" }, 401);
  return { userId: data.user.id };
}

export async function requireRole(
  request: Request,
  roles: ("admin" | "teacher" | "student" | "parent")[],
): Promise<{ userId: string } | Response> {
  const result = await requireUser(request);
  if (result instanceof Response) return result;
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", result.userId)
    .in("role", roles);
  if (!data || data.length === 0) {
    return json({ error: "Forbidden" }, 403);
  }
  return result;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
