
-- Security definer helpers to break recursion between workers <-> bookings policies
CREATE OR REPLACE FUNCTION public.is_booking_customer(_booking_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE id = _booking_id AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_worker_for_booking(_booking_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workers w
    JOIN public.bookings b ON b.worker_id = w.id
    WHERE b.id = _booking_id AND w.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.customer_can_reactivate_worker(_worker_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE worker_id = _worker_id AND user_id = _user_id
  )
$$;

-- Replace recursive policy on workers
DROP POLICY IF EXISTS "Customers can reactivate workers on job completion" ON public.workers;
CREATE POLICY "Customers can reactivate workers on job completion"
ON public.workers
FOR UPDATE
TO authenticated
USING (public.customer_can_reactivate_worker(id, auth.uid()))
WITH CHECK (public.customer_can_reactivate_worker(id, auth.uid()));

-- Replace recursive policies on bookings that reference workers
DROP POLICY IF EXISTS "Workers can view assigned bookings" ON public.bookings;
CREATE POLICY "Workers can view assigned bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.is_worker_for_booking(id, auth.uid()));

DROP POLICY IF EXISTS "Workers can update assigned bookings" ON public.bookings;
CREATE POLICY "Workers can update assigned bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.is_worker_for_booking(id, auth.uid()));
