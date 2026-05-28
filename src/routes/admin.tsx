import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  createStudentAccount,
  listStudents,
  updateStudentFee,
  deleteStudent,
} from "@/lib/auth.functions";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin")({ component: AdminPage });

function AdminPage() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/" });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading…</div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center px-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access denied</CardTitle>
              <CardDescription>This page is for school administrators only.</CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin · Students</h1>
          <p className="text-sm text-muted-foreground">Create student accounts and manage fees.</p>
        </div>
        <CreateStudentForm />
        <StudentsList />
      </main>
      <Footer />
    </div>
  );
}

function CreateStudentForm() {
  const qc = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [fee, setFee] = useState("0");
  const [feeStatus, setFeeStatus] = useState<"paid" | "due" | "overdue">("paid");
  const [created, setCreated] = useState<{ studentUsername: string; parentUsername: string; password: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createStudentAccount({
        data: {
          student_code: code,
          student_name: name,
          class_grade: grade || undefined,
          fee_amount_due: Number(fee) || 0,
          fee_status: feeStatus,
        },
      }),
    onSuccess: (res) => {
      setCreated({
        studentUsername: res.credentials.student.username,
        parentUsername: res.credentials.parent.username,
        password: res.credentials.student.password,
      });
      setCode("");
      setName("");
      setGrade("");
      setFee("0");
      setFeeStatus("paid");
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create student</CardTitle>
        <CardDescription>Generates student + parent login with a shared auto password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Student 10-digit code</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} pattern="[0-9]{10}" required placeholder="1234567890" />
          </div>
          <div className="space-y-2">
            <Label>Student name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Class / grade</Label>
            <Input value={grade} onChange={(e) => setGrade(e.target.value)} placeholder="Grade 8" />
          </div>
          <div className="space-y-2">
            <Label>Fee due (₹)</Label>
            <Input type="number" min="0" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Fee status</Label>
            <select
              value={feeStatus}
              onChange={(e) => setFeeStatus(e.target.value as "paid" | "due" | "overdue")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            >
              <option value="paid">Paid</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="md:col-span-2 flex items-end">
            <Button type="submit" disabled={mutation.isPending} className="w-full md:w-auto">
              {mutation.isPending ? "Creating…" : "Create student & parent accounts"}
            </Button>
          </div>
          {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}
          {created && (
            <div className="md:col-span-2 rounded-md border bg-muted/40 p-4 text-sm">
              <p className="font-semibold">✓ Accounts created — copy these credentials now:</p>
              <ul className="mt-2 space-y-1 font-mono text-xs">
                <li>Student: <strong>{created.studentUsername}</strong> / <strong>{created.password}</strong></li>
                <li>Parent: <strong>{created.parentUsername}</strong> / <strong>{created.password}</strong></li>
              </ul>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

function StudentsList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: () => listStudents(),
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteStudent({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["students"] }),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading students…</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>All students</CardTitle>
        <CardDescription>{data?.students.length ?? 0} student(s) registered</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="py-2 pr-3">Code</th>
              <th className="py-2 pr-3">Name</th>
              <th className="py-2 pr-3">Grade</th>
              
              <th className="py-2 pr-3">Fee</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.students.map((s: StudentRowProps["s"]) => <StudentRow key={s.id} s={s} onDelete={() => del.mutate(s.id)} />)}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

type StudentRowProps = {
  s: {
    id: string;
    student_code: string;
    student_name: string;
    class_grade: string | null;
    
    fee_amount_due: number;
    fee_status: string;
    fee_notes: string | null;
  };
  onDelete: () => void;
};

function StudentRow({ s, onDelete }: StudentRowProps) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [fee, setFee] = useState(String(s.fee_amount_due));
  const [status, setStatus] = useState(s.fee_status);
  const [notes, setNotes] = useState(s.fee_notes ?? "");

  const upd = useMutation({
    mutationFn: () =>
      updateStudentFee({
        data: {
          id: s.id,
          fee_amount_due: Number(fee) || 0,
          fee_status: status as "paid" | "due" | "overdue",
          fee_notes: notes || undefined,
        },
      }),
    onSuccess: () => {
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["students"] });
    },
  });

  return (
    <tr className="border-b">
      <td className="py-2 pr-3 font-mono text-xs">{s.student_code}</td>
      <td className="py-2 pr-3">{s.student_name}</td>
      <td className="py-2 pr-3">{s.class_grade ?? "—"}</td>
      
      {editing ? (
        <>
          <td className="py-2 pr-3"><Input value={fee} onChange={(e) => setFee(e.target.value)} className="h-8 w-24" /></td>
          <td className="py-2 pr-3">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-8 rounded border px-2 text-xs">
              <option value="paid">Paid</option>
              <option value="due">Due</option>
              <option value="overdue">Overdue</option>
            </select>
          </td>
          <td className="py-2 pr-3 space-x-1">
            <Button size="sm" onClick={() => upd.mutate()}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </td>
        </>
      ) : (
        <>
          <td className="py-2 pr-3">₹{s.fee_amount_due}</td>
          <td className="py-2 pr-3">
            <span className={
              s.fee_status === "paid" ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800" :
              s.fee_status === "due" ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800" :
              "rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-800"
            }>{s.fee_status}</span>
          </td>
          <td className="py-2 pr-3 space-x-1">
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit fee</Button>
            <Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete this student & linked accounts?")) onDelete(); }}>Delete</Button>
          </td>
        </>
      )}
    </tr>
  );
}