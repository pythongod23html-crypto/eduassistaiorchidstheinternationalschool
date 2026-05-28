
-- 1. Remove plaintext password column entirely
ALTER TABLE public.students DROP COLUMN IF EXISTS password_plain;

-- 2. Remove broad teacher SELECT on students (incl. fee data)
DROP POLICY IF EXISTS "Teachers view all students" ON public.students;

-- 3. Lock down user_roles writes with a RESTRICTIVE admin-only policy
DROP POLICY IF EXISTS "Only admins can write roles" ON public.user_roles;
CREATE POLICY "Only admins can write roles"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
