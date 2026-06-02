import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { Moon, Sun, User, LogOut, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { property: "og:title", content: 'Settings — EduAssist.AI' },
      { property: "og:description", content: 'Manage your EduAssist.AI account, theme, and preferences.' },
      { property: "og:url", content: "https://eduassistaiorchidstheinternationalschool.lovable.app/settings" },
      { property: "og:type", content: "website" },
      
      { title: "Settings — EduAssist.AI" },
      { name: "description", content: "Manage your EduAssist.AI account, theme, and preferences." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { session, role, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="flex items-center gap-2 text-3xl font-bold" style={{ fontFamily: "Sora, Inter, sans-serif" }}>
          <SettingsIcon className="h-7 w-7 text-primary" /> Settings
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Personalize your EduAssist.AI experience.</p>

        <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-sm font-bold">Appearance</h2>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Theme</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark mode.</p>
            </div>
            <button
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-4 py-2 text-xs font-semibold hover:bg-accent"
            >
              {theme === "dark" ? <><Sun className="h-3.5 w-3.5" /> Light</> : <><Moon className="h-3.5 w-3.5" /> Dark</>}
            </button>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="flex items-center gap-2 text-sm font-bold"><User className="h-4 w-4 text-primary" /> Account</h2>
          {session ? (
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Email:</span> <span className="font-semibold">{session.user.email}</span></p>
              <p><span className="text-muted-foreground">Role:</span> <span className="font-semibold capitalize">{role ?? "student"}</span></p>
              <button
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-destructive/40 px-4 py-2 text-xs font-semibold text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">You're not signed in.</p>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-sm font-bold">Homework mode</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            When homework mode is on in the AI tutor, the bot gives one hint at a time and asks you to try the next step yourself — so you actually learn instead of just copying answers. Toggle it from the chat header.
          </p>
        </section>
      </main>
    </div>
  );
}
