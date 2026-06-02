import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/api-auth.server";

const QUIZ_TOOL = {
  type: "function",
  function: {
    name: "create_quiz",
    description: "Create a multiple-choice quiz for a CBSE student.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
              answerIndex: { type: "integer", minimum: 0, maximum: 3 },
              explanation: { type: "string" },
            },
            required: ["question", "options", "answerIndex", "explanation"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "questions"],
      additionalProperties: false,
    },
  },
} as const;

const FLASH_TOOL = {
  type: "function",
  function: {
    name: "create_flashcards",
    description: "Create study flashcards for a CBSE student.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        cards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string", description: "Term, question, or concept" },
              back: { type: "string", description: "Definition, answer, or explanation" },
              hint: { type: "string" },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
        },
      },
      required: ["title", "cards"],
      additionalProperties: false,
    },
  },
} as const;

export const Route = createFileRoute("/api/generate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authed = await requireUser(request);
          if (authed instanceof Response) return authed;
          const { type, grade, subject, topic, count } = (await request.json()) as {
            type: "quiz" | "flashcards";
            grade: string;
            subject: string;
            topic: string;
            count?: number;
          };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return Response.json({ error: "AI service not configured." }, { status: 500 });
          }

          const n = Math.min(Math.max(count ?? (type === "quiz" ? 5 : 8), 3), 15);
          const isQuiz = type === "quiz";
          const tool = isQuiz ? QUIZ_TOOL : FLASH_TOOL;
          const fnName = isQuiz ? "create_quiz" : "create_flashcards";

          const system = `You are EduAssist.AI, generating CBSE / NCERT-aligned study material for Class ${grade} ${subject}. Adapt difficulty to the grade. Be accurate, age-appropriate, and exam-focused.`;
          const user = isQuiz
            ? `Create a ${n}-question multiple-choice quiz on the topic: "${topic}". Each question must have exactly 4 options, one correct, and a brief explanation.`
            : `Create ${n} concise study flashcards on the topic: "${topic}". Front = term/question, Back = clear definition/answer.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              tools: [tool],
              tool_choice: { type: "function", function: { name: fnName } },
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
          console.error("generate error:", e);
          return Response.json({ error: "Unexpected error" }, { status: 500 });
        }
      },
    },
  },
});