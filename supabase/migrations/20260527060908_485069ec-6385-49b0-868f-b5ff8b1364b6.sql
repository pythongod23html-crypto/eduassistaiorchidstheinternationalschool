-- Remove plaintext password storage
ALTER TABLE public.students DROP COLUMN IF EXISTS password_plain;

-- Remove direct student SELECT access to students table.
-- Student data is fetched server-side via getMyContext (service role),
-- which excludes sensitive fee columns for student role.
DROP POLICY IF EXISTS "Student can view own record" ON public.students;