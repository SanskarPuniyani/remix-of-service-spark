
-- Workers can view bookings assigned to them
CREATE POLICY "Workers can view assigned bookings"
ON public.bookings FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE workers.id = bookings.worker_id
    AND workers.user_id = auth.uid()
  )
);

-- Workers can update bookings assigned to them
CREATE POLICY "Workers can update assigned bookings"
ON public.bookings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.workers
    WHERE workers.id = bookings.worker_id
    AND workers.user_id = auth.uid()
  )
);
