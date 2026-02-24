-- Drop duplicate overload of get_activity_stats that causes PostgREST ambiguity error
-- The version with (p_user_id uuid, p_days_back integer) is unused
-- Only the version with (days_ago integer) is called from the app
DROP FUNCTION IF EXISTS public.get_activity_stats(uuid, integer);
