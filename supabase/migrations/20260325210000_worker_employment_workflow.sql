-- Add employment status to workers table
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted'));

-- 2. Update Row Level Security for workers to allow workers to manage their own status
DROP POLICY IF EXISTS "Workers can update their own employment status" ON public.workers;
CREATE POLICY "Workers can update their own employment status" ON public.workers
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy for workers to view their own records (even if unlinked initially by provider)
DROP POLICY IF EXISTS "Workers can view their own record" ON public.workers;
CREATE POLICY "Workers can view their own record" ON public.workers
  FOR SELECT USING (auth.uid() = user_id OR email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()));
