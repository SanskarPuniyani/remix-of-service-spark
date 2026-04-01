-- Allow customers to reactivate workers when marking bookings complete
CREATE POLICY "Customers can reactivate workers on job completion"
ON public.workers
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.worker_id = workers.id
    AND bookings.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings
    WHERE bookings.worker_id = workers.id
    AND bookings.user_id = auth.uid()
  )
);