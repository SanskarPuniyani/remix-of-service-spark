
-- Allow workers to accept/update their own record (matched by email before user_id is set)
CREATE POLICY "Workers can accept requests by email"
ON public.workers
FOR UPDATE
TO authenticated
USING (
  email = (SELECT email FROM public.profiles WHERE profiles.user_id = auth.uid() LIMIT 1)
)
WITH CHECK (
  email = (SELECT email FROM public.profiles WHERE profiles.user_id = auth.uid() LIMIT 1)
);

-- Allow workers to update their own linked record
CREATE POLICY "Workers can update own record"
ON public.workers
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
