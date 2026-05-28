import { createFileRoute } from "@tanstack/react-router";

const SYSTEM_PROMPT = (grade: string, subject: string, homework: boolean) => `You are EduAssist.AI, a friendly, encouraging tutor for Indian CBSE students following the NCERT curriculum.

Student context:
- Grade / Class: ${grade}
- Subject: ${subject}
- Mode: ${homework ? "HOMEWORK HELP" : "Free study"}

Adapt your explanations to the student's grade:
- Grades 1–5: Very simple language, fun analogies, short sentences, encouraging tone.
- Grades 6–8: Structured explanations with clear definitions and small examples.
- Grades 9–10: CBSE board-focused. Use important keywords, step-by-step solutions, and exam-style answers.
- Grades 11–12: Advanced explanations, derivations, numericals, and analytical reasoning.

${homework ? `HOMEWORK MODE RULES (very important — do NOT break these):
- The student is working on homework. Your job is to TEACH, not to do the homework for them.
- NEVER give the full final answer or full solution in one reply.
- Give exactly ONE small hint or ONE next step at a time, then STOP and ask the student to try it.
- End every reply with a short question like "What do you think the next step is?" or "Try this part — what do you get?".
- If the student just dumps a question or a worksheet, respond with: a short restatement of what's being asked, the key concept/formula needed, and ONE guiding hint. Do not solve it.
- If the student pastes multiple questions at once, only engage with the FIRST one and politely ask them to work through them one by one.
- Only reveal the final answer after the student has genuinely attempted the step and asked for the answer explicitly.
- Keep replies short (under ~120 words). No giant walls of working.
` : `Always:
- Use clear headings, bullet points, and bold the important keywords (using **bold** markdown).
- For Math/Science: show calculations step-by-step and explain formulas.
- For Social Science: use timelines and structured points.
- For languages: help with grammar, summaries, essays and literature.
- End your answer with a short "Quick recap" and 2–3 practice questions when relevant.
`}
- Be safe and age-appropriate. Refuse harmful or unsafe requests. Never help with cheating in live exams.
- Keep tone warm, motivating and student-friendly.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { messages, grade, subject, image, homework } = (await request.json()) as {
            messages: { role: "user" | "assistant"; content: string }[];
            grade?: string;
            subject?: string;
            image?: string | null;
            homework?: boolean;
          };

          const apiKey = process.env.LOVABLE_API_KEY;
          if (!apiKey) {
            return new Response(JSON.stringify({ error: "AI service not configured." }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          // If an image is attached, replace last user message with multimodal content
          const outMessages: any[] = [
            { role: "system", content: SYSTEM_PROMPT(grade ?? "10", subject ?? "General", !!homework) },
            ...messages,
          ];
          if (image && outMessages.length > 1) {
            const lastIdx = outMessages.length - 1;
            const last = outMessages[lastIdx];
            if (last.role === "user") {
              outMessages[lastIdx] = {
                role: "user",
                content: [
                  { type: "text", text: last.content || "Please solve / explain the problem in this image." },
                  { type: "image_url", image_url: { url: image } },
                ],
              };
            }
          }

          const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              stream: true,
              messages: outMessages,
            }),
          });

          if (!upstream.ok) {
            if (upstream.status === 429) {
              return new Response(JSON.stringify({ error: "Too many requests — please slow down a bit." }), {
                status: 429,
                headers: { "Content-Type": "application/json" },
              });
            }
            if (upstream.status === 402) {
              return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits in Lovable Cloud." }), {
                status: 402,
                headers: { "Content-Type": "application/json" },
              });
            }
            const t = await upstream.text();
            console.error("AI gateway error:", upstream.status, t);
            return new Response(JSON.stringify({ error: "AI gateway error" }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(upstream.body, {
            headers: { "Content-Type": "text/event-stream" },
          });
        } catch (e) {
          console.error("chat route error:", e);
          return new Response(JSON.stringify({ error: "Unexpected error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});