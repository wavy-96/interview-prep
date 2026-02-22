# Technical Architecture - Part 1
## AI Interview Prep Platform

---

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                            BROWSER CLIENT                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Monaco Editor│  │  WebSocket   │  │  HTTP Client │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          │ Code Edits       │ Voice/Events     │ API Calls
          │                  │                  │
          └──────────────────┼──────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                     │
┌─────────▼─────────┐              ┌────────────▼──────────┐
│   VERCEL (Next.js)│              │  FLY.IO/RAILWAY       │
│  ┌──────────────┐ │              │  Real-time Server     │
│  │ API Routes   │ │              │ ┌──────────────────┐  │
│  │ (300s limit) │◄├──────REST────┤ │ WebSocket Server │  │
│  └──────┬───────┘ │              │ │ (persistent WS)  │  │
│         │         │              │ └────────┬─────────┘  │
│  ┌──────▼───────┐ │              │          │            │
│  │ Edge/Server  │ │              │ ┌────────▼─────────┐  │
│  │ Components   │ │              │ │ Session Manager  │  │
│  └──────────────┘ │              │ │ (Redis/Memory)   │  │
└─────────┬─────────┘              │ └──────────────────┘  │
          │                        └────────┬───────────────┘
          │                                 │
          │                        ┌────────▼───────────┐
          │                        │  OpenAI Realtime   │
          │                        │  API (WebSocket)   │
          │                        └────────────────────┘
          │
          │
┌─────────▼──────────────────────────────────────────────┐
│                  BACKEND SERVICES                       │
│                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Supabase   │  │  Anthropic   │  │    Modal     │  │
│  │             │  │    Claude    │  │  (Sandbox)   │  │
│  │ ┌─────────┐ │  │              │  │              │  │
│  │ │ Postgres│ │  │ Haiku/Sonnet │  │ Python/Node  │  │
│  │ └─────────┘ │  │              │  │  Runtime     │  │
│  │ ┌─────────┐ │  └──────────────┘  └──────────────┘  │
│  │ │  Auth   │ │                                       │
│  │ └─────────┘ │  ┌──────────────┐                    │
│  │ ┌─────────┐ │  │    Stripe    │                    │
│  │ │ Storage │ │  │   Payments   │                    │
│  │ └─────────┘ │  └──────────────┘                    │
│  └─────────────┘                                       │
└────────────────────────────────────────────────────────┘

DATA FLOWS:
═══════════
1. User Auth:     Browser → Vercel → Supabase Auth
2. Voice Stream:  Browser ↔ Fly.io ↔ OpenAI Realtime / Gemini Live API
3. Code Edits:    Browser → Fly.io WS → Anthropic observer → Supabase (snapshots)
4. Code Execute:  Browser → Vercel → Modal → Vercel → Browser
5. Evaluation:    Fly.io → Anthropic → Supabase
6. Payments:      Browser → Vercel → Stripe → Supabase
7. State Sync:    Fly.io ↔ Vercel (REST/webhooks)
```

---

## 2. WebSocket Solution: Persistent Real-time Server

### Problem
- Vercel function timeout: 300s max
- Interview sessions: 60 minutes
- OpenAI Realtime API requires persistent WebSocket connection

### Solution: Separate Real-time Server on Fly.io

**Architecture:**
```
Browser WebSocket
    ↕
Fly.io Real-time Server (Node.js/Bun)
    ↕
OpenAI Realtime API WebSocket
```

**Fly.io Server Responsibilities:**
1. **WebSocket Management**: Maintain persistent client connections (60+ min)
2. **OpenAI Proxy**: Bidirectional streaming to OpenAI Realtime API
3. **Session State**: Track active sessions in Redis/in-memory
4. **Agent Coordination**: Trigger Code Observer and Evaluator via events
5. **Heartbeat/Reconnection**: Handle connection drops gracefully
6. **Authentication**: Validate JWT tokens from Supabase

**Implementation Details:**

```typescript
// Fly.io Server: app.ts
import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import Redis from 'ioredis';

const wss = new WebSocketServer({ port: 8080 });
const redis = new Redis(process.env.REDIS_URL);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

wss.on('connection', async (clientWs, req) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const { userId, sessionId, exp, jti } = verifyRealtimeToken(token);
  if (!userId || !sessionId || Date.now() / 1000 > exp) {
    return clientWs.close(4001, 'Unauthorized');
  }
  await assertSessionOwnership(userId, sessionId);
  await ensureTokenNotReused(jti);
  
  // Connect to OpenAI Realtime API
  const openaiWs = new WebSocket('wss://api.openai.com/v1/realtime', {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'realtime=v1'
    }
  });

  // Enforce strict allowlist: never forward arbitrary client events to provider
  const allowedClientEvents = new Set([
    'code_edit',
    'input_audio_buffer.append',
    'input_audio_buffer.commit',
    'response.cancel',
    'session.ping'
  ]);

  clientWs.on('message', (data) => {
    if (Buffer.byteLength(data as Buffer) > 64 * 1024) {
      return clientWs.close(1009, 'Payload too large');
    }
    const msg = JSON.parse(data);
    if (!validateRealtimeMessage(msg)) {
      return clientWs.send(JSON.stringify({ type: 'error', code: 'invalid_payload' }));
    }
    if (!allowedClientEvents.has(msg.type)) {
      return clientWs.send(JSON.stringify({ type: 'error', code: 'invalid_event_type' }));
    }
    
    // Intercept code edits for Code Observer
    if (msg.type === 'code_edit') {
      triggerCodeObserver(sessionId, msg.code);
      return;
    }
    
    openaiWs.send(JSON.stringify(msg));
  });

  // Proxy messages: OpenAI → Client
  openaiWs.on('message', (data) => {
    const msg = JSON.parse(data);
    
    // Store transcript chunks
    if (msg.type === 'conversation.item.created') {
      storeTranscript(sessionId, msg);
    }
    
    clientWs.send(data);
  });

  // Store session metadata
  await redis.set(`session:${sessionId}`, JSON.stringify({
    userId,
    startTime: Date.now(),
    status: 'active'
  }), 'EX', 7200);
});

async function triggerCodeObserver(sessionId: string, code: string) {
  const body = JSON.stringify({ sessionId, code });
  const idempotencyKey = crypto.randomUUID();
  const signature = signInternalPayload(body, process.env.INTERNAL_WEBHOOK_SECRET!);

  // Call Vercel API route to analyze with Anthropic
  await fetch(`${process.env.VERCEL_URL}/api/internal/agents/observe-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Signature': signature,
      'Idempotency-Key': idempotencyKey
    },
    body
  });
}
```

**Coordination with Vercel:**
- **REST API**: Fly.io → Vercel internal endpoints with HMAC signatures + idempotency keys
- **Webhooks**: Vercel ↔ Fly.io signed payloads only; reject unsigned requests
- **Network boundary**: private network + mTLS between Fly.io and internal API gateway
- **Shared State**: Both read/write to Supabase for session data
- **Redis Streams**: Durable event queue + replay for missed events

**Deployment:**
```bash
# fly.toml
app = "interview-realtime"
primary_region = "iad"

[env]
  PORT = "8080"

[[services]]
  internal_port = 8080
  protocol = "tcp"
  
  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
```

**Scaling:**
- Fly.io auto-scales based on WS connection count
- Redis for session state sharing across instances
- Connection draining during deployments

---

## 3. Multi-Agent Architecture

### Agent Design

```
┌─────────────────────────────────────────────────────────┐
│                    INTERVIEW SESSION                     │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  INTERVIEWER   │ │   CODE      │ │   EVALUATOR    │
│    AGENT       │ │  OBSERVER   │ │     AGENT      │
│                │ │    AGENT    │ │                │
│ OpenAI Realtime│ │             │ │ Anthropic      │
│   GPT-4o       │ │ Anthropic   │ │ Claude Sonnet  │
│                │ │   Haiku     │ │                │
│ - Voice I/O    │ │             │ │ - Final eval   │
│ - Questions    │ │ - Real-time │ │ - Scoring      │
│ - Hints        │ │   analysis  │ │ - Report       │
│ - Follow-ups   │ │ - Syntax    │ │ - Feedback     │
│                │ │   check     │ │                │
└───────┬────────┘ └──────┬──────┘ └───────┬────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                ┌─────────▼──────────┐
                │   SHARED STATE     │
                │                    │
                │ Redis (ephemeral): │
                │ - Current code     │
                │ - Agent context    │
                │ - Event queue      │
                │                    │
                │ Supabase (persist):│
                │ - Transcripts      │
                │ - Code snapshots   │
                │ - Evaluations      │
                └────────────────────┘
```

### Agent 1: Interviewer Agent

**Purpose**: Conduct voice-based technical interviews

**Technology**: OpenAI Realtime API (GPT-4o with audio)

**Responsibilities**:
- Ask technical questions based on problem difficulty
- Listen to candidate's voice responses
- Provide hints when stuck (configurable)
- Ask clarifying follow-up questions
- Adapt difficulty based on performance
- Natural conversation flow

**Context**:
```json
{
  "problem": {
    "id": "uuid",
    "title": "Two Sum",
    "description": "...",
    "difficulty": "easy",
    "hints": ["Try using a hash map", "..."]
  },
  "candidateProfile": {
    "experienceLevel": "mid",
    "previousAttempts": 3
  },
  "sessionState": {
    "timeElapsed": 1200,
    "hintsUsed": 1,
    "currentCode": "..."
  }
}
```

**System Prompt**:
```
You are an expert technical interviewer conducting a coding interview.
Problem: {problem.title}
Candidate Level: {candidateProfile.experienceLevel}

Guidelines:
1. Start with problem explanation and clarifications
2. Encourage thinking aloud
3. Provide hints only if stuck for >3 minutes
4. Ask about time/space complexity
5. Be encouraging but professional
6. Session length: 45-60 minutes
```

### Agent 2: Code Observer Agent

**Purpose**: Real-time code analysis and syntax validation

**Technology**: Anthropic Claude Haiku (fast, cheap)

**Trigger**: On every code edit (debounced to 2s)

**Responsibilities**:
- Syntax error detection
- Basic logical errors
- Code structure analysis
- Test case prediction
- Silent observation (no interruption unless critical bug)

**Input**:
```typescript
{
  sessionId: string;
  code: string;
  language: 'python' | 'javascript' | 'java';
  timestamp: number;
}
```

**Output**:
```typescript
{
  syntaxErrors: Array<{line: number, message: string}>;
  warnings: string[];
  approach: 'brute-force' | 'optimized' | 'unknown';
  estimatedComplexity: 'O(n)' | 'O(n^2)' | '...';
  suggestRun: boolean; // true if code looks complete
}
```

**Prompt Strategy**:
```
Analyze this code snapshot from an ongoing interview:

Language: {language}
Code:
```
{code}
```

Provide:
1. Syntax errors (line numbers)
2. Logical issues (if obvious)
3. Algorithmic approach identified
4. Estimated time complexity
5. Is code ready for test execution?

Respond in JSON format. Be concise.
```

### Agent 3: Evaluator Agent

**Purpose**: Comprehensive post-interview evaluation

**Technology**: Anthropic Claude Sonnet 3.5 (high-quality reasoning)

**Trigger**: Session end or manual evaluation request

**Responsibilities**:
- Holistic performance assessment
- Code quality scoring
- Communication evaluation
- Problem-solving approach analysis
- Detailed feedback report
- Hiring recommendation

**Input**:
```typescript
{
  sessionId: string;
  problem: Problem;
  fullTranscript: ConversationItem[];
  codeSnapshots: CodeSnapshot[];
  testResults: TestResult[];
  timeSpent: number;
  hintsUsed: number;
}
```

**Output**:
```typescript
{
  overallScore: number; // 0-100
  dimensions: {
    problemSolving: { score: number, feedback: string },
    codeQuality: { score: number, feedback: string },
    communication: { score: number, feedback: string },
    efficiency: { score: number, feedback: string }
  },
  strengths: string[];
  improvements: string[];
  hiringRecommendation: 'strong-yes' | 'yes' | 'maybe' | 'no';
  detailedReport: string; // Markdown
}
```

**Evaluation Criteria**:
1. **Problem Solving** (30%): Approach, adaptability, hint usage
2. **Code Quality** (25%): Correctness, style, edge cases
3. **Communication** (25%): Clarity, thinking aloud, questions
4. **Efficiency** (20%): Time/space complexity, optimization

### Event-Driven Coordination

**Event Bus** (Redis Streams + consumer groups):

```typescript
// Events published by Fly.io server
enum EventType {
  SESSION_STARTED = 'session.started',
  CODE_EDITED = 'code.edited',
  CODE_EXECUTED = 'code.executed',
  HINT_REQUESTED = 'hint.requested',
  SESSION_ENDED = 'session.ended'
}

// Subscribers
const subscribers = {
  'code.edited': [CodeObserverAgent],
  'code.executed': [CodeObserverAgent, InterviewerAgent],
  'session.ended': [EvaluatorAgent]
};

// Example flow (durable + replayable)
await redis.xadd('events', '*',
  'type', 'code.edited',
  'sessionId', 'abc-123',
  'payload', JSON.stringify({ code: '...', language: 'python' })
);

// Consumer group processing with ack/retry
await redis.xreadgroup(
  'GROUP', 'observer-workers', 'worker-1',
  'BLOCK', 5000,
  'COUNT', 10,
  'STREAMS', 'events', '>'
);
await redis.xack('events', 'observer-workers', messageId);
```

**Dead-letter strategy**:
- Max retry attempts: 5
- Failed events moved to `events.dlq`
- Alert when DLQ depth > 10

```typescript
// Legacy pub/sub example removed intentionally (not durable)
/*
redis.publish('events', JSON.stringify({
  type: 'code.edited',
  sessionId: 'abc-123',
  payload: { code: '...', language: 'python' }
}));
*/
```

**State Management**:

**Redis** (ephemeral, <24h TTL):
```typescript
// Current session context
redis.set(`session:${sessionId}:code`, code);
redis.set(`session:${sessionId}:agents`, JSON.stringify({
  interviewer: { lastQuestion: '...', hintsGiven: 1 },
  observer: { lastAnalysis: {...}, timestamp: 1234567890 }
}));
```

**Supabase** (persistent):
- Full transcripts → `transcripts` table
- Code snapshots → `code_snapshots` table (every 30s)
- Final evaluation → `evaluations` table

---

## 4. Database Schema (Supabase Postgres)

### Tables

```sql
-- Users & Authentication (Supabase Auth handles users table)

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'staff')),
  target_companies TEXT[], -- ['FAANG', 'Startup', 'Enterprise']
  credits INTEGER DEFAULT 3,
  subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems Library
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
  category TEXT[], -- ['Array', 'Dynamic Programming', 'Graph']
  companies TEXT[], -- ['Google', 'Meta', 'Amazon']
  hints TEXT[], -- Array of progressive hints
  starter_code JSONB, -- { python: "...", javascript: "...", java: "..." }
  has_solution BOOLEAN DEFAULT TRUE,
  time_complexity TEXT,
  space_complexity TEXT,
  acceptance_rate DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_category ON problems USING GIN(category);

-- Test Cases
CREATE TABLE test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
  input JSONB NOT NULL,
  expected_output JSONB NOT NULL,
  is_example BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT TRUE,
  explanation TEXT,
  order_index INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_cases_problem ON test_cases(problem_id);

-- Private solutions (never exposed to candidate-facing APIs)
CREATE TABLE problem_solutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id UUID REFERENCES problems(id) ON DELETE CASCADE UNIQUE,
  solution_code JSONB NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_problem_solutions_problem ON problem_solutions(problem_id);

-- Interview Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  problem_id UUID REFERENCES problems(id),
  status TEXT CHECK (status IN ('scheduled', 'active', 'completed', 'abandoned')) DEFAULT 'scheduled',
  difficulty_override TEXT CHECK (difficulty_override IN ('easy', 'medium', 'hard')),
  language TEXT CHECK (language IN ('python', 'javascript', 'java')) DEFAULT 'python',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  hints_used INTEGER DEFAULT 0,
  test_cases_passed INTEGER DEFAULT 0,
  test_cases_total INTEGER DEFAULT 0,
  credits_consumed INTEGER DEFAULT 1,
  metadata JSONB, -- { userAgent, ipAddress, etc }
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);

-- Conversation Transcripts
CREATE TABLE transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  speaker TEXT CHECK (speaker IN ('interviewer', 'candidate', 'system')) NOT NULL,
  content TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL, -- Milliseconds from session start
  metadata JSONB, -- { confidence, emotions, etc }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transcripts_session ON transcripts(session_id);
CREATE INDEX idx_transcripts_timestamp ON transcripts(session_id, timestamp_ms);

-- Code Snapshots
CREATE TABLE code_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  timestamp_ms INTEGER NOT NULL,
  snapshot_type TEXT CHECK (snapshot_type IN ('auto', 'manual', 'execution', 'final')) DEFAULT 'auto',
  observer_analysis JSONB, -- Output from Code Observer Agent
  execution_result JSONB, -- { passed, failed, errors }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_code_snapshots_session ON code_snapshots(session_id);
CREATE INDEX idx_code_snapshots_timestamp ON code_snapshots(session_id, timestamp_ms);

-- Evaluations
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE UNIQUE,
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
  detailed_report TEXT, -- Markdown format
  evaluator_model TEXT DEFAULT 'claude-sonnet-4.6',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_session ON evaluations(session_id);

-- Credits & Payments
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- Negative for usage, positive for purchase
  transaction_type TEXT CHECK (transaction_type IN ('purchase', 'usage', 'refund', 'bonus')) NOT NULL,
  reference_id TEXT, -- session_id or stripe_payment_id
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  credits_purchased INTEGER NOT NULL,
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_user ON payments(user_id);
CREATE INDEX idx_payments_stripe_intent ON payments(stripe_payment_intent_id);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  tier TEXT CHECK (tier IN ('pro', 'enterprise')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'canceled', 'past_due', 'paused')) DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

### Row-Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE code_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_solutions ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Transcripts: Access via session ownership
CREATE POLICY "Users can view own session transcripts" ON transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = transcripts.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Code Snapshots: Access via session ownership
CREATE POLICY "Users can view own session code" ON code_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = code_snapshots.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Evaluations: Access via session ownership
CREATE POLICY "Users can view own evaluations" ON evaluations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions 
      WHERE sessions.id = evaluations.session_id 
      AND sessions.user_id = auth.uid()
    )
  );

-- Credit Transactions: Users see only their own
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Payments: Users see only their own
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- Subscriptions: Users see only their own
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Problems & Test Cases: Public read access
CREATE POLICY "Public can view problems" ON problems
  FOR SELECT USING (TRUE);

CREATE POLICY "Public can view example test cases only" ON test_cases
  FOR SELECT USING (is_example = TRUE AND is_hidden = FALSE);

CREATE POLICY "Service role can manage hidden test cases" ON test_cases
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role can access problem solutions" ON problem_solutions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Service role bypass (for backend operations)
CREATE POLICY "Service role has full access" ON sessions
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access to transcripts" ON transcripts
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Repeat for other tables as needed
```

### Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update user credits after transaction
CREATE OR REPLACE FUNCTION update_user_credits()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET credits = NEW.balance_after
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_credit_transaction AFTER INSERT ON credit_transactions
  FOR EACH ROW EXECUTE FUNCTION update_user_credits();
```

---

## 5. API Routes (Next.js)

### Authentication & Users

**POST /api/auth/signup**
- Create new user account via Supabase Auth
- Initialize profile with free credits

**POST /api/auth/signin**
- Authenticate user, return JWT

**GET /api/auth/session**
- Validate current session, return user data

**GET /api/users/profile**
- Get current user's profile

**PATCH /api/users/profile**
- Update profile (name, experience level, preferences)

**GET /api/users/credits**
- Get current credit balance and transaction history

**POST /api/users/data-export**
- Export user data package (profile, sessions, transcripts, evaluations)

**DELETE /api/users/data**
- Hard-delete user account + all associated data (GDPR/CCPA workflow)

### Problems

**GET /api/problems**
- List all problems with filters (difficulty, category, company)
- Query params: `difficulty`, `category`, `page`, `limit`

**GET /api/problems/[slug]**
- Get single problem details with starter code
- Excludes hidden test cases and solution

**(Removed) GET /api/problems/[slug]/solutions**
- Not exposed in candidate-facing API to prevent answer leakage
- Solutions available only via internal service-role path for evaluator/admin tooling

**GET /api/problems/random**
- Get random problem based on user preferences
- Query params: `difficulty`, `category`

### Interview Sessions

**POST /api/sessions/start**
- Create new interview session
- Deduct credits, initialize session in DB
- Body: `{ problemId, language, difficulty? }`

**GET /api/sessions/[sessionId]**
- Get session details and current state

**PATCH /api/sessions/[sessionId]**
- Update session (mark as completed, update metadata)

**POST /api/sessions/[sessionId]/code**
- Save code snapshot
- Body: `{ code, language, timestamp }`

**POST /api/sessions/[sessionId]/execute**
- Execute code in Modal sandbox (canonical route)
- Run test cases, return results
- Body: `{ code, language, timeout? }`

**POST /api/sessions/[sessionId]/hint**
- Request hint from Interviewer Agent
- Increments hint counter, affects scoring

**POST /api/sessions/[sessionId]/end**
- End session, trigger Evaluator Agent
- Calculate duration, store final snapshot

**GET /api/sessions/[sessionId]/transcript**
- Get full conversation transcript

**GET /api/sessions/[sessionId]/evaluation**
- Get evaluation report (after session ends)

### Real-time Coordination (called by Fly.io server)

**POST /api/internal/agents/observe-code**
- Trigger Code Observer Agent (Anthropic Haiku)
- Body: `{ sessionId, code, language }`
- Requires headers: `X-Internal-Signature`, `Idempotency-Key`
- Returns: syntax errors, warnings, analysis

**POST /api/internal/agents/evaluate**
- Trigger Evaluator Agent (Anthropic Sonnet)
- Body: `{ sessionId }`
- Requires headers: `X-Internal-Signature`, `Idempotency-Key`
- Returns: comprehensive evaluation

**POST /api/internal/realtime/session-event**
- Webhook receiver for Fly.io server events
- Body: `{ sessionId, eventType, payload }`
- Requires headers: `X-Internal-Signature`, `Idempotency-Key`
- Events: code_executed, hint_requested, session_ended

### Code Execution (Modal Integration)
- Uses `POST /api/sessions/[sessionId]/execute` as the single canonical execution endpoint.

### Payments & Credits

**POST /api/payments/create-intent**
- Create Stripe PaymentIntent for credit purchase
- Body: `{ creditPackage: 'starter' | 'pro' | 'unlimited' }`
- Returns: `{ clientSecret, amount, credits }`

**POST /api/payments/webhook**
- Stripe webhook handler
- Validates signature, processes payment events
- Awards credits on successful payment

**POST /api/subscriptions/create**
- Create Stripe subscription
- Body: `{ tier: 'pro' | 'enterprise' }`

**POST /api/subscriptions/cancel**
- Cancel subscription at period end

**GET /api/subscriptions/portal**
- Get Stripe Customer Portal URL

### Admin (protected by service role)

**POST /api/admin/problems**
- Create new problem

**PATCH /api/admin/problems/[id]**
- Update problem

**POST /api/admin/test-cases**
- Add test cases to problem

**GET /api/admin/analytics**
- Platform analytics and metrics

### WebSocket Token (for Fly.io authentication)

**POST /api/realtime/token**
- Generate one-time, short-lived (<=60s) WS token bound to `{userId, sessionId, jti}`
- Returns: `{ token, wsUrl, expiresIn }`
- Client sends token via `Sec-WebSocket-Protocol` (not query params)

---

## Summary

This architecture addresses the 300s Vercel timeout by:
1. **Separating concerns**: Vercel handles HTTP API/UI, Fly.io handles persistent WebSockets
2. **Bidirectional communication**: Fly.io ↔ Vercel via REST/webhooks
3. **Multi-agent coordination**: Event-driven architecture with Redis pub/sub
4. **Scalable state**: Redis for ephemeral, Supabase for persistent
5. **Comprehensive data model**: Captures transcripts, code evolution, evaluations

**Next Steps**: Implement authentication flow, deploy Fly.io server, and integrate provider-routing (OpenAI paid tier + Gemini free tier).


---

# Technical Architecture - Part 2
**AI Interview Prep Platform**

---

## 6. Real-Time Data Flows

### Voice Pipeline
```
User Microphone
  → Browser MediaStream API (getUserMedia)
  → WebSocket connection to Fly.io WS server (provider abstraction)
  → Fly.io forwards audio chunks to configured provider
  → OpenAI `gpt-realtime` (paid tier) OR Gemini Live API (free tier)
  → AI-generated audio stream returned
  → Fly.io forwards to browser WebSocket
  → Browser Web Audio API plays through speakers
```

**Key characteristics:**
- Bidirectional streaming with ~200-400ms latency
- Audio format: 16-bit PCM, 24kHz sample rate
- Chunked transmission (20-50ms audio frames)
- Voice Activity Detection (VAD) on client side to reduce bandwidth
- Automatic reconnection with exponential backoff

### Code Synchronization Pipeline
```
Monaco Editor (user types)
  → Debounced (300ms) onChange handler
  → WebSocket message to Fly.io (type: "code_update")
  → Fly.io validates session + broadcasts to AI context
  → Anthropic Claude Haiku API call for code observation
  → Haiku analyzes: syntax, patterns, potential bugs, approach
  → Insights returned as structured JSON
  → Fed into OpenAI Realtime API conversation context
  → Interviewer AI references observations naturally in dialogue
```

**Optimization strategies:**
- Diff-based updates (only changed lines sent after initial sync)
- Debouncing prevents API spam during rapid typing
- Haiku observations cached for 5s to reduce redundant calls
- Max observation frequency: 1 per 2 seconds per session

### Code Execution Flow
```
User clicks "Run Code" button
  → POST /api/sessions/:sessionId/execute with { code, language }
  → Vercel API route validates session + rate limit
  → HTTP request to Modal sandbox endpoint
  → Modal spins up ephemeral container (Python/JS/Java)
  → Code executes with 5s timeout, 512MB memory limit
  → stdout/stderr/exit code captured
  → Result JSON returned to Vercel
  → Vercel forwards to browser (status 200)
  → UI displays output in console panel
  → Simultaneously sent to AI context via WS for evaluation
```

**Execution constraints:**
- No network access in sandbox
- No filesystem writes (tmpfs only, wiped on exit)
- CPU throttling to prevent abuse
- Max 3 runs per minute per session

### Timer Management
```
Session Start
  → Fly.io WS server initializes server-authoritative timer
  → Timer state stored in Redis (fallback: in-memory)
  → Every 5 seconds: broadcast timer update to connected clients
  → Client displays countdown, but never controls timer
  → On timer expiry: server emits "session_ended" event
  → Client auto-submits interview + shows summary screen
```

**Reliability measures:**
- Client timer is display-only; server is source of truth
- Client clock drift correction (sync server time on connect)
- Graceful degradation if WS drops: fallback to REST polling timer API

### Session State Persistence
- **Active session state:** Fly.io in-memory + Redis backup
- **Persisted to Supabase every 30s:**
  - Code snapshot
  - Conversation transcript (summarized chunks)
  - AI evaluation scores (running totals)
- **On session end:** Full state dump to Supabase
  - Transcript only (no audio files stored)
  - Final evaluation report
  - Timeline of events (code runs, questions asked)

---

## 7. Security Architecture

### Modal Sandbox Isolation
- **Container-level isolation:** Each execution runs in fresh gVisor-sandboxed container
- **No network access:** All outbound connections blocked via network namespace isolation
- **Ephemeral filesystem:** Temporary filesystem destroyed immediately post-execution
- **Resource limits:** 512MB RAM, 1 CPU core, 5s wall-clock timeout
- **No persistent storage:** No volume mounts, no database access
- **Runtime policy:** seccomp + syscall/network egress allowlists (not blacklist-only filtering)

### WebSocket Authentication & Authorization
```
Client connects to wss://ws.yourplatform.app
  → Requests one-time WS token from `/api/realtime/token` (TTL <= 60s, includes `jti`)
  → Sends token via `Sec-WebSocket-Protocol` (never query params)
  → Fly.io WS server validates JWT signature with Supabase public key
  → Extracts user_id and session_id from JWT claims
  → Checks session ownership: user_id matches session.user_id in DB
  → Verifies `jti` nonce is unused + timestamp within skew window
  → If valid: connection established, session_id stored in connection metadata
  → If invalid: connection closed with 401
```

**Token refresh:** Client refreshes Supabase token every 50 minutes; reconnects WS with new token
**One-time token replay protection:** `jti` claim stored for 2 hours; reused token is rejected.
**Message guardrail:** WS server enforces event allowlist; no raw pass-through to model provider.
**Message validation:** strict JSON schema validation + 64KB max payload per message.

### Rate Limiting
- **Per-user global limits:**
  - 10 concurrent sessions max
  - 100 API requests per minute
  - 50 code executions per hour
- **Per-session limits:**
  - 3 code runs per minute
  - 1 AI observation call per 2 seconds
  - Max session duration: 120 minutes (hard cutoff)
- **Implementation:** Redis-backed sliding window counters
- **Enforcement points:** Vercel Edge Middleware, Fly.io WS server, Modal API gateway

### Prompt Injection Prevention
- **Input sanitization:** Strip markdown code fences, system-like tokens from user code/messages
- **Context isolation:** User code + chat kept in separate context windows from system prompts
- **Output filtering:** Regex scan AI responses for leaked system instructions
- **Haiku observations:** Treated as structured data, not raw text injected into prompts
- **Realtime API safeguards:** Use OpenAI's built-in moderation filters

### Row-Level Security (RLS) Policies - Supabase
```sql
-- sessions table
CREATE POLICY "Users can CUD own sessions"
  ON sessions FOR ALL
  USING (auth.uid() = user_id);

-- transcripts table
CREATE POLICY "Users can read own transcripts"
  ON transcripts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = transcripts.session_id
      AND sessions.user_id = auth.uid()
    )
  );

-- evaluations table
CREATE POLICY "Users can read own evaluations"
  ON evaluations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = evaluations.session_id
      AND sessions.user_id = auth.uid()
    )
  );
```

**Additional security:**
- API keys stored in Vercel environment variables (never client-side)
- Supabase service role key only used in server-side API routes
- CORS restricted to production domain + staging subdomain
- Internal APIs protected by HMAC + idempotency + mTLS/private networking

### Data Governance & Privacy Controls
- **Retention:** raw transcripts retained 90 days by default; user-triggered delete is immediate and irreversible
- **PII minimization:** redact emails/phone numbers/names in stored transcript artifacts
- **Compliance endpoints:** `/api/users/data-export` and `/api/users/data` (delete)
- **Auditability:** immutable audit log for admin access, policy changes, and deletion events

### Must-Pass Security Gate (Pre-Launch)
1. WS token flow uses one-time tokens (TTL <= 60s) via subprotocol only; query-param tokens forbidden.
2. Every WS and internal HTTP payload has schema validation, size limits, and idempotency keys.
3. Fly.io ↔ internal API traffic is authenticated with HMAC and isolated with private networking or mTLS.
4. Hidden test cases and solutions are inaccessible to user JWTs; CI includes automated RLS leakage tests.
5. Transcript retention, redaction, export, and deletion workflows are implemented and tested end-to-end.

---

## 8. Cost Per Session Breakdown

### Voice Provider Cost (Feb 2026)
#### OpenAI Realtime (`gpt-realtime`, paid tier)
- **Pricing:** ~$0.06 per minute audio input, ~$0.24 per minute audio output
- **Assumption:** 50% talk time (user + AI each speak half the time)
- **30-minute session:**
  - Input: 15 min × $0.06 = $0.90
  - Output: 15 min × $0.24 = $3.60
- **Total: ~$4.60**
- **60-minute session:**
  - Input: 30 min × $0.06 = $1.80
  - Output: 30 min × $0.24 = $7.20
- **Total: ~$9.20**

#### Gemini Live API (2.5 Flash, free tier routing)
- **Pricing:** substantially lower than OpenAI realtime for voice
- **30-minute session target:** ~ $0.75 (voice component)
- **60-minute session target:** ~ $1.50 (voice component)
- **Routing policy:** free users default to Gemini; paid users default to OpenAI

### Anthropic Code Observation (Claude Haiku)
- **Pricing:** $1.00 per 1M input tokens, $5.00 per 1M output tokens
- **Assumption:** 
  - Avg code length: 200 lines ≈ 800 tokens
  - Observation frequency: 1 call per 2 minutes (debounced)
  - Output: ~150 tokens per observation
- **30-minute session:** 15 calls
  - Input: 15 × 800 = 12K tokens ≈ $0.003
  - Output: 15 × 150 = 2.25K tokens ≈ $0.003
  - **Total: ~$0.02**
- **60-minute session:** 30 calls → **~$0.04**

### Anthropic Evaluation (Claude Sonnet 4.6)
- **Pricing:** $3 per 1M input tokens, $15 per 1M output tokens
- **Usage:** End-of-session evaluation
- **Assumption:** 
  - Input: Full transcript (5K tokens) + code (1K tokens) = 6K tokens
  - Output: Detailed report (2K tokens)
- **Per session:** 
  - Input: 6K × $3/1M = $0.018
  - Output: 2K × $15/1M = $0.03
  - **Total: ~$0.05 per session**

### Modal Sandbox Execution
- **Pricing:** $0.0003 per GB-second + $0.00003 per CPU-second
- **Assumption:** 3 runs per session, 2s avg runtime, 512MB RAM, 1 CPU
- **Per run:**
  - Memory: 0.5GB × 2s × $0.0003 = $0.0003
  - CPU: 1 × 2s × $0.00003 = $0.00006
  - Total: $0.00036 per run
- **Per session:** 3 runs × $0.00036 = **~$0.001** (negligible)

### Vercel Hosting
- **Pro Plan:** $20/month for team
- **Bandwidth:** ~2MB per session (excluding audio, which goes through Fly.io)
- **Edge functions:** ~100ms per API call, 10 calls per session
- **Estimated:** $0.01 per session (amortized)

### Supabase
- **Pro Plan:** $25/month (2 instances for HA)
- **Database writes:** ~50 per session (state snapshots)
- **Storage:** transcript + snapshots only (no audio recordings)
- **Estimated:** $0.02 per session (amortized)

### Fly.io WebSocket Server
- **Shared CPU-1x:** $0.0000008 per second per instance
- **Assumption:** 2 instances for redundancy, 30-min session
- **Cost:** 2 × 1800s × $0.0000008 = $0.003 per session
- **Bandwidth:** 5MB audio + 50KB messages = **~$0.01 per session**

### **Total Cost Per Session**
| Duration | Voice | Anthropic | Modal | Infrastructure | **Total** |
|----------|-------|-----------|-------|----------------|-----------|
| **30 min (paid)** | OpenAI ~$4.60 | ~$0.07 | $0.001 | $0.04 | **~$4.71** |
| **60 min (paid)** | OpenAI ~$9.20 | ~$0.09 | $0.001 | $0.04 | **~$9.33** |
| **30 min (free)** | Gemini ~$0.75 | ~$0.07 | $0.001 | $0.04 | **~$0.86** |
| **60 min (free)** | Gemini ~$1.50 | ~$0.09 | $0.001 | $0.04 | **~$1.63** |

**Cost drivers:** 90%+ from OpenAI Realtime API; optimization opportunities in reducing audio output time via more concise AI responses.

---

## 9. Deployment & CI/CD

### Next.js Application (Vercel)
```
GitHub push to main branch
  → Vercel webhook triggered
  → Automatic build: next build
  → Environment variables injected (SUPABASE_URL, OPENAI_KEY, etc.)
  → Deploy to production (zero-downtime rollout)
  → Edge network cache invalidation
  → Preview deployments for PRs (isolated URLs)
```

**Branch strategy:**
- `main` → production (auto-deploy)
- `staging` → staging environment (manual promotion)
- Feature branches → preview deployments

### WebSocket Server (Fly.io)
```
Manual deployment (or GitHub Actions):
  flyctl deploy --config fly.toml
  → Docker image built from Node.js server
  → Deployed to 2 regions (primary: US-East, secondary: EU-West)
  → Health checks: HTTP /health endpoint every 10s
  → Zero-downtime rolling deploy (new instances up before old killed)
```

**Fly.io config highlights:**
- Auto-scaling: 2-5 instances based on connection count
- Internal Redis for session state (Fly.io Redis add-on)
- Environment secrets via `flyctl secrets set`

### Environment Management
| Environment | Vercel Project | Fly.io App | Supabase Project | Branch |
|-------------|---------------|-----------|------------------|---------|
| **Production** | `prod-interview-app` | `ws-prod` | `prod-db` | `main` |
| **Staging** | `staging-interview-app` | `ws-staging` | `staging-db` | `staging` |
| **Development** | Local (`next dev`) | Local WS | Supabase local | Feature branches |

**Secret rotation:** Quarterly rotation of API keys via Vercel/Fly.io dashboards + Supabase service keys.

### CI/CD Pipeline (GitHub Actions)
```yaml
name: CI/CD
on: [push, pull_request]

jobs:
  test:
    - Run ESLint + TypeScript checks
    - Run Jest unit tests
    - Run Playwright E2E tests (mocked APIs)
  
  deploy-vercel:
    if: github.ref == 'refs/heads/main'
    - Vercel auto-deploys (webhook)
  
  deploy-fly:
    if: github.ref == 'refs/heads/main'
    - flyctl deploy (manual approval gate)
```

### Monitoring & Observability
- **Vercel Analytics:** Real-time performance metrics, Core Web Vitals
- **Sentry:** Error tracking (client + server), source maps uploaded post-build
- **Fly.io Metrics:** CPU/memory/connection graphs, logs via `flyctl logs`
- **Supabase Dashboard:** Query performance, RLS policy hits
- **Custom dashboards:** Grafana + Prometheus (optional for advanced metrics)

**Alerts:**
- Error rate >1% → PagerDuty
- API latency p95 >2s → Slack
- WebSocket disconnect rate >10% → Slack

---

## 10. Top Technical Risks & Mitigations

### 1. **OpenAI Realtime API Latency Spikes** (Critical)
- **Risk:** Audio delays >1s break conversation flow, user frustration
- **Mitigation:**
  - Multi-region Fly.io deployment closer to OpenAI servers
  - Client-side VAD to reduce unnecessary audio transmission
  - Fallback to text-based interview if latency >800ms for 30s
  - Monitor p95 latency; alert if >500ms

### 2. **Cost Overruns from Long Sessions** (High)
- **Risk:** 60-min sessions at $9 each; abuse or bugs could drain budget
- **Mitigation:**
  - Hard 120-minute session timeout
  - Tiered pricing: Basic (30min), Pro (60min), Enterprise (custom)
  - Real-time cost tracking dashboard; pause sessions if monthly budget hit
  - Detect idle time (no code changes + silence) → prompt to end session

### 3. **WebSocket Connection Instability** (High)
- **Risk:** Mobile users on flaky networks lose connection mid-interview
- **Mitigation:**
  - Exponential backoff reconnection (max 5 retries)
  - Session state persisted every 30s; resume from last checkpoint
  - Heartbeat pings every 15s to detect silent disconnects
  - Fallback to HTTP polling if WS fails 3 times

### 4. **Modal Sandbox Cold Starts** (Medium)
- **Risk:** First code run takes 3-5s (container spin-up), users perceive lag
- **Mitigation:**
  - Modal "keep-warm" pool: 2 pre-warmed containers per language
  - Show "Preparing environment..." spinner on first run
  - Async execution: don't block UI on sandbox wait
  - Cache common libraries (e.g., NumPy) in base image

### 5. **AI Hallucination in Evaluations** (Medium)
- **Risk:** Claude Sonnet generates inaccurate scores/feedback, hurts trust
- **Mitigation:**
  - Structured output format (JSON schema enforcement)
  - Multiple evaluation criteria with weighted scoring
  - Human QA review of 10% of evaluations (feedback loop to improve prompts)
  - User appeal system: flag incorrect feedback for manual review

### 6. **Prompt Injection Attacks** (Medium)
- **Risk:** User embeds malicious instructions in code comments to manipulate AI
- **Mitigation:**
  - Sanitize user inputs: remove system-like tokens (e.g., "[INST]", "###")
  - Separate context windows: code → Haiku, chat → Realtime API
  - Output filtering: regex scan for leaked system instructions
  - Rate limit "suspicious" patterns (e.g., 10+ code submissions in 1 min)

### 7. **Supabase RLS Bypass Vulnerabilities** (High)
- **Risk:** Misconfigured RLS policy leaks user data across accounts
- **Mitigation:**
  - Automated RLS policy tests in CI (simulate cross-user access attempts)
  - Never use service role key on client; API routes only
  - Quarterly security audits of all RLS policies
  - Enable Supabase audit logs; alert on policy changes

### 8. **Stripe Payment Failures During Checkout** (Medium)
- **Risk:** User pays but session isn't unlocked due to webhook delay/failure
- **Mitigation:**
  - Idempotent webhook handlers (deduplicate by Stripe event ID)
  - Retry logic: 3 attempts with exponential backoff
  - Manual reconciliation dashboard for failed payments
  - Grace period: allow session start, verify payment async within 5 min

### 9. **Fly.io Regional Outages** (Medium)
- **Risk:** Primary region down → all WS connections drop
- **Mitigation:**
  - Multi-region deployment (US-East + EU-West)
  - Anycast routing: clients auto-connect to nearest healthy region
  - Redis replication across regions (Fly.io Redis cluster)
  - Failover SLA: <30s to reroute traffic

### 10. **Scaling Bottleneck: Concurrent Sessions** (Low, but high-impact)
- **Risk:** 100+ simultaneous interviews overwhelm Fly.io or OpenAI rate limits
- **Mitigation:**
  - Load testing: simulate 500 concurrent sessions (k6 or Grafana)
  - OpenAI rate limit tier upgrade (contact sales for higher limits)
  - Horizontal scaling: Fly.io auto-scales to 10 instances (current limit)
  - Queue system: if at capacity, show "High demand, estimated wait: 2 min"

### 11. **Event Loss / Duplicate Processing** (High)
- **Risk:** Non-durable queue configuration or consumer bugs cause missed evaluations or duplicate hint actions
- **Mitigation:**
  - Use Redis Streams + consumer groups (durable queue)
  - Idempotency key required on all internal events
  - Dead-letter queue + replay tooling
  - Alert on queue lag and DLQ depth

### 12. **Internal Webhook Spoofing** (High)
- **Risk:** Unsigned internal endpoints can be abused to trigger costly agent calls
- **Mitigation:**
  - HMAC signatures on Fly↔Vercel internal calls
  - Reject missing/invalid signatures
  - Strict clock-skew window and nonce replay protection
  - Separate public and internal route namespaces (`/api/internal/*`)

---

**Risk Severity Ranking:**
1. Realtime API Latency (breaks core UX)
2. Cost Overruns (business viability)
3. WebSocket Instability (user drop-off)
4. RLS Bypass (data breach)
5. Internal Webhook Spoofing (cost abuse + trust risk)
6. Event Loss / Duplicate Processing (workflow correctness)
7. Modal Cold Starts (UX friction)
8. Prompt Injection (security + trust)
9. AI Hallucination (trust erosion)
10. Payment Failures (revenue loss)
11. Regional Outages (availability)
12. Scaling Bottleneck (growth ceiling)

---

## Implementation Status

| Story | Status | Notes |
|-------|--------|-------|
| 1.1 Scaffold Next.js Project | ✅ Implemented | Next.js 16, App Router, TypeScript, Tailwind v4, ESLint, `@/` path alias |
| 1.0 Design System Setup | ✅ Implemented | next/font, @theme colors/type scale, Shadcn canary, Aceternity Bento+Sparkles, /design test page |
| 1.2 Supabase Auth | ✅ Implemented | @supabase/ssr client+server, login/signup pages, OAuth (Google/GitHub), auth callback, middleware, logout, dashboard |
| 1.3 User Profiles | ✅ Implemented | profiles migration, handle_new_user trigger, RLS, GET/PATCH /api/users/profile, dashboard shows credits |
| 1.4a Problems | ✅ Implemented | problems, test_cases, problem_solutions migration, RLS, GET /api/problems, /api/problems/[slug], /api/problems/random, 3 seeded problems, dashboard + problem detail pages |
| 1.4b Seed 50 Problems | ✅ Implemented | `npm run db:seed`, scripts/seed-problems.ts + scripts/data/problems.ts, 50 problems (25 easy + 25 medium), ≥2 example + ≥3 hidden test cases each, starter code + solutions for Python/JS/Java |
| 1.5 Landing Page | ✅ Implemented | hero, features, pricing (config), footer, Terms/Privacy placeholders, SEO meta, auth redirect |
| 2.1 Session Tables | ✅ Implemented | sessions, transcripts, code_snapshots, evaluations, credit_transactions, payments, subscriptions, RLS, triggers |
| 2.2 Session Lifecycle API | ✅ Implemented | POST /api/sessions/start (RPC), GET /api/sessions, GET /api/sessions/[id], POST /api/sessions/[id]/end |
| 2.3 Code Snapshot API | ✅ Implemented | POST /api/sessions/[id]/code, 50KB limit, auto snapshot rate limit (10s) |
| 2.4 Interview Dashboard | ✅ Implemented | /dashboard with sessions list, /dashboard/start problem selection, /interview/[id] placeholder, /sessions/[id] summary |
