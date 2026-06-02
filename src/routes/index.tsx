import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import {
  Sparkles, BookOpen, Brain, Calculator, FlaskConical, Globe2, Languages,
  Code2, Landmark, MessageCircle, Notebook, Trophy, Target, Zap,
  CheckCircle2, ArrowRight, GraduationCap,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EduAssist.AI — Your Personal CBSE AI Tutor for Grades 1–12" },
      { name: "description", content: "AI-powered CBSE learning platform for students from Grade 1 to 12. Doubt solving, notes, quizzes, revision and exam prep — adapted to your class." },
      { property: "og:title", content: "EduAssist.AI — Smarter Learning for CBSE Students" },
      { property: "og:description", content: "Personal AI tutor following NCERT and CBSE curriculum. Learn smarter from Class 1 to Class 12." },
      { property: "og:url", content: "https://eduassistaiorchidstheinternationalschool.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            { "@type": "Question", name: "Which classes does EduAssist.AI support?", acceptedAnswer: { "@type": "Answer", text: "All CBSE grades from Class 1 to Class 12, across every major subject." } },
            { "@type": "Question", name: "Does it follow the NCERT syllabus?", acceptedAnswer: { "@type": "Answer", text: "Yes. Explanations, examples and practice align with NCERT and CBSE board guidelines." } },
            { "@type": "Question", name: "Is it safe for younger students?", acceptedAnswer: { "@type": "Answer", text: "Absolutely. The tutor uses age-appropriate language, refuses unsafe content, and never encourages cheating." } },
            { "@type": "Question", name: "Can I generate notes and worksheets?", acceptedAnswer: { "@type": "Answer", text: "Yes — ask for notes, MCQs, flashcards, mind maps, formula sheets or full worksheets for any chapter." } },
            { "@type": "Question", name: "Is it free to start?", acceptedAnswer: { "@type": "Answer", text: "Yes, you can start learning right away. Premium plans unlock advanced revision tools and analytics." } },
          ],
        }),
      },
    ],
  }),
  component: Index,
});

const subjects = [
  { name: "Mathematics", icon: Calculator, color: "from-blue-500 to-indigo-500" },
  { name: "Physics", icon: Zap, color: "from-violet-500 to-purple-500" },
  { name: "Chemistry", icon: FlaskConical, color: "from-emerald-500 to-teal-500" },
  { name: "Biology", icon: Brain, color: "from-pink-500 to-rose-500" },
  { name: "English", icon: BookOpen, color: "from-amber-500 to-orange-500" },
  { name: "Hindi", icon: Languages, color: "from-red-500 to-pink-500" },
  { name: "Social Science", icon: Globe2, color: "from-cyan-500 to-sky-500" },
  { name: "History", icon: Landmark, color: "from-yellow-600 to-amber-600" },
  { name: "Computer Science", icon: Code2, color: "from-fuchsia-500 to-purple-500" },
  { name: "Accountancy", icon: Notebook, color: "from-lime-600 to-green-600" },
];

const features = [
  { icon: MessageCircle, title: "Conversational AI Tutor", desc: "Ask anything in your own words. Get clear, step-by-step explanations adapted to your grade." },
  { icon: GraduationCap, title: "Grade-aware Learning", desc: "From Class 1 to Class 12 — vocabulary, depth, and examples adjust automatically to your level." },
  { icon: Notebook, title: "Notes & Worksheets", desc: "Generate board-style notes, MCQs, flashcards, mind maps and worksheets for any chapter." },
  { icon: Target, title: "Exam Preparation", desc: "PYQs, formula sheets, revision planners, and timed quizzes — built for the CBSE pattern." },
  { icon: Trophy, title: "Progress & Streaks", desc: "Track study streaks, mastered topics, and analytics that show exactly what to revise next." },
  { icon: Sparkles, title: "Beyond Just Answers", desc: "Explain Simpler, Generate Quiz, Summarize — turn any topic into the format that helps you most." },
];

const steps = [
  { n: "01", title: "Pick your class", desc: "Tell us your grade (1–12) and the subject or chapter you want help with." },
  { n: "02", title: "Ask anything", desc: "Type a doubt, paste a question, or request notes — your AI tutor adapts instantly." },
  { n: "03", title: "Learn & revise", desc: "Get explanations, practice questions and quizzes that match your CBSE syllabus." },
];

const faqs = [
  { q: "Which classes does EduAssist.AI support?", a: "All CBSE grades from Class 1 to Class 12, across every major subject." },
  { q: "Does it follow the NCERT syllabus?", a: "Yes. Explanations, examples and practice align with NCERT and CBSE board guidelines." },
  { q: "Is it safe for younger students?", a: "Absolutely. The tutor uses age-appropriate language, refuses unsafe content, and never encourages cheating." },
  { q: "Can I generate notes and worksheets?", a: "Yes — ask for notes, MCQs, flashcards, mind maps, formula sheets or full worksheets for any chapter." },
  { q: "Is it free to start?", a: "Yes, you can start learning right away. Premium plans unlock advanced revision tools and analytics." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" aria-hidden />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28 lg:pt-32">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Built for CBSE · Class 1 to Class 12
            </span>
            <h1
              className="mt-6 text-5xl font-extrabold leading-[1.05] text-foreground md:text-6xl lg:text-7xl"
              style={{ fontFamily: "Sora, Inter, sans-serif" }}
            >
              Your personal{" "}
              <span className="text-gradient">CBSE AI tutor</span>
              <br />for every subject.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Solve doubts, generate notes, practice quizzes and revise smarter — all in one
              place. Explanations adapt to your class, your pace, and the way you learn best.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/chat"
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95"
              >
                Start Learning Smarter <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-7 py-3.5 text-base font-semibold text-foreground shadow-soft transition hover:bg-secondary"
              >
                Explore Dashboard
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> NCERT-aligned</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Step-by-step explanations</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> Safe & age-appropriate</span>
            </div>
          </div>

          {/* Mock chat preview */}
          <div className="relative mx-auto mt-16 max-w-4xl">
            <div className="glass rounded-3xl p-2 shadow-elegant">
              <div className="rounded-2xl bg-card p-6 md:p-8">
                <div className="flex items-center gap-2 border-b border-border pb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  <span className="ml-3 text-xs text-muted-foreground">Class 10 · Science · Chapter 1</span>
                </div>
                <div className="mt-5 space-y-4">
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-secondary px-4 py-3 text-sm">
                      Explain the law of conservation of mass with an example.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl rounded-tl-sm gradient-primary px-4 py-3 text-sm text-primary-foreground shadow-soft">
                      <p className="font-semibold">Law of Conservation of Mass</p>
                      <p className="mt-1 opacity-90">In a chemical reaction, mass is neither created nor destroyed.</p>
                      <p className="mt-2 opacity-90">Example: 2H₂ + O₂ → 2H₂O — total mass of reactants equals products.</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {["Explain Simpler", "Generate Quiz", "Important Formulas", "Summarize"].map(c => (
                      <span key={c} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            Everything a CBSE student needs
          </h2>
          <p className="mt-3 text-muted-foreground">
            One AI companion for doubts, notes, practice and exams — designed for Indian classrooms.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SUBJECTS */}
      <section id="subjects" className="bg-secondary/40 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              All subjects, every grade
            </h2>
            <p className="mt-3 text-muted-foreground">
              Math to Music — across the full CBSE curriculum from Class 1 to 12.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {subjects.map(s => (
              <div key={s.name} className="rounded-2xl border border-border bg-card p-5 text-center shadow-soft transition hover:-translate-y-1 hover:shadow-elegant">
                <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-semibold">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="mx-auto max-w-7xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground">Three steps. Zero friction.</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(s => (
            <div key={s.n} className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-soft">
              <span className="absolute -right-2 -top-4 text-7xl font-extrabold text-primary/10" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
                {s.n}
              </span>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-secondary/40 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              Frequently asked
            </h2>
            <p className="mt-3 text-muted-foreground">Quick answers about EduAssist.AI.</p>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map(f => (
              <details key={f.q} className="group rounded-2xl border border-border bg-card p-5 shadow-soft">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold">
                  {f.q}
                  <span className="ml-4 text-primary transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>


      <Footer />
    </div>
  );
}
