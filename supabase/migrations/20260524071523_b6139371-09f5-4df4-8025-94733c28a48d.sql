
-- Remove tables from realtime publication (app uses Clerk auth; cannot scope
-- Supabase Realtime to clerk users without policies). Switching to polling.
ALTER PUBLICATION supabase_realtime DROP TABLE public.projects;
ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles;

-- All database access goes through server functions using the service_role
-- key (which bypasses RLS). Add explicit restrictive policies so anon and
-- authenticated roles (used by the browser client and Realtime) cannot read
-- or write directly. This makes the deny-by-default intent explicit.

-- profiles
CREATE POLICY "Deny direct client access to profiles"
  ON public.profiles
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- projects
CREATE POLICY "Deny direct client access to projects"
  ON public.projects
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- slides
CREATE POLICY "Deny direct client access to slides"
  ON public.slides
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- credit_transactions
CREATE POLICY "Deny direct client access to credit_transactions"
  ON public.credit_transactions
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);
