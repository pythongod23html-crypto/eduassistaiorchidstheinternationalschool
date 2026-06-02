import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BookMarked, Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

type Homework = {
  id: string;
  title: string;
  description: string;
  subject: string | null;
  class_grade: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
};

export const Route = createFileRoute("/homework")({
  head: () => ({
    meta: [
      { property: "og:title", content: 'Homework — EduAssist.AI' },
      { property: "og:description", content: 'Homework posted by teachers, visible to students and parents.' },
      { property: "og:url", content: "https://eduassistaiorchidstheinternationalschool.lovable.app/homework" },
      { property: "og:type", content: "website" },
      
      { title: "Homework — EduAssist.AI" },
      { name: "description", content: "Homework posted by teachers, visible to students and parents." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  const { role, session } = useAuth();
  const canWrite = role === "teacher" || role === "admin";
  const [items, setItems] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", subject: "", class_grade: "", due_date: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("homework")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Homework[]);
    setLoading(false);
  };

  useEffect(() => { if (session) load(); }, [session]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    const { error } = await supabase.from("homework").insert({
      title: form.title.trim(),
      description: form.description.trim(),
      subject: form.subject.trim() || null,
      class_grade: form.class_grade.trim() || null,
      due_date: form.due_date || null,
      created_by: session!.user.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Homework posted");
    setForm({ title: "", description: "", subject: "", class_grade: "", due_date: "" });
    setShowForm(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this homework?")) return;
    const { error } = await supabase.from("homework").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <BookMarked className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Homework</h1>
            <p className="text-sm text-muted-foreground">
              {canWrite ? "Post homework for students and parents." : "Assignments posted by your teachers."}
            </p>
          </div>
        </div>
        {canWrite && (
          <Button onClick={() => setShowForm((s) => !s)} size="sm">
            <Plus className="mr-1 h-4 w-4" /> {showForm ? "Cancel" : "New"}
          </Button>
        )}
      </div>

      {canWrite && showForm && (
        <Card className="mb-6 p-5">
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Algebra worksheet — Ch. 4" required />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input id="subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Math" />
              </div>
              <div>
                <Label htmlFor="class_grade">Class</Label>
                <Input id="class_grade" value={form.class_grade} onChange={(e) => setForm({ ...form, class_grade: e.target.value })} placeholder="Class 10" />
              </div>
              <div>
                <Label htmlFor="due_date">Due date</Label>
                <Input id="due_date" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Questions, instructions, page numbers…" />
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>{saving ? "Posting…" : "Post homework"}</Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No homework yet.
        </Card>
      ) : (
        <ul className="space-y-3">
          {items.map((h) => (
            <Card key={h.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{h.title}</h3>
                    {h.subject && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{h.subject}</span>}
                    {h.class_grade && <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">{h.class_grade}</span>}
                  </div>
                  {h.due_date && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" /> Due {new Date(h.due_date).toLocaleDateString()}
                    </p>
                  )}
                  {h.description && (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{h.description}</p>
                  )}
                </div>
                {canWrite && (
                  <Button variant="ghost" size="icon" onClick={() => remove(h.id)} aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
