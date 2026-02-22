-- Story 4.5: Onboarding & Microphone Test
-- Add onboarding_completed to profiles for first-time user flow

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.onboarding_completed IS 'True when user has completed or skipped the onboarding flow';
