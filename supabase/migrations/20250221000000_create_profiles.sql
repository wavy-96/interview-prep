-- Story 1.3: User Profiles & Database Schema
-- Run via Supabase Dashboard SQL Editor or: supabase db push

-- Profiles table (references auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'staff')),
  target_companies TEXT[],
  credits INTEGER NOT NULL DEFAULT 3,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for auth.uid() lookups (id is PK, but explicit index helps with RLS)
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Auto-create profile when new auth.users row is inserted
-- SECURITY DEFINER: runs with definer privileges to bypass RLS during insert
-- ON CONFLICT DO NOTHING: prevents race condition on rapid OAuth sign-in
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, credits, subscription_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    3,
    'free'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: users can only read/update their own profile
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Prevent users from updating credits, subscription_tier, email via direct DB access
-- Only service_role can change these; users may update full_name, experience_level, target_companies
CREATE OR REPLACE FUNCTION public.check_profile_update_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.jwt()->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;
  IF (OLD.credits IS DISTINCT FROM NEW.credits)
     OR (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier)
     OR (OLD.email IS DISTINCT FROM NEW.email)
     OR (OLD.id IS DISTINCT FROM NEW.id)
     OR (OLD.created_at IS DISTINCT FROM NEW.created_at) THEN
    RAISE EXCEPTION 'Cannot update protected profile columns';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_profile_update_columns_trigger ON public.profiles;
CREATE TRIGGER check_profile_update_columns_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_update_columns();
