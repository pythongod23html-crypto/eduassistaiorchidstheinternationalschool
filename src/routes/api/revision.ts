import { createFileRoute } from "@tanstack/react-router";
import { requireUser } from "@/lib/api-auth.server";

const REVISION_TOOL = {
  type: "function",
  function: {
    name: "create_revision_pack",
    description: "Create a complete CBSE/NCERT-aligned revision pack from study material.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        summary: { type: "string", description: "2-3 paragraph chapter summary" },
        notes: { type: "array", items: { type: "string" }, description: "8-15 short bullet revision notes" },
        flashcards: {
          type: "array",
          items: {
            type: "object",
            properties: {
              front: { type: "string" },
              back: { type: "string" },
            },
            required: ["front", "back"],
            additionalProperties: false,
          },
        },
        questions: {
          type: "array",
          description: "Important short / long answer questions",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              answer: { type: "string" },
              type: { type: "string", enum: ["short", "long", "vsa"] },
            },
            required: ["question", "answer", "type"],
            additionalProperties: false,
          },
        },
        quiz: {
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
        formulas: { type: "array", items: { type: "string" }, description: "Key formulas or definitions" },
        examPoints: { type: "array", items: { type: "string" }, description: "Top exam preparation points" },
      },
      required: ["title", "summary", "notes", "flashcards", "questions", "quiz", "formulas", "examPoints"],
      additionalProperties: false,
    },
  },
} as const;

export const Route = createFileRoute("/api/revision")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const authed = await requireUser(request);
          if (authed instanceof Response) return authed;
          const { grade, subject, content } = (await request.json()) as {
            grade: string;
            subject: string;
            content: string;
          };

          if (!content || content.trim().length < 50) {
            return Response.json({ error: "Please provide more study material (min 50 chars)." }, { status: 400 });
          }

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) return Response.json({ error: "AI not configured." }, { status: 500 });

          const system = `You are EduAssist.AI, building a CBSE/NCERT-aligned revision pack for Class ${grade} ${subject}. Calibrate difficulty and language to the grade. Be accurate, age-appropriate, and exam-focused.`;
          const user = `Build a revision pack from this material:\n\n"""\n${content.slice(0, 12000)}\n"""\n\nInclude: a clear summary, 8-12 short revision notes, 8 flashcards, 5 important questions (mix of short / long), a 5-question MCQ quiz, key formulas/definitions, and 5 top exam preparation points.`;

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              tools: [REVISION_TOOL],
              tool_choice: { type: "function", function: { name: "create_revision_pack" } },
            }),
          });

          if (!upstream.ok) {
            if (upstream.status === 429) return Response.json({ error: "Too many requests — slow down." }, { status: 429 });
            if (upstream.status === 402) return Response.json({ error: "AI credits exhausted." }, { status: 402 });
            const t = await upstream.text();
            console.error("revision gateway error:", upstream.status, t);
            return Response.json({ error: "AI gateway error" }, { status: 500 });
          }
          const data = await upstream.json();
          const args = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
          if (!args) return Response.json({ error: "No content generated" }, { status: 500 });
          const parsed = typeof args === "string" ? JSON.parse(args) : args;
          return Response.json(parsed);
        } catch (e) {
          console.error("revision error:", e);
          return Response.json({ error: "Unexpected error" }, { status: 500 });
        }
      },
    },
  },
});
