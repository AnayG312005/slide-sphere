
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slides ENABLE ROW LEVEL SECURITY;

REVOKE EXECUTE ON FUNCTION public.consume_credits(TEXT, INTEGER, TEXT, UUID) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.ensure_profile(TEXT, TEXT, TEXT) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.add_credits(TEXT, INTEGER, TEXT, JSONB) FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, public;
