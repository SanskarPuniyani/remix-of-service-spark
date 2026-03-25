-- Create workers table
CREATE TABLE public.workers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add worker_id to bookings
ALTER TABLE public.bookings ADD COLUMN worker_id UUID REFERENCES public.workers(id) ON DELETE SET NULL;

-- Enable RLS for workers
ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own workers" ON public.workers FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.providers WHERE providers.id = workers.provider_id AND providers.user_id = auth.uid())
);

CREATE POLICY "Providers can manage their own workers" ON public.workers FOR ALL USING (
  EXISTS (SELECT 1 FROM public.providers WHERE providers.id = workers.provider_id AND providers.user_id = auth.uid())
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_workers_provider_id ON public.workers(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker_id ON public.bookings(worker_id);
