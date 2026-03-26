-- Add latitude and longitude to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Update handle_new_user to include lat/long if available in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, phone, role, service_category, house_no, area, city, latitude, longitude)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'service_category', NULL),
    COALESCE(NEW.raw_user_meta_data->>'house_no', ''),
    COALESCE(NEW.raw_user_meta_data->>'area', ''),
    COALESCE(NEW.raw_user_meta_data->>'city', ''),
    (NEW.raw_user_meta_data->>'latitude')::NUMERIC,
    (NEW.raw_user_meta_data->>'longitude')::NUMERIC
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
