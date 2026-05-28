import { createFileRoute } from "@tanstack/react-router";

const MINDMAP_TOOL = {
  type: "function",
  function: {
    name: "create_mindmap",
    description: "Create a hierarchical mind map for a CBSE student topic.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string", description: "One-sentence overview of the topic." },
        branches: {
          type: "array",
          minItems: 3,
          maxItems: 7,
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Branch heading (2-5 words)." },
              children: {
                type: "array",
                minItems: 2,
                maxItems: 6,
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string", description: "Sub-point (under 12 words)." },
                    detail: { type: "string", description: "Short explanation (1 sentence)." },
                  },
                  required: ["label", "detail"],
                  additionalProperties: false,
                },
              },
            },
            required: ["label", "children"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "summary", "branches"],
      additionalProperties: false,
    },
  },
} as const;

export const Route = createFileRoute("/api/mindmap")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { grade, subject, topic } = (await request.json()) as {
            grade: string; subject: string; topic: string;
          };
          if (!topic?.trim()) return Response.json({ error: "Topic required" }, { status: 400 });

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return Response.json({ error: "AI service not configured." }, { status: 500 });

          const system = `You are EduAssist.AI, building CBSE/NCERT-aligned mind maps for Class ${grade} ${subject}. Keep labels concise and pedagogically structured.`;
          const user = `Build a mind map for the topic: "${topic}". Use 4-6 main branches, each with 3-5 sub-points. Sub-points should cover key concepts, formulas, examples, and exam-relevant facts.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              tools: [MINDMAP_TOOL],
              tool_choice: { type: "function", function: { name: "create_mindmap" } },
            }),
          });

          if (!upstream.ok) {
            if (upstream.status === 429) return Response.json({ error: "Too many requests — please slow down." }, { status: 429 });
            if (upstream.status === 402) return Response.json({ error: "AI credits exhausted." }, { status: 402 });
            const t = await upstream.text();
            console.error("AI gateway error:", upstream.status, t);
            return Response.json({ error: "AI gateway error" }, { status: 500 });
          }

          const data = await upstream.json();
          const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (!args) return Response.json({ error: "No content generated" }, { status: 500 });
          const parsed = typeof args === "string" ? JSON.parse(args) : args;
          return Response.json(parsed);
        } catch (e) {
          console.error("mindmap error:", e);
          return Response.json({ error: "Unexpected error" }, { status: 500 });
        }
      },
    },
  },
});
