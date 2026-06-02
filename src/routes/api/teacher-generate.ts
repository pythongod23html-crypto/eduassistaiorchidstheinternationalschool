import { createFileRoute } from "@tanstack/react-router";
import { requireRole } from "@/lib/api-auth.server";

const TEACHER_TOOL = {
  type: "function",
  function: {
    name: "create_teacher_pack",
    description: "Create teaching material (quiz, worksheet, or homework) for a CBSE class.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        instructions: { type: "string" },
        difficulty: { type: "string", enum: ["easy", "medium", "hard", "mixed"] },
        mcqs: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
              answerIndex: { type: "integer", minimum: 0, maximum: 3 },
            },
            required: ["question", "options", "answerIndex"],
            additionalProperties: false,
          },
        },
        shortAnswers: {
          type: "array",
          items: {
            type: "object",
            properties: { question: { type: "string" }, answer: { type: "string" } },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        longAnswers: {
          type: "array",
          items: {
            type: "object",
            properties: { question: { type: "string" }, answer: { type: "string" } },
            required: ["question", "answer"],
            additionalProperties: false,
          },
        },
        answerKey: { type: "string", description: "Concise answer key summary teachers can print." },
      },
      required: ["title", "instructions", "difficulty", "mcqs", "shortAnswers", "longAnswers", "answerKey"],
      additionalProperties: false,
    },
  },
} as const;

export const Route = createFileRoute("/api/teacher-generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authed = await requireRole(request, ["teacher", "admin"]);
          if (authed instanceof Response) return authed;
          const { prompt, grade, subject, kind } = (await request.json()) as {
            prompt: string;
            grade: string;
            subject: string;
            kind: "quiz" | "worksheet" | "homework" | "test";
          };
          if (!prompt || prompt.trim().length < 5) return Response.json({ error: "Prompt too short." }, { status: 400 });

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return Response.json({ error: "AI not configured." }, { status: 500 });

          const system = `You are EduAssist.AI assisting a CBSE teacher. Generate accurate, NCERT-aligned material for Class ${grade} ${subject}. Calibrate difficulty to the grade.`;
          const user = `Teacher request: "${prompt}".\nFormat: ${kind}.\nInclude 5 MCQs, 3 short-answer questions, 2 long-answer questions, a difficulty rating, clear instructions, and a printable answer key.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              tools: [TEACHER_TOOL],
              tool_choice: { type: "function", function: { name: "create_teacher_pack" } },
            }),
          });
          if (!upstream.ok) {
            if (upstream.status === 429) return Response.json({ error: "Too many requests." }, { status: 429 });
            if (upstream.status === 402) return Response.json({ error: "AI credits exhausted." }, { status: 402 });
            return Response.json({ error: "AI gateway error" }, { status: 500 });
          }
          const data = await upstream.json();
          const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (!args) return Response.json({ error: "No content generated" }, { status: 500 });
          const parsed = typeof args === "string" ? JSON.parse(args) : args;
          return Response.json(parsed);
        } catch (e) {
          console.error("teacher-generate error:", e);
          return Response.json({ error: "Unexpected error" }, { status: 500 });
        }
      },
    },
  },
});
