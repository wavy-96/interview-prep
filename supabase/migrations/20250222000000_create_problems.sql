-- Story 1.4a: Problems Schema, API & RLS

-- Problems Library
CREATE TABLE IF NOT EXISTS public.problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  category TEXT[],
  companies TEXT[],
  hints TEXT[],
  starter_code JSONB,
  has_solution BOOLEAN DEFAULT TRUE,
  time_complexity TEXT,
  space_complexity TEXT,
  acceptance_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON public.problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_category ON public.problems USING GIN(category);
CREATE INDEX IF NOT EXISTS idx_problems_slug ON public.problems(slug);

-- Test Cases
CREATE TABLE IF NOT EXISTS public.test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  is_example BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT TRUE,
  explanation TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_test_cases_problem ON public.test_cases(problem_id);

-- Private solutions (never exposed to candidate-facing APIs)
CREATE TABLE IF NOT EXISTS public.problem_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES public.problems(id) ON DELETE CASCADE UNIQUE,
  solution_code JSONB NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_problem_solutions_problem ON public.problem_solutions(problem_id);

-- RLS
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.problem_solutions ENABLE ROW LEVEL SECURITY;

-- Problems: public read
DROP POLICY IF EXISTS "Public can view problems" ON public.problems;
CREATE POLICY "Public can view problems" ON public.problems
  FOR SELECT USING (TRUE);

-- Test cases: only example + non-hidden visible to users; service_role sees all
DROP POLICY IF EXISTS "Public can view example test cases only" ON public.test_cases;
CREATE POLICY "Public can view example test cases only" ON public.test_cases
  FOR SELECT USING (is_example = TRUE AND is_hidden = FALSE);

DROP POLICY IF EXISTS "Service role can manage test cases" ON public.test_cases;
CREATE POLICY "Service role can manage test cases" ON public.test_cases
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Problem solutions: service_role only (no user-facing policy = blocked for anon/auth)
DROP POLICY IF EXISTS "Service role can access problem solutions" ON public.problem_solutions;
CREATE POLICY "Service role can access problem solutions" ON public.problem_solutions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
