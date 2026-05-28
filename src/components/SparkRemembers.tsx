import { Brain, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

const RECENT_STRUGGLES = [
  { topic: "Quadratic Equations — discriminant cases", subject: "Math · Class 10", when: "Yesterday" },
  { topic: "Mole concept stoichiometry", subject: "Chemistry · Class 11", when: "2 days ago" },
  { topic: "Difference between mitosis & meiosis", subject: "Biology · Class 10", when: "3 days ago" },
];

export function SparkRemembers() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-8 w-8 items-center justify-center rounded-xl gradient-primary text-primary-foreground shadow-elegant">
            <Brain className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 grid h-3 w-3 place-items-center rounded-full bg-amber-400 text-amber-900 shadow">
              <Sparkles className="h-2 w-2" />
            </span>
          </div>
          <h3 className="text-sm font-semibold">Spark remembers</h3>
        </div>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Memory ledger</span>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Topics you recently struggled with. Spark will pull these into your next session.
      </p>
      <ul className="mt-4 space-y-2.5">
        {RECENT_STRUGGLES.map((s) => (
          <li
            key={s.topic}
            className="group rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-accent/5 p-3 transition hover:border-primary/40"
          >
            <p className="text-sm font-medium leading-snug">{s.topic}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{s.subject} · {s.when}</p>
          </li>
        ))}
      </ul>
      <Link
        to="/chat"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition hover:bg-primary/15"
      >
        <Sparkles className="h-3.5 w-3.5" /> Revisit with Spark
      </Link>
    </div>
  );
}
