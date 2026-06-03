import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { resolveLoginEmail } from "@/lib/auth.functions";
import { seedDemo } from "@/lib/demo.functions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({ component: LoginPage });

const DEMO_ACCOUNTS: { label: string; username: string }[] = [
  { label: "Admin", username: "admin_demo" },
  { label: "Teacher", username: "teacher_demo" },
  { label: "Student 1", username: "1000000001_OIS" },
  { label: "Parent 1", username: "p1000000001_OIS" },
  { label: "Student 2", username: "1000000002_OIS" },
  { label: "Parent 2", username: "p1000000002_OIS" },
  { label: "Student 3", username: "1000000003_OIS" },
  { label: "Parent 3", username: "p1000000003_OIS" },
];

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ensureDemo = useServerFn(seedDemo);

  useEffect(() => {
    // Idempotently make sure demo accounts exist so the chips below always work.
    ensureDemo().catch((e) => console.warn("seedDemo failed", e));
  }, [ensureDemo]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { email } = await resolveLoginEmail({ data: { username } });
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) throw signErr;
      const u = username.trim().toLowerCase();
      if (u.startsWith("p") && /^p\d{10}_ois$/.test(u)) navigate({ to: "/parent" });
      else if (/^\d{10}_ois$/.test(u)) navigate({ to: "/chat" });
      else if (u.includes("teacher")) navigate({ to: "/teacher" });
      else navigate({ to: "/admin" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(u: string) {
    setUsername(u);
    setPassword("OrchidEdu#2026");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Sign in to EduAssist.AI</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Quick demo login — password <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">Demo1234</code>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {DEMO_ACCOUNTS.map((a) => (
                  <button
                    key={a.username}
                    type="button"
                    onClick={() => fillDemo(a.username)}
                    className="rounded-full border border-input bg-background px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="1234567890_OIS"
                  required
                  autoComplete="username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in…" : "Sign in"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                School admin?{" "}
                <Link to="/admin-signup" className="font-medium text-primary hover:underline">
                  Set up admin account
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
