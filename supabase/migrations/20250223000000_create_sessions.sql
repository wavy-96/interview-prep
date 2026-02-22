-- Story 2.1: Session & Related Tables
-- Creates sessions, transcripts, code_snapshots, evaluations, credit_transactions, payments, subscriptions

-- Interview Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES public.problems(id),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'abandoned', 'errored')),
  difficulty_override TEXT CHECK (difficulty_override IN ('easy', 'medium', 'hard')),
  language TEXT NOT NULL DEFAULT 'python' CHECK (language IN ('python', 'javascript', 'java')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  hints_used INTEGER NOT NULL DEFAULT 0,
  test_cases_passed INTEGER NOT NULL DEFAULT 0,
  test_cases_total INTEGER NOT NULL DEFAULT 0,
  credits_consumed INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON public.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON public.sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON public.sessions(user_id, status);

-- Conversation Transcripts
CREATE TABLE IF NOT EXISTS public.transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL CHECK (speaker IN ('interviewer', 'candidate', 'system')),
  content TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transcripts_session ON public.transcripts(session_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_timestamp ON public.transcripts(session_id, timestamp_ms);

-- Code Snapshots
CREATE TABLE IF NOT EXISTS public.code_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  snapshot_type TEXT NOT NULL DEFAULT 'auto' CHECK (snapshot_type IN ('auto', 'manual', 'execution', 'final')),
  observer_analysis JSONB,
  execution_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_code_snapshots_session ON public.code_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_code_snapshots_timestamp ON public.code_snapshots(session_id, timestamp_ms);

-- Evaluations
CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE UNIQUE,
  overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  problem_solving_score DECIMAL(5,2),
  problem_solving_feedback TEXT,
  code_quality_score DECIMAL(5,2),
  code_quality_feedback TEXT,
  communication_score DECIMAL(5,2),
  communication_feedback TEXT,
  efficiency_score DECIMAL(5,2),
  efficiency_feedback TEXT,
  strengths TEXT[],
  improvements TEXT[],
  hiring_recommendation TEXT CHECK (hiring_recommendation IN ('strong-yes', 'yes', 'maybe', 'no')),
  detailed_report TEXT,
  evaluator_model TEXT DEFAULT 'claude-sonnet-4.6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evaluations_session ON public.evaluations(session_id);

-- Credit Transactions
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')),
  reference_id TEXT,
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON public.credit_transactions(created_at);

-- Payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  credits_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON public.payments(stripe_payment_intent_id);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'paused')),
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);

-- Sessions updated_at trigger (reuse existing function)
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Credit update trigger: sync profiles.credits when credit_transaction is inserted
CREATE OR REPLACE FUNCTION public.update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET credits = NEW.balance_after
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS after_credit_transaction ON public.credit_transactions;
CREATE TRIGGER after_credit_transaction
  AFTER INSERT ON public.credit_transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_user_credits();

-- RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Sessions: users can CRUD own sessions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
CREATE POLICY "Users can view own sessions" ON public.sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
CREATE POLICY "Users can insert own sessions" ON public.sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
CREATE POLICY "Users can update own sessions" ON public.sessions
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access sessions" ON public.sessions;
CREATE POLICY "Service role full access sessions" ON public.sessions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Transcripts: users can view via session ownership; service role inserts
DROP POLICY IF EXISTS "Users can view own session transcripts" ON public.transcripts;
CREATE POLICY "Users can view own session transcripts" ON public.transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = transcripts.session_id AND sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access transcripts" ON public.transcripts;
CREATE POLICY "Service role full access transcripts" ON public.transcripts
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Code Snapshots: users can view and insert for own sessions
DROP POLICY IF EXISTS "Users can view own session code" ON public.code_snapshots;
CREATE POLICY "Users can view own session code" ON public.code_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = code_snapshots.session_id AND sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own session code" ON public.code_snapshots;
CREATE POLICY "Users can insert own session code" ON public.code_snapshots
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = code_snapshots.session_id AND sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access code_snapshots" ON public.code_snapshots;
CREATE POLICY "Service role full access code_snapshots" ON public.code_snapshots
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Evaluations: users can view via session ownership
DROP POLICY IF EXISTS "Users can view own evaluations" ON public.evaluations;
CREATE POLICY "Users can view own evaluations" ON public.evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = evaluations.session_id AND sessions.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role full access evaluations" ON public.evaluations;
CREATE POLICY "Service role full access evaluations" ON public.evaluations
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Credit Transactions: users can view own; service role inserts
DROP POLICY IF EXISTS "Users can view own credit transactions" ON public.credit_transactions;
CREATE POLICY "Users can view own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access credit_transactions" ON public.credit_transactions;
CREATE POLICY "Service role full access credit_transactions" ON public.credit_transactions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Payments: users can view own
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access payments" ON public.payments;
CREATE POLICY "Service role full access payments" ON public.payments
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Subscriptions: users can view own
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access subscriptions" ON public.subscriptions;
CREATE POLICY "Service role full access subscriptions" ON public.subscriptions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
