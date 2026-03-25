-- Add unique constraint on email in workers table to ensure they only register for one service
ALTER TABLE public.workers DROP CONSTRAINT IF EXISTS workers_email_key;
ALTER TABLE public.workers ADD CONSTRAINT workers_email_key UNIQUE (email);
