import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/api-auth.server";

export const Route = createFileRoute("/api/parent-summary")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { childName, grade, records } = (await request.json()) as {
            childName: string;
            grade: string;
            records: { subject: string; chapter?: string; topic?: string; score: number; total: number; kind: string; created_at: string }[];
          };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return Response.json({ error: "AI not configured." }, { status: 500 });

          const system = `You write warm, parent-friendly weekly academic summaries about a CBSE student. Be specific (mention subjects/chapters), encouraging, and actionable. Avoid jargon. Use 3-5 short paragraphs.`;
          const user = `Child: ${childName} (Class ${grade}).\n\nRecent performance records (JSON):\n${JSON.stringify(records).slice(0, 6000)}\n\nWrite a friendly weekly summary covering: overall progress, strongest subjects, weakest topics needing revision, homework consistency, and 2-3 specific improvement suggestions.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
            }),
          });
          if (!upstream.ok) {
            if (upstream.status === 429) return Response.json({ error: "Too many requests." }, { status: 429 });
            if (upstream.status === 402) return Response.json({ error: "AI credits exhausted." }, { status: 402 });
            return Response.json({ error: "AI gateway error" }, { status: 500 });
          }
          const data = await upstream.json();
          const text = data?.choices?.[0]?.message?.content ?? "";
          return Response.json({ summary: text });
        } catch (e) {
          console.error("parent-summary error:", e);
          return Response.json({ error: "Unexpected error" }, { status: 500 });
        }
      },
    },
  },
});
