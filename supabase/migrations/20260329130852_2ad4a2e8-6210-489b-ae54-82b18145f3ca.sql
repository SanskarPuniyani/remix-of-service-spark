
-- Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS house_no text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude numeric;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS service_category text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS experience text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hourly_rate integer;

-- Update handle_new_user function to include new columns
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, role, email, phone, house_no, area, city)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'house_no', ''),
    COALESCE(NEW.raw_user_meta_data->>'area', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', '')
  );
  RETURN NEW;
END;
$function$;

-- Add worker_id to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS worker_id uuid;

-- Add worker fields to reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS worker_id uuid;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS worker_rating integer;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS worker_comment text;

-- Create addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  label text DEFAULT 'Home',
  full_address text NOT NULL,
  house_no text,
  area text,
  city text,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own addresses" ON public.addresses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own addresses" ON public.addresses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own addresses" ON public.addresses FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own addresses" ON public.addresses FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Create workers table
CREATE TABLE IF NOT EXISTS public.workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  is_active boolean DEFAULT true,
  status text DEFAULT 'pending',
  rating numeric DEFAULT 5.0,
  completed_jobs integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.workers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers viewable by everyone" ON public.workers FOR SELECT USING (true);
CREATE POLICY "Providers can insert workers" ON public.workers FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Providers can update their workers" ON public.workers FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);
CREATE POLICY "Providers can delete their workers" ON public.workers FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.providers WHERE id = provider_id AND user_id = auth.uid())
);

-- Trigger to ensure only one default address per user
CREATE OR REPLACE FUNCTION public.ensure_single_default_address()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE public.addresses SET is_default = false WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER set_single_default_address
  BEFORE INSERT OR UPDATE ON public.addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_default_address();
