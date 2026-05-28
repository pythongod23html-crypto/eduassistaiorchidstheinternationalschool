import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, MessagesSquare, Lock } from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/parent-chat")({
  head: () => ({
    meta: [
      { title: "Parent Help Desk — EduAssist.AI" },
      { name: "description", content: "Parents can raise requests, ask about fees, leave, and meetings via the EduAssist.AI parent help desk." },
    ],
  }),
  component: ParentChatPage,
});

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Apply for sick leave tomorrow",
  "Request meeting with class teacher",
  "Question about pending fees",
  "Report a concern about my child",
];

function renderMarkdown(text: string) {
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const html = escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>')
    .replace(/^\s*[-*]\s+(.*)$/gm, '<li class="ml-5 list-disc">$1</li>')
    .replace(/\n/g, "<br/>");
  return { __html: html };
}

function ParentChatPage() {
  const { session, role, loading, student } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Load history once authenticated as parent
  useEffect(() => {
    if (!session || role !== "parent") return;
    (async () => {
      const { data } = await supabase
        .from("parent_requests")
        .select("role, content")
        .order("created_at", { ascending: true })
        .limit(100);
      if (data) setMessages(data as Msg[]);
    })();
  }, [session, role]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading…</main>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elegant">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-2xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The parent help desk is only available after signing in with your parent account.
          </p>
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-6 inline-flex items-center justify-center rounded-full gradient-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-elegant"
          >
            Sign in
          </button>
        </main>
      </div>
    );
  }

  if (role !== "parent") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-10 text-center">
          <h1 className="text-2xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>Parents only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This help desk is reserved for parent accounts. You're signed in as <strong>{role ?? "guest"}</strong>.
          </p>
          <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-full border border-input bg-background px-6 py-3 text-sm font-semibold">
            Back to home
          </Link>
        </main>
      </div>
    );
  }

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const res = await fetch("/api/parent-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 md:px-6">
        <div className="glass flex items-center gap-3 rounded-2xl p-4 shadow-soft">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
            <MessagesSquare className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>Parent Help Desk</h1>
            <p className="text-xs text-muted-foreground">
              {student ? <>Linked to <strong>{student.student_name}</strong> · Class {student.class_grade ?? "—"}</> : "Linked child not found"}
            </p>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-3xl border border-border bg-card p-4 shadow-soft md:p-6"
          style={{ minHeight: "50vh", maxHeight: "60vh" }}
        >
          {messages.length === 0 && (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Hello! Raise a request, ask about fees, or share a concern. The school admin can review your messages.
              </p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm"
                    : "max-w-[88%] rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-3 text-sm leading-relaxed"
                }
              >
                {m.role === "assistant" ? (
                  <div className="prose-sm" dangerouslySetInnerHTML={renderMarkdown(m.content)} />
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Assistant is replying…
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              disabled={sending}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="mt-3 flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:border-primary/50"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Type your request or question…"
            rows={1}
            className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-soft transition disabled:opacity-50"
            aria-label="Send"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </main>
    </div>
  );
}