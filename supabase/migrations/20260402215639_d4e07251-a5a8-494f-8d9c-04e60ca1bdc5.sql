
ALTER TABLE public.bookings 
ADD COLUMN booking_type text NOT NULL DEFAULT 'online',
ADD COLUMN customer_name text,
ADD COLUMN customer_phone text,
ADD COLUMN customer_address_text text,
ADD COLUMN customer_latitude numeric,
ADD COLUMN customer_longitude numeric;

-- Allow providers to insert manual bookings (they set user_id to their own id)
CREATE POLICY "Providers can create manual bookings"
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.providers
    WHERE providers.id = bookings.provider_id
    AND providers.user_id = auth.uid()
  )
);
