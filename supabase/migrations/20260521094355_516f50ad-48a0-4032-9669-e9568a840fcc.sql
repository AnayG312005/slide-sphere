
-- Profiles keyed by Clerk user id
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT,
  display_name TEXT,
  credits INTEGER NOT NULL DEFAULT 50,
  total_earned INTEGER NOT NULL DEFAULT 50,
  total_spent INTEGER NOT NULL DEFAULT 0,
  plan TEXT NOT NULL DEFAULT 'basic',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.credit_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clerk_user_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  project_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_tx_user ON public.credit_transactions(clerk_user_id, created_at DESC);

-- Extend projects + slides
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS style TEXT NOT NULL DEFAULT 'modern-corporate',
  ADD COLUMN IF NOT EXISTS density TEXT NOT NULL DEFAULT 'concise',
  ADD COLUMN IF NOT EXISTS slide_count INTEGER;

ALTER TABLE public.slides
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_source TEXT;

-- Updated_at trigger on profiles
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Atomic credit consumption
CREATE OR REPLACE FUNCTION public.consume_credits(_clerk_user_id TEXT, _amount INTEGER, _reason TEXT, _project_id UUID DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  UPDATE public.profiles
    SET credits = credits - _amount,
        total_spent = total_spent + _amount
    WHERE clerk_user_id = _clerk_user_id AND credits >= _amount
    RETURNING credits INTO remaining;

  IF remaining IS NULL THEN
    RAISE EXCEPTION 'INSUFFICIENT_CREDITS';
  END IF;

  INSERT INTO public.credit_transactions(clerk_user_id, delta, reason, project_id)
    VALUES (_clerk_user_id, -_amount, _reason, _project_id);

  RETURN remaining;
END;
$$;

-- Idempotent profile + signup bonus
CREATE OR REPLACE FUNCTION public.ensure_profile(_clerk_user_id TEXT, _email TEXT, _name TEXT)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE clerk_user_id = _clerk_user_id;
  IF NOT FOUND THEN
    INSERT INTO public.profiles(clerk_user_id, email, display_name)
      VALUES (_clerk_user_id, _email, _name)
      RETURNING * INTO p;
    INSERT INTO public.credit_transactions(clerk_user_id, delta, reason)
      VALUES (_clerk_user_id, 50, 'signup_bonus');
  END IF;
  RETURN p;
END;
$$;

-- Add credits (for purchase)
CREATE OR REPLACE FUNCTION public.add_credits(_clerk_user_id TEXT, _amount INTEGER, _reason TEXT, _metadata JSONB DEFAULT NULL)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining INTEGER;
BEGIN
  UPDATE public.profiles
    SET credits = credits + _amount,
        total_earned = total_earned + _amount,
        plan = CASE WHEN _reason = 'premium_purchase' THEN 'premium' ELSE plan END
    WHERE clerk_user_id = _clerk_user_id
    RETURNING credits INTO remaining;

  INSERT INTO public.credit_transactions(clerk_user_id, delta, reason, metadata)
    VALUES (_clerk_user_id, _amount, _reason, _metadata);

  RETURN remaining;
END;
$$;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
