DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'parent', 'teacher');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only admins can write roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles" ON public.user_roles
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Only admins can write roles" ON public.user_roles
AS RESTRICTIVE FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code text NOT NULL UNIQUE CHECK (student_code ~ '^[0-9]{10}$'),
  student_name text NOT NULL,
  class_grade text,
  student_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  fee_amount_due numeric(10,2) NOT NULL DEFAULT 0,
  fee_status text NOT NULL DEFAULT 'paid' CHECK (fee_status IN ('paid', 'due', 'overdue')),
  fee_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS update_students_updated_at ON public.students;
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Admins full access students" ON public.students;
DROP POLICY IF EXISTS "Teachers view all students" ON public.students;
DROP POLICY IF EXISTS "Student can view own record" ON public.students;
DROP POLICY IF EXISTS "Parent can view linked child" ON public.students;

CREATE POLICY "Admins full access students" ON public.students
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Parent can view linked child" ON public.students
FOR SELECT TO authenticated USING (auth.uid() = parent_user_id);

CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin'::public.app_role) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::public.app_role);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_bootstrap_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_bootstrap_admin
AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_first_user_admin();

CREATE TABLE IF NOT EXISTS public.parent_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_requests TO authenticated;
GRANT ALL ON public.parent_requests TO service_role;
CREATE INDEX IF NOT EXISTS idx_parent_requests_parent ON public.parent_requests(parent_user_id, created_at);
ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Parents view own messages" ON public.parent_requests;
DROP POLICY IF EXISTS "Parents insert own messages" ON public.parent_requests;
DROP POLICY IF EXISTS "Admins view all parent messages" ON public.parent_requests;

CREATE POLICY "Parents view own messages" ON public.parent_requests
FOR SELECT TO authenticated USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents insert own messages" ON public.parent_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = parent_user_id AND public.has_role(auth.uid(), 'parent'::public.app_role));

CREATE POLICY "Admins view all parent messages" ON public.parent_requests
FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  chapter text,
  topic text,
  score numeric(5,2) NOT NULL,
  total numeric(5,2) NOT NULL DEFAULT 100,
  kind text NOT NULL DEFAULT 'quiz',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.performance_records TO authenticated;
GRANT ALL ON public.performance_records TO service_role;
CREATE INDEX IF NOT EXISTS idx_perf_student ON public.performance_records(student_id, created_at DESC);
ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins/teachers full access perf" ON public.performance_records;
DROP POLICY IF EXISTS "Student view own perf" ON public.performance_records;
DROP POLICY IF EXISTS "Student insert own perf" ON public.performance_records;
DROP POLICY IF EXISTS "Parent view linked child perf" ON public.performance_records;

CREATE POLICY "Admins/teachers full access perf" ON public.performance_records
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role));

CREATE POLICY "Student view own perf" ON public.performance_records
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.student_user_id = auth.uid()));

CREATE POLICY "Student insert own perf" ON public.performance_records
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.student_user_id = auth.uid()));

CREATE POLICY "Parent view linked child perf" ON public.performance_records
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.parent_user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.study_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  subject text,
  grade text,
  source_text text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_packs TO authenticated;
GRANT ALL ON public.study_packs TO service_role;
ALTER TABLE public.study_packs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owner full access study_packs" ON public.study_packs;
DROP POLICY IF EXISTS "Admins view all study_packs" ON public.study_packs;

CREATE POLICY "Owner full access study_packs" ON public.study_packs
FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins view all study_packs" ON public.study_packs
FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role));

CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Teachers/admins write announcements" ON public.announcements;

CREATE POLICY "Authenticated read announcements" ON public.announcements
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers/admins write announcements" ON public.announcements
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role));

CREATE TABLE IF NOT EXISTS public.homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  subject text,
  class_grade text,
  due_date date,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homework TO authenticated;
GRANT ALL ON public.homework TO service_role;
ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS update_homework_updated_at ON public.homework;
CREATE TRIGGER update_homework_updated_at
BEFORE UPDATE ON public.homework FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP POLICY IF EXISTS "Authenticated read homework" ON public.homework;
DROP POLICY IF EXISTS "Teachers/admins write homework" ON public.homework;

CREATE POLICY "Authenticated read homework" ON public.homework
FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers/admins write homework" ON public.homework
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'teacher'::public.app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_first_user_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;