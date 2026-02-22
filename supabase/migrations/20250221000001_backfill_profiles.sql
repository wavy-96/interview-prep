-- Backfill profiles for existing auth.users (run once after initial migration)
-- Safe to run multiple times: ON CONFLICT DO NOTHING
INSERT INTO public.profiles (id, email, full_name, credits, subscription_tier)
SELECT
  id,
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name'),
  3,
  'free'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
