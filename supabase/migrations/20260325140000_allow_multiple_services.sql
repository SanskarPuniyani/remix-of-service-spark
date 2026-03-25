-- Remove unique constraint on user_id in providers table
ALTER TABLE public.providers DROP CONSTRAINT IF EXISTS providers_user_id_key;

-- If it's a simple UNIQUE index, we drop that instead
-- (depending on how the original table was created, it might be an index)
DROP INDEX IF EXISTS providers_user_id_key;
