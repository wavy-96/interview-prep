-- Story 2.2: Atomic session start with credit deduction
-- Prevents double-spend via row-level locking

CREATE OR REPLACE FUNCTION public.start_interview_session(
  p_user_id UUID,
  p_problem_id UUID,
  p_language TEXT DEFAULT 'python'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits INTEGER;
  v_has_subscription BOOLEAN;
  v_session_id UUID;
  v_problem JSONB;
BEGIN
  -- Only allow users to start sessions for themselves
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object('error', 'Unauthorized');
  END IF;

  -- Check active subscription (bypass credit check)
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id AND status = 'active'
  ) INTO v_has_subscription;

  IF NOT v_has_subscription THEN
    -- Lock profile row and get credits
    SELECT credits INTO v_credits
    FROM public.profiles
    WHERE id = p_user_id
    FOR UPDATE;

    IF v_credits IS NULL THEN
      RETURN jsonb_build_object('error', 'User not found');
    END IF;

    IF v_credits < 1 THEN
      RETURN jsonb_build_object('error', 'Insufficient credits', 'credits', v_credits);
    END IF;
  END IF;

  -- Create session (status=active, started_at=NOW())
  INSERT INTO public.sessions (user_id, problem_id, status, language, started_at, credits_consumed)
  VALUES (p_user_id, p_problem_id, 'active', p_language, NOW(), 1)
  RETURNING id INTO v_session_id;

  -- Deduct credit (unless subscriber)
  IF NOT v_has_subscription THEN
    INSERT INTO public.credit_transactions (user_id, amount, transaction_type, reference_id, balance_after)
    VALUES (p_user_id, -1, 'usage', v_session_id::TEXT, v_credits - 1);
  END IF;

  -- Fetch problem details
  SELECT jsonb_build_object(
    'id', p.id,
    'slug', p.slug,
    'title', p.title,
    'description', p.description,
    'difficulty', p.difficulty,
    'category', p.category,
    'starter_code', p.starter_code,
    'hints', p.hints
  ) INTO v_problem
  FROM public.problems p
  WHERE p.id = p_problem_id;

  RETURN jsonb_build_object(
    'sessionId', v_session_id,
    'problem', v_problem
  );
END;
$$;
