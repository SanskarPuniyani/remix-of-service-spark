
-- Allow providers to delete their own provider records (for role revocation)
CREATE POLICY "Users can delete own providers"
ON public.providers
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
