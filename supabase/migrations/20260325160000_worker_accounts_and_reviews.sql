-- Ensure email column exists in profiles
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE public.profiles ADD COLUMN email TEXT;
  END IF;
END $$;

-- Update profiles role check constraint
-- We use a more generic way to handle the inline check constraint if it exists
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass AND contype = 'c' AND consrc LIKE '%role%';
    
    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('customer', 'provider', 'worker'));

-- Update workers table to link to a user profile
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS user_id UUID UNIQUE REFERENCES public.profiles(user_id) ON DELETE SET NULL;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1) NOT NULL DEFAULT 5.0;
ALTER TABLE public.workers ADD COLUMN IF NOT EXISTS completed_jobs INTEGER NOT NULL DEFAULT 0;

-- Update reviews table to include worker-specific data
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS worker_rating INTEGER CHECK (worker_rating >= 1 AND worker_rating <= 5);
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS worker_comment TEXT;

-- Update the handle_new_user function to be robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_workers_user_id ON public.workers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_email ON public.workers(email);
CREATE INDEX IF NOT EXISTS idx_reviews_worker_id ON public.reviews(worker_id);
