import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SYSTEM_PROMPT = (studentName: string | null, grade: string | null, feeStatus: string, feeDue: number) =>
  `You are EduAssist.AI's parent support assistant for an Indian CBSE school.

You help parents raise requests, ask questions about their child's school life, fees, schedules, events, leave applications, meetings with teachers, and report concerns.

Linked child:
- Name: ${studentName ?? "(unknown)"}
- Class: ${grade ?? "(unknown)"}
- Fee status: ${feeStatus}
- Outstanding fee amount: ₹${feeDue}

Guidelines:
- Be warm, respectful, and concise. Address the parent politely.
- If the parent is raising a request (leave, meeting, complaint, fee query), acknowledge it, confirm the key details, and tell them it has been logged for the school admin to review.
- For fee questions, refer to the linked child's fee status above.
- Never make up school policies. If unsure, say you'll forward the request to the admin.
- Keep replies short (under 150 words) unless the parent asks for detail.
- Use **bold** for important words and short bullet points where helpful.`;

export const Route = createFileRoute("/api/parent-chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const auth = request.headers.get("authorization") ?? "";
          const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : "";
          if (!token) return json({ error: "Unauthorized" }, 401);

          const supaUrl = process.env.SUPABASE_URL!;
          const supaAnon = process.env.SUPABASE_PUBLISHABLE_KEY!;
          const userClient = createClient(supaUrl, supaAnon, {
            global: { headers: { Authorization: `Bearer ${token}` } },
          });
          const { data: userRes, error: userErr } = await userClient.auth.getUser();
          if (userErr || !userRes.user) return json({ error: "Unauthorized" }, 401);
          const userId = userRes.user.id;

          // Verify parent role
          const { data: roleRow } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .eq("role", "parent")
            .maybeSingle();
          if (!roleRow) return json({ error: "Only parents can use this chatbot." }, 403);

          const { messages } = (await request.json()) as {
            messages: { role: "user" | "assistant"; content: string }[];
          };
          if (!Array.isArray(messages) || messages.length === 0) {
            return json({ error: "No messages" }, 400);
          }
          const last = messages[messages.length - 1];
          if (last.role !== "user" || !last.content?.trim()) {
            return json({ error: "Last message must be from user" }, 400);
          }

          // Linked child context
          const { data: student } = await supabaseAdmin
            .from("students")
            .select("id,student_name,class_grade,fee_status,fee_amount_due")
            .eq("parent_user_id", userId)
            .maybeSingle();

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return json({ error: "AI service not configured." }, 500);

          // Persist parent's message first
          await supabaseAdmin.from("parent_requests").insert({
            parent_user_id: userId,
            student_id: student?.id ?? null,
            role: "user",
            content: last.content.trim(),
          });

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                {
                  role: "system",
                  content: SYSTEM_PROMPT(
                    student?.student_name ?? null,
                    student?.class_grade ?? null,
                    student?.fee_status ?? "unknown",
                    Number(student?.fee_amount_due ?? 0),
                  ),
                },
                ...messages.map((m) => ({ role: m.role, content: m.content })),
              ],
            }),
          });

          if (!upstream.ok) {
            if (upstream.status === 429) return json({ error: "Too many requests — please slow down." }, 429);
            if (upstream.status === 402) return json({ error: "AI credits exhausted." }, 402);
            const t = await upstream.text();
            console.error("AI gateway error:", upstream.status, t);
            return json({ error: "AI gateway error" }, 500);
          }

          const data = (await upstream.json()) as {
            choices?: { message?: { content?: string } }[];
          };
          const reply = data.choices?.[0]?.message?.content?.trim() ?? "Sorry, I couldn't generate a reply.";

          await supabaseAdmin.from("parent_requests").insert({
            parent_user_id: userId,
            student_id: student?.id ?? null,
            role: "assistant",
            content: reply,
          });

          return json({ reply });
        } catch (e) {
          console.error("parent-chat error:", e);
          return json({ error: "Unexpected error" }, 500);
        }
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}