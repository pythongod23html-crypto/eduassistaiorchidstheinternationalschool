import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import logo from "@/assets/eduassist-logo.jpeg";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

// Pages where the top bar should NOT be shown (logged-in portals)
const PORTAL_ROUTES = [
  "/chat",
  "/dashboard",
  "/quiz",
  "/flashcards",
  "/revision",
  "/planner",
  "/settings",
  "/weekly-quiz",
  "/teacher",
  "/admin",
  "/parent",
  "/parent-chat",
  "/parent-dashboard",
  "/homework",
  "/exam-mode",
];

export function Header() {
  const { session, role, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  // Hide header on all logged-in portal pages
  const isPortal = PORTAL_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"));
  if (isPortal) return null;

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleScrollLink = (e: React.MouseEvent, hash: string) => {
    if (pathname === "/") {
      e.preventDefault();
      scrollTo(hash);
    } else {
      navigate({ to: "/", hash });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="EduAssist.AI logo" className="h-7 w-7 rounded-lg object-cover shadow-soft" />
          <span className="text-sm font-bold tracking-tight" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
            EduAssist<span className="text-gradient">.AI</span>
          </span>
        </Link>
        <nav className="hidden flex-1 items-center justify-center gap-5 md:flex">
          <button
            onClick={(e) => handleScrollLink(e, "features")}
            className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground bg-transparent border-none cursor-pointer p-0"
          >
            Features
          </button>
          <button
            onClick={(e) => handleScrollLink(e, "subjects")}
            className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground bg-transparent border-none cursor-pointer p-0"
          >
            Subjects
          </button>
          <Link to="/quiz" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Quiz</Link>
          <Link to="/flashcards" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Flashcards</Link>
          <Link to="/revision" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Revision</Link>
          <Link to="/planner" className="whitespace-nowrap text-xs font-medium text-muted-foreground transition hover:text-foreground">Planner</Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-input bg-background text-foreground transition hover:bg-accent"
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          {session ? (
            <button
              onClick={async () => { await signOut(); navigate({ to: "/" }); }}
              className="inline-flex items-center justify-center rounded-full border border-input bg-background px-4 py-1.5 text-xs font-semibold text-foreground transition hover:bg-accent"
            >
              Sign out
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full gradient-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-elegant transition hover:opacity-95"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
