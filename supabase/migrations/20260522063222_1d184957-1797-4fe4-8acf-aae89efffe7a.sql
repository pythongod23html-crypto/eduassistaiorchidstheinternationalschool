
-- Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'parent', 'teacher');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Students table
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_code TEXT NOT NULL UNIQUE CHECK (student_code ~ '^[0-9]{10}$'),
  student_name TEXT NOT NULL,
  class_grade TEXT,
  password_plain TEXT NOT NULL,
  student_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  fee_amount_due NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_status TEXT NOT NULL DEFAULT 'paid',
  fee_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins full access students"
  ON public.students FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers view all students"
  ON public.students FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Student can view own record"
  ON public.students FOR SELECT
  TO authenticated
  USING (auth.uid() = student_user_id);

CREATE POLICY "Parent can view linked child"
  ON public.students FOR SELECT
  TO authenticated
  USING (auth.uid() = parent_user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Bootstrap: first signed-up user becomes admin
CREATE OR REPLACE FUNCTION public.handle_first_user_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_bootstrap_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_user_admin();

-- Parent requests (parent chat history)
CREATE TABLE public.parent_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_user_id UUID NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_parent_requests_parent ON public.parent_requests(parent_user_id, created_at);

ALTER TABLE public.parent_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own messages"
ON public.parent_requests FOR SELECT
TO authenticated
USING (auth.uid() = parent_user_id);

CREATE POLICY "Parents insert own messages"
ON public.parent_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = parent_user_id AND has_role(auth.uid(), 'parent'::app_role));

CREATE POLICY "Admins view all parent messages"
ON public.parent_requests FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_first_user_admin() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;

-- ============ NEW: Performance & content tables for AI upgrades ============

-- Quiz / homework attempts to power weak-topic detection
CREATE TABLE public.performance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT,
  score NUMERIC(5,2) NOT NULL,
  total NUMERIC(5,2) NOT NULL DEFAULT 100,
  kind TEXT NOT NULL DEFAULT 'quiz', -- quiz | homework | test
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_perf_student ON public.performance_records(student_id, created_at DESC);

ALTER TABLE public.performance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins/teachers full access perf"
  ON public.performance_records FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));

CREATE POLICY "Student view own perf"
  ON public.performance_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.student_user_id = auth.uid()));

CREATE POLICY "Student insert own perf"
  ON public.performance_records FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.student_user_id = auth.uid()));

CREATE POLICY "Parent view linked child perf"
  ON public.performance_records FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.students s WHERE s.id = student_id AND s.parent_user_id = auth.uid()));

-- Generated study packs (revision notes, flashcards, etc.)
CREATE TABLE public.study_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT,
  grade TEXT,
  source_text TEXT,
  payload JSONB NOT NULL, -- { summary, notes[], flashcards[], questions[], quizzes[], formulas[] }
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.study_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner full access study_packs"
  ON public.study_packs FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins view all study_packs"
  ON public.study_packs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));

-- Announcements / homework
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all', -- all | students | parents | grade:<grade>
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read announcements"
  ON public.announcements FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers/admins write announcements"
  ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
