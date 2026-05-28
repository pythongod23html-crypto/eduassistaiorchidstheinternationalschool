CREATE TABLE public.homework (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  subject text,
  class_grade text,
  due_date date,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.homework ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read homework"
  ON public.homework FOR SELECT TO authenticated USING (true);

CREATE POLICY "Teachers/admins write homework"
  ON public.homework FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE TRIGGER update_homework_updated_at
  BEFORE UPDATE ON public.homework
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();