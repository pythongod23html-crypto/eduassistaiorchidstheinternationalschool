import logo from "@/assets/eduassist-logo.jpeg";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <img src={logo} alt="EduAssist.AI logo" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-lg font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
              EduAssist <span className="text-gradient">AI</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            Your personal CBSE AI tutor. Built to help students from Grade 1 to 12 learn smarter, revise faster, and ace every exam.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>AI Chat Tutor</li>
            <li>Quiz Generator</li>
            <li>Flashcards</li>
            <li>Revision Planner</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Resources</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>NCERT Notes</li>
            <li>Previous Year Papers</li>
            <li>Formula Sheets</li>
            <li>Mind Maps</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EduAssist.AI · Made for CBSE students across India
      </div>
    </footer>
  );
}