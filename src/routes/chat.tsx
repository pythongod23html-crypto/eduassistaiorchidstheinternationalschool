import { authedFetch } from "@/lib/authed-fetch";
import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Camera, Mic, MicOff, X, Plus, Search, SlidersHorizontal, ChevronDown, AlertTriangle, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ClauseAvatar as SparkAvatar } from "@/components/ClauseAvatar";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Spark — Your AI Tutor" },
      { name: "description", content: "Chat with Spark, your personal CBSE AI tutor. Get step-by-step explanations, notes, and practice questions adapted to your grade." },
    ],
  }),
  component: ChatPage,
});

type Msg = { role: "user" | "assistant"; content: string; image?: string };

type Doubt = {
  id: string;
  subject: string;
  title: string;
  createdAt: number;
  status: "open" | "resolved";
  messages: Msg[];
};

const GRADES = Array.from({ length: 12 }, (_, i) => `${i + 1}`);
const SUBJECTS = [
  "Mathematics", "Science", "Physics", "Chemistry", "Biology",
  "Social Science", "History", "Geography", "Political Science", "Economics",
  "English", "Hindi", "Computer Science", "Accountancy", "Business Studies",
];

const STYLES = ["Detailed", "Brief", "Step-by-step"] as const;
const DOUBTS_KEY = "clause.doubts.v1";

function loadDoubts(): Doubt[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(DOUBTS_KEY) || "[]"); } catch { return []; }
}
function saveDoubts(d: Doubt[]) {
  try { localStorage.setItem(DOUBTS_KEY, JSON.stringify(d)); } catch {}
}
function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function MarkdownView({ text }: { text: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-table:text-xs prose-th:border prose-th:border-border prose-th:bg-secondary prose-th:px-2 prose-th:py-1 prose-td:border prose-td:border-border prose-td:px-2 prose-td:py-1 prose-code:rounded prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:text-[0.85em] prose-pre:bg-secondary">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {text || "…"}
      </ReactMarkdown>
    </div>
  );
}

function ChatPage() {
  const [grade, setGrade] = useState("10");
  const [subject, setSubject] = useState("Mathematics");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [style, setStyle] = useState<typeof STYLES[number]>("Detailed");
  const [doubts, setDoubts] = useState<Doubt[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [doubtFilter, setDoubtFilter] = useState<"open" | "resolved">("open");
  const [doubtSearch, setDoubtSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setDoubts(loadDoubts()); }, []);
  useEffect(() => { if (doubts.length) saveDoubts(doubts); }, [doubts]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const newDoubt = () => {
    setActiveId(null);
    setMessages([]);
    setInput("");
    setImageData(null);
    setError(null);
  };

  const openDoubt = (d: Doubt) => {
    setActiveId(d.id);
    setMessages(d.messages);
    setSubject(d.subject);
    setError(null);
  };

  const upsertDoubt = (msgs: Msg[]) => {
    setDoubts(prev => {
      const id = activeId ?? crypto.randomUUID();
      const title = msgs.find(m => m.role === "user")?.content?.slice(0, 80) || "New doubt";
      const existing = prev.find(d => d.id === id);
      const updated: Doubt = existing
        ? { ...existing, messages: msgs, title }
        : { id, subject, title, createdAt: Date.now(), status: "open", messages: msgs };
      if (!activeId) setActiveId(id);
      const next = existing ? prev.map(d => (d.id === id ? updated : d)) : [updated, ...prev];
      saveDoubts(next);
      return next;
    });
  };

  const toggleResolved = (id: string) => {
    setDoubts(prev => {
      const next = prev.map(d => d.id === id ? { ...d, status: d.status === "open" ? "resolved" as const : "open" as const } : d);
      saveDoubts(next);
      return next;
    });
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if ((!trimmed && !imageData) || loading) return;
    setError(null);
    const userMsg: Msg = { role: "user", content: trimmed || "(Please solve this from the image)", image: imageData ?? undefined };
    const next = [...messages, userMsg];
    setMessages(next);
    upsertDoubt(next);
    setInput("");
    const sentImage = imageData;
    setImageData(null);
    setLoading(true);

    try {
      const res = await authedFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, grade, subject, image: sentImage, style }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to reach the AI tutor.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistant = "";
      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line || line.startsWith(":")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistant += delta;
              setMessages(prev => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistant };
                return copy;
              });
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      setMessages(prev => { upsertDoubt(prev); return prev; });
    } catch (e: any) {
      setError(e.message || "Something went wrong.");
      setMessages(prev => prev.filter(m => m.content !== ""));
    } finally {
      setLoading(false);
    }
  };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please upload an image file."); return; }
    if (file.size > 4 * 1024 * 1024) { setError("Image too large (max 4MB)."); return; }
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError("Voice input isn't supported in this browser. Try Chrome on desktop or Android.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new SR();
    rec.lang = "en-IN";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e: any) => {
      let txt = "";
      for (let i = e.resultIndex; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setInput((prev) => (prev ? prev + " " : "") + txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const filteredDoubts = doubts
    .filter(d => d.status === doubtFilter)
    .filter(d => !doubtSearch || d.title.toLowerCase().includes(doubtSearch.toLowerCase()) || d.subject.toLowerCase().includes(doubtSearch.toLowerCase()));

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-3 md:p-5">
        {/* Sidebar */}
        <aside className="hidden w-[300px] shrink-0 flex-col gap-4 rounded-3xl border border-border bg-card/60 p-4 shadow-soft md:flex lg:w-[340px]">
          <div className="flex items-start gap-3">
            <SparkAvatar size={56} state="idle" />
            <h2 className="text-base font-semibold leading-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              How can Spark help you today?
            </h2>
          </div>

          <button
            onClick={newDoubt}
            className="flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> New Doubt
          </button>

          <button
            onClick={() => setShowSearch(v => !v)}
            className="flex items-center justify-center gap-2 rounded-full py-2 text-sm font-medium text-foreground/80 hover:text-foreground"
          >
            <Search className="h-4 w-4" /> Search Module Questions
          </button>

          {showSearch && (
            <input
              autoFocus
              value={doubtSearch}
              onChange={e => setDoubtSearch(e.target.value)}
              placeholder="Search your doubts…"
              className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary/50 focus:outline-none"
            />
          )}

          <div className="mt-1 flex items-center justify-between">
            <h3 className="text-base font-bold">My Doubts</h3>
            {filteredDoubts.some(d => d.status === "open") && (
              <AlertTriangle className="h-5 w-5 text-foreground/80" />
            )}
          </div>

          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filter
            </button>
            <button
              onClick={() => setDoubtFilter("open")}
              className={`rounded-lg border px-3 py-1 text-xs font-medium ${doubtFilter === "open" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
            >
              Open
            </button>
            <button
              onClick={() => setDoubtFilter("resolved")}
              className={`rounded-lg border px-3 py-1 text-xs font-medium ${doubtFilter === "resolved" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
            >
              Resolved
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {filteredDoubts.length === 0 && (
              <p className="px-1 text-xs text-muted-foreground">No {doubtFilter} doubts yet.</p>
            )}
            {filteredDoubts.map(d => (
              <button
                key={d.id}
                onClick={() => openDoubt(d)}
                className={`block w-full border-b border-border pb-3 text-left transition ${activeId === d.id ? "opacity-100" : "opacity-90 hover:opacity-100"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-md bg-primary/15 text-[10px] font-bold text-primary">
                      {d.subject.slice(0, 2).toUpperCase()}
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wide">{d.subject}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">{fmtTime(d.createdAt)}</span>
                </div>
                <p className="mt-1.5 line-clamp-1 text-sm text-foreground/90">{d.title}</p>
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); toggleResolved(d.id); }}
                  className="mt-1 inline-block text-[11px] text-primary hover:underline"
                >
                  Mark as {d.status === "open" ? "resolved" : "open"}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main panel */}
        <section className="chat-sky relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-border shadow-soft">
          {/* Stars layer (light: subtle dots, dark: twinkling night sky) */}
          <div className="chat-stars pointer-events-none absolute inset-0" />
          <div className="chat-stars-twinkle pointer-events-none absolute inset-0" />
          <div className="chat-shooting pointer-events-none absolute inset-0 hidden dark:block" />

          {isEmpty ? (
            <div className="relative z-10 flex flex-1 flex-col items-center px-4 pb-8 pt-8 md:pt-12">
              <SparkAvatar size={140} state="idle" />
              <h1 className="mt-10 text-center text-3xl font-bold text-foreground md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
                How can Spark help you today?
              </h1>
              <p className="mt-2 text-center text-base text-muted-foreground">Clear your doubts instantly</p>

              <div className="mt-10 w-full max-w-2xl">
                <ChatInputCard
                  input={input} setInput={setInput}
                  imageData={imageData} setImageData={setImageData}
                  loading={loading} listening={listening}
                  style={style} setStyle={setStyle}
                  send={send} toggleMic={toggleMic}
                  onFile={onFile} fileInputRef={fileInputRef}
                  grade={grade} subject={subject}
                />
              </div>

              <div className="my-6 flex items-center gap-3 text-xs font-semibold tracking-wider text-muted-foreground">
                <span>OR</span>
              </div>

              <button
                onClick={() => setShowSearch(true)}
                className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-foreground shadow-soft transition hover:shadow-elegant dark:bg-white/10 dark:text-foreground dark:backdrop-blur-sm"
              >
                <Search className="h-4 w-4" /> Search Module Questions
              </button>

              {/* Class / subject row */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 dark:bg-white/10">
                  Class
                  <select value={grade} onChange={e => setGrade(e.target.value)} className="bg-transparent font-semibold text-foreground focus:outline-none">
                    {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 dark:bg-white/10">
                  Subject
                  <select value={subject} onChange={e => setSubject(e.target.value)} className="bg-transparent font-semibold text-foreground focus:outline-none">
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              </div>
            </div>
          ) : (
            <div className="relative z-10 flex flex-1 flex-col">
              <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 md:p-6">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="mr-2 mt-1 hidden shrink-0 sm:block">
                        <SparkAvatar size={64} state={loading && i === messages.length - 1 ? "answering" : "speaking"} />
                      </div>
                    )}
                    <div className={m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-tr-sm bg-primary/15 px-4 py-3 text-sm text-foreground"
                      : `relative max-w-[88%] rounded-2xl rounded-tl-sm border px-4 py-3 text-sm leading-relaxed text-foreground backdrop-blur-sm ${/i remember|remembered|last time|yesterday we|recall(ing)?/i.test(m.content) ? "border-primary/40 bg-gradient-to-br from-primary/10 to-accent/10 shadow-[0_0_24px_-8px_hsl(var(--primary)/0.5)] dark:border-primary/30" : "border-border bg-white/85 dark:border-white/10 dark:bg-white/5"}`}>
                      {m.role === "assistant" && /i remember|remembered|last time|yesterday we|recall(ing)?/i.test(m.content) && (
                        <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
                          <span className="relative grid h-5 w-5 place-items-center rounded-full gradient-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.6)]">
                            <Brain className="h-3 w-3" />
                          </span>
                          Spark remembers
                        </div>
                      )}
                      {m.image && <img src={m.image} alt="Uploaded" className="mb-2 max-h-60 rounded-lg" />}
                      {m.role === "assistant" ? <MarkdownView text={m.content} /> : <span>{m.content}</span>}
                    </div>
                  </div>
                ))}
                {loading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <SparkAvatar size={56} state="answering" />
                    <span>Spark is answering…</span>
                  </div>
                )}
                {error && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                )}
              </div>
              <div className="border-t border-white/40 bg-white/40 p-3 backdrop-blur-sm dark:border-white/10 dark:bg-white/5 md:p-4">
                <ChatInputCard
                  input={input} setInput={setInput}
                  imageData={imageData} setImageData={setImageData}
                  loading={loading} listening={listening}
                  style={style} setStyle={setStyle}
                  send={send} toggleMic={toggleMic}
                  onFile={onFile} fileInputRef={fileInputRef}
                  grade={grade} subject={subject}
                />
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function ChatInputCard(props: {
  input: string; setInput: (s: string) => void;
  imageData: string | null; setImageData: (s: string | null) => void;
  loading: boolean; listening: boolean;
  style: typeof STYLES[number]; setStyle: (s: typeof STYLES[number]) => void;
  send: (t: string) => void; toggleMic: () => void;
  onFile: (f: File | undefined) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  grade: string; subject: string;
}) {
  const { input, setInput, imageData, setImageData, loading, listening, style, setStyle, send, toggleMic, onFile, fileInputRef, grade, subject } = props;
  const [styleOpen, setStyleOpen] = useState(false);
  return (
    <form
      onSubmit={e => { e.preventDefault(); send(input); }}
      className="rounded-3xl bg-white p-4 shadow-elegant dark:border dark:border-white/10 dark:bg-white/5 dark:backdrop-blur-md"
    >
      {imageData && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-2">
          <img src={imageData} alt="preview" className="h-12 w-12 rounded-md object-cover" />
          <span className="text-xs text-muted-foreground">Image attached — Spark will analyze it.</span>
          <button type="button" onClick={() => setImageData(null)} className="ml-auto rounded-full p-1 hover:bg-secondary" aria-label="Remove image">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
        placeholder="Type your doubt…"
        rows={2}
        className="w-full resize-none bg-transparent px-1 py-1 text-base text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
      />

      <div className="mt-2 flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onFile(e.target.files?.[0])}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className="grid h-10 w-10 place-items-center rounded-full text-foreground/70 hover:bg-secondary"
          aria-label="Upload photo"
          title="Upload photo"
        >
          <Camera className="h-5 w-5" />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setStyleOpen(v => !v)}
            className="flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-medium"
          >
            {style} <ChevronDown className="h-4 w-4" />
          </button>
          {styleOpen && (
            <div className="absolute left-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-xl border border-border bg-card shadow-elegant">
              {STYLES.map(s => (
                <button
                  type="button"
                  key={s}
                  onClick={() => { setStyle(s); setStyleOpen(false); }}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-secondary ${s === style ? "font-semibold text-primary" : ""}`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="ml-2 hidden text-[11px] text-muted-foreground sm:inline">
          Class {grade} · {subject}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleMic}
            disabled={loading}
            className={`grid h-10 w-10 place-items-center rounded-full transition ${listening ? "bg-destructive text-destructive-foreground animate-pulse" : "text-foreground/70 hover:bg-secondary"}`}
            aria-label={listening ? "Stop voice input" : "Start voice input"}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <button
            type="submit"
            disabled={loading || (!input.trim() && !imageData)}
            className="grid h-10 w-10 place-items-center rounded-full bg-foreground/15 text-foreground transition hover:bg-foreground/25 disabled:opacity-50"
            aria-label="Send"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </form>
  );
}