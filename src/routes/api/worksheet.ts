import { createFileRoute } from "@tanstack/react-router";

const WORKSHEET_TOOL = {
  type: "function",
  function: {
    name: "create_worksheet",
    description: "Create a printable practice worksheet for a CBSE student.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        instructions: { type: "string", description: "One short line of instructions for the student." },
        sections: {
          type: "array",
          minItems: 2,
          maxItems: 5,
          items: {
            type: "object",
            properties: {
              heading: { type: "string", description: "e.g. 'Fill in the blanks', 'Short answer', 'Solve'." },
              marks: { type: "integer", minimum: 1, maximum: 5, description: "Marks per question in this section." },
              questions: {
                type: "array",
                minItems: 3,
                maxItems: 10,
                items: {
                  type: "object",
                  properties: {
                    prompt: { type: "string" },
                    answer: { type: "string", description: "Model answer for the answer key." },
                  },
                  required: ["prompt", "answer"],
                  additionalProperties: false,
                },
              },
            },
            required: ["heading", "marks", "questions"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "instructions", "sections"],
      additionalProperties: false,
    },
  },
} as const;

export const Route = createFileRoute("/api/worksheet")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { grade, subject, topic, difficulty } = (await request.json()) as {
            grade: string; subject: string; topic: string; difficulty?: "easy" | "medium" | "hard";
          };
          if (!topic?.trim()) return Response.json({ error: "Topic required" }, { status: 400 });

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return Response.json({ error: "AI service not configured." }, { status: 500 });

          const diff = difficulty ?? "medium";
          const system = `You are EduAssist.AI, generating printable CBSE/NCERT-aligned worksheets for Class ${grade} ${subject}. Use age-appropriate language and exam-style questions.`;
          const user = `Create a ${diff} difficulty practice worksheet on: "${topic}". Mix 2-4 sections such as Fill in the blanks, Short answer, Long answer, or Solve. Include a model answer for every question.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              tools: [WORKSHEET_TOOL],
              tool_choice: { type: "function", function: { name: "create_worksheet" } },
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
          console.error("worksheet error:", e);
          return Response.json({ error: "Unexpected error" }, { status: 500 });
        }
      },
    },
  },
});
