import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { adminExists, bootstrapAdminSignup } from "@/lib/admin-signup.functions";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin-signup")({ component: AdminSignupPage });

function AdminSignupPage() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(adminExists);
  const doBootstrap = useServerFn(bootstrapAdminSignup);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [closed, setClosed] = useState<boolean | null>(null);

  useEffect(() => {
    checkAdmin()
      .then((r) => setClosed(r.exists))
      .catch(() => setClosed(false));
  }, [checkAdmin]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      await doBootstrap({ data: { email, password } });
      // Auto sign-in
      const { error: signErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signErr) {
        setInfo("Admin account created. Please sign in.");
        navigate({ to: "/login" });
        return;
      }
      navigate({ to: "/admin" });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Admin sign up</CardTitle>
            <CardDescription>
              This page provisions the first school administrator. Once an admin exists,
              new accounts must be created from the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {closed === true ? (
              <div className="space-y-3">
                <p className="text-sm text-destructive">
                  Admin signup is closed — an administrator already exists for this school.
                </p>
                <Link to="/login" className="text-sm font-medium text-primary hover:underline">
                  Go to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                {info && <p className="text-sm text-primary">{info}</p>}
                <Button type="submit" disabled={loading || closed === null} className="w-full">
                  {loading ? "Creating…" : "Create admin account"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
