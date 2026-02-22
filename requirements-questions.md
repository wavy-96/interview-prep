# AI Interview Prep Platform — Requirements Breakdown Questions

> **Purpose:** Every question below MUST be answered before a single line of code is written. Ambiguity here becomes tech debt later.

---

## 1. User & Authentication

### 1.1 Onboarding Flow
1. What is the exact step-by-step onboarding flow? (Landing page → Sign up → First interview, every screen)
2. Do users sign up with email/password, OAuth (Google, GitHub), or both?
3. Is email verification required before first use?
4. Is there a "guest mode" or must every user create an account?
5. Do we collect any info during onboarding (experience level, target company, preferred language, goal role)?
6. Is there a guided tutorial / walkthrough for first-time users, or do they jump straight into an interview?
7. What happens if a user abandons onboarding halfway — do we save partial state?

### 1.2 User Profiles & Preferences
8. What data lives on the user profile? (Name, avatar, preferred language, experience level, target companies?)
9. Can users set a preferred coding language that persists across sessions?
10. Do users pick a "difficulty preference" or is it adaptive?
11. Are there user-configurable settings for the AI interviewer? (Strictness, hint frequency, voice type, personality?)
12. Can users set a preference for problem categories (arrays, trees, DP, etc.)?
13. Do users have a dashboard? What does it show? (History, progress, stats, streaks?)
14. Can users edit/delete their profile and all associated data (GDPR compliance)?

### 1.3 Supabase Auth Specifics
15. Are we using Supabase Auth exclusively, or also Supabase as the primary database?
16. Which Supabase auth providers will be enabled at launch? (Email, Google, GitHub, others?)
17. Do we need role-based access control (e.g., admin, free user, premium user)?
18. How do we handle session tokens — Supabase's built-in JWT or custom session management?
19. What is the session expiry policy? What happens if a token expires mid-interview?
20. Do we need refresh token rotation for security?
21. Will Supabase Row Level Security (RLS) be used to protect user data?

### 1.4 Subscription & Account Tiers
22. Is there a free tier? If so, what are its limits? (X interviews/month? Limited duration? No post-summary?)
23. What are the paid tiers and what does each unlock?
24. Is pricing per-seat, per-usage, or flat monthly?
25. Which payment processor? (Stripe, Paddle, Lemon Squeezy?)
26. Do we need trial periods? How long?
27. What happens when a user downgrades mid-billing cycle?
28. What happens when a free-tier user hits their limit mid-interview?

---

## 2. Interview Session Flow

### 2.1 Pre-Interview
29. What is the exact screen/state sequence from "Start Interview" to the first AI utterance?
30. Does the user select difficulty (Easy/Medium/Hard) before starting, or is it chosen for them?
31. Does the user select a problem category, or is it random?
32. Can the user choose a specific problem, or is it always assigned?
33. Does the user select their coding language before or after seeing the problem?
34. Is there a "ready check" screen with microphone/audio test before the session begins?
35. Does the user configure hint preferences (on/off, frequency) before the session starts?
36. Is there a countdown or immediate start after hitting "Begin"?
37. How is the timer displayed? Always visible? Flashing warnings at thresholds?

### 2.2 During the Interview
38. What is the exact layout of the interview screen? (Problem description, code editor, timer, AI avatar/indicator — where does each live?)
39. Is the problem description always visible, or collapsible?
40. Can the user resize panes (problem vs. code editor)?
41. Does the AI interviewer speak first (greeting + problem walkthrough), or does the user initiate?
42. What is the exact script/flow for the AI's opening? (Greeting → introduce problem → ask if user has questions → let them begin?)
43. Can the user ask the AI to repeat the problem or clarify constraints?
44. Can the user ask clarifying questions like in a real interview (e.g., "Can the input be negative?")?
45. How does the AI decide when to speak vs. stay silent? Is there a silence threshold (e.g., 30 seconds of no speech or typing)?
46. Can the user mute/unmute the AI mid-interview?
47. Can the user pause the timer? If yes, under what conditions? Does the AI also pause?
48. What happens if the user finishes early? Can they submit before time runs out?
49. What happens at the 5-minute, 2-minute, and 1-minute marks? Does the AI give time warnings?
50. Is there a "soft end" (AI wraps up conversation) or "hard end" (session terminates abruptly)?
51. Can the user run their code during the interview to test it?
52. How many times can they run their code? Is there a rate limit?
53. Does the AI see code execution output (stdout, stderr) and react to it?
54. Can the user reset their code to a blank slate mid-interview?
55. Is there an undo/redo in the code editor?
56. Can the user switch languages mid-interview?

### 2.3 Edge Cases & Failure Modes
57. What happens if the user loses internet mid-interview?
58. What happens if the user closes the browser tab mid-interview?
59. Can the user rejoin a disconnected session? How long is the session preserved?
60. What happens if the AI service (OpenAI/Anthropic) goes down mid-interview?
61. What happens if the Modal sandbox fails to execute code?
62. What if the microphone stops working mid-session?
63. What if the user doesn't speak at all for the entire interview?
64. What if the user speaks in a language the STT model doesn't support well?
65. What happens if two tabs of the same session are open simultaneously?
66. Is there a maximum number of concurrent sessions per user (should be 1)?
67. What happens if the user's code contains an infinite loop in the sandbox?

### 2.4 Session State Management
68. Where is session state stored? (Client-side, server-side, database, in-memory?)
69. What constitutes a "session" in the database? What fields does it have?
70. Is the full transcript stored in real-time or reconstructed from chunks?
71. Is every keystroke in the editor saved, or only snapshots at intervals?
72. At what granularity do we track code changes? (Every character? Every save? Every 5 seconds?)
73. Are session recordings (audio + code timeline) stored for user playback later?
74. How long are session records retained in the database?
75. Can a user delete a specific session from their history?

---

## 3. Problem Bank

### 3.1 Problem Source & Curation
76. Where do the problems come from? (Custom-written, open-source datasets, scraped, licensed, API?)
77. Are we writing original problems or using existing LeetCode-style problems?
78. If using existing problems, what are the licensing/copyright implications?
79. Who curates/reviews problems? Is there a quality control process?
80. How many problems do we need at launch? (MVP count vs. long-term target?)
81. What is the problem schema? (Title, description, constraints, examples, hints, solution(s), time/space complexity, category, difficulty?)
82. Do problems have multiple valid solutions, and does the system know about all of them?
83. Are problems stored in the database or in flat files (JSON/YAML)?

### 3.2 Problem Categorization
84. What categories exist? (Arrays, Strings, Linked Lists, Trees, Graphs, DP, Greedy, Backtracking, Math, Bit Manipulation, System Design?)
85. How many difficulty levels? (Easy, Medium, Hard? Or a numeric scale 1-10?)
86. Are problems tagged with required concepts (e.g., "BFS", "sliding window", "two pointers")?
87. Is there a mapping from problem to common company interview questions?
88. Can problems be filtered by "most frequently asked at [Company X]"?

### 3.3 Problem Selection Logic
89. How is a problem selected for a given session? (Random? Weighted by user weakness? Spaced repetition?)
90. Does the selected problem match the session duration? (Easier for 15 min, harder for 60 min?)
91. Does the system avoid repeating problems the user has already seen?
92. Is there an adaptive difficulty system that adjusts based on user performance history?
93. Can users bookmark/favorite problems for later?
94. Can users request a specific problem or problem type before starting?

### 3.4 Custom & User-Generated Problems
95. Can users (or admins) upload custom problems?
96. If custom problems are supported, how are test cases validated?
97. Is there an admin panel for managing the problem bank?

---

## 4. AI Voice Interviewer

### 4.1 Text-to-Speech (TTS)
98. Which TTS provider? (OpenAI TTS, ElevenLabs, Google Cloud TTS, Amazon Polly, Deepgram Aura?)
99. What is the latency budget from AI decision-to-speak → audio reaching user's ears? (Target: <500ms? <1s?)
100. Is the voice customizable? (Male/female, different personas, accents?)
101. Do we stream TTS audio (chunked) or wait for the full audio to generate?
102. What is the voice quality bar? (Conversational/natural vs. robotic is unacceptable?)
103. How do we handle TTS of technical terms, variable names, and code snippets? (e.g., "Big O of N squared")
104. Is there a fallback TTS provider if the primary is down or slow?
105. What sample rate and audio format? (16kHz, 24kHz, 44.1kHz? opus, mp3, pcm?)

### 4.2 Speech-to-Text (STT)
106. Which STT provider? (OpenAI Whisper, Deepgram, Google Cloud STT, AssemblyAI?)
107. Is STT real-time (streaming) or does it process after the user stops talking?
108. What is the latency budget from user speech → transcribed text available to the AI agent?
109. How do we handle overlapping speech (user talks while AI is talking)?
110. How do we handle technical jargon, algorithm names, and code-related speech accurately?
111. Is there a confidence threshold below which we ask the user to repeat themselves?
112. Do we need speaker diarization (separating user voice from AI voice in recordings)?
113. How do we handle background noise, poor microphones, or accented speech?
114. Is there a fallback STT provider?

### 4.3 Conversation Design
115. What is the AI interviewer's persona/personality? (Friendly? Neutral? Tough? Google interviewer? Startup culture?)
116. Is the persona configurable by the user?
117. What is the AI's conversational style? (Formal, casual, encouraging, Socratic?)
118. Does the AI use filler words ("right", "okay", "interesting") to feel more human?
119. How verbose should the AI be? Should it keep responses under X seconds of audio?
120. Does the AI ask follow-up questions about the user's approach before they code?
121. Does the AI ask the user to explain their thought process (like a real interviewer)?
122. Does the AI discuss time/space complexity during or after the coding phase?
123. How does the AI handle off-topic conversation? (User talks about something irrelevant)
124. How does the AI handle rude, abusive, or inappropriate user speech?
125. Does the AI ever "pretend" to be confused to test the user's explanation skills?

### 4.4 Turn-Taking & Interruption
126. How does the system detect when the user is done speaking? (Silence detection? VAD — Voice Activity Detection?)
127. What is the silence threshold before the AI considers the user done talking? (1s? 2s? configurable?)
128. Can the user interrupt the AI mid-speech? If so, does the AI stop immediately?
129. Is there a push-to-talk option, or is it always-on voice detection?
130. How is echo cancellation handled? (AI's TTS output feeding back into the user's mic?)

---

## 5. AI Agent Behavior

### 5.1 Code Observation
131. How does the AI "watch" the user's code? (Real-time keystrokes streamed to the agent? Periodic snapshots? On every pause?)
132. At what frequency does the AI receive code updates? (Every keystroke? Every 2 seconds? On save?)
133. Does the AI parse the code (AST), or just read it as raw text?
134. Does the AI understand the programming language syntax, or does it treat code as plain text?
135. Can the AI identify specific patterns in the user's code (e.g., "they're using BFS", "they have an off-by-one error")?
136. Does the AI track what the user has written, deleted, and rewritten (i.e., code evolution)?

### 5.2 Intervention Logic
137. Under what conditions does the AI intervene? (Explicitly defined rules vs. LLM judgment?)
138. Is there a taxonomy of interventions? (Hint, nudge, encouragement, direct correction, silence)
139. What is a "hint" vs. a "nudge"? Define each level precisely.
140. How long does the AI wait before offering a hint if the user is stuck? Is "stuck" defined by time, lack of progress, or both?
141. Does the AI give hints proactively or only when the user asks?
142. If hints are optional (user preference), does "no hints" mean the AI is completely silent or just doesn't give algorithmic help?
143. Does the AI point out bugs in real-time, or only if the user runs the code and fails?
144. Does the AI ever tell the user their approach is wrong, or only guide with questions?
145. How aggressive is the AI about time management? ("You have 10 minutes left and haven't started coding yet.")
146. Does the AI adapt its intervention style based on user skill level?
147. Is there a maximum number of hints per session?
148. Does hint usage affect the final score/evaluation?

### 5.3 Context Window & Memory
149. What is the AI agent's context window at any given moment? (Full transcript + current code + problem description?)
150. How do we handle context window limits for long interviews (60 min)?
151. Is there a summarization strategy for older parts of the conversation to stay within token limits?
152. Does the AI remember previous sessions with the same user? (Cross-session memory?)
153. What is the system prompt structure? (Persona + rules + problem + code + transcript?)

### 5.4 Personality & Tone Calibration
154. Is the AI's warmth/strictness on a spectrum that the user can configure?
155. Are there multiple interviewer "personas" (e.g., "Google-style", "Facebook-style", "Chill startup")?
156. Does the AI maintain consistent personality throughout the session, or does it shift under time pressure?
157. How does the AI handle encouraging the user when they're struggling vs. being realistic about performance?

---

## 6. Code Editor & Execution

### 6.1 Editor
158. Which code editor component? (Monaco Editor / CodeMirror 6 / Ace / other?)
159. Why that editor? What features are non-negotiable? (Syntax highlighting, autocomplete, line numbers, bracket matching?)
160. Do we provide IntelliSense / autocomplete? (If so, to what extent — full LSP or basic keyword completion?)
161. Is there a built-in code formatter (Prettier, Black, etc.)?
162. Do we support multiple tabs/files, or is it a single-file editor?
163. Is there a dark/light theme toggle?
164. Can the user change font size?
165. Is there vim/emacs keybinding support?
166. Is the editor state synchronized to the server in real-time (for AI observation and reconnection)?

### 6.2 Language Support
167. Which programming languages are supported at launch? (Python, JavaScript, Java, C++, Go, Rust, TypeScript?)
168. What is the priority order for language support?
169. Do all languages have equal feature parity (syntax highlighting, autocomplete, execution)?
170. Are there language-specific starter templates/boilerplate?
171. Does the problem define function signatures that are pre-filled in the editor per language?

### 6.3 Code Execution via Modal
172. How does Modal sandbox work architecturally? (User clicks "Run" → code sent to API → Modal container spins up → executes → returns output?)
173. What is the expected cold-start time for a Modal sandbox? Is there a warm pool?
174. What is the maximum execution time per run? (5 seconds? 10 seconds? 30 seconds?)
175. What is the memory limit per sandbox execution?
176. How do we handle infinite loops or runaway processes? (Timeout + kill?)
177. Can the user provide custom stdin input for their code?
178. Does the sandbox run the user's code against hidden test cases, or just the user's own test cases?
179. Are test case results shown inline (pass/fail per case) or just stdout/stderr?
180. Is there a separate "Submit" action (like LeetCode) that runs against all test cases vs. a "Run" action that runs against sample cases?
181. How do we prevent malicious code execution? (Network access disabled? Filesystem sandboxed? No system calls?)
182. Can the user install packages/libraries in the sandbox (e.g., `import numpy`)?
183. What runtime versions are used? (Python 3.11? Node 20? Java 21?)
184. Are Modal sandbox costs per-invocation, per-second, or per-container?
185. How do we handle sandbox failures (out of memory, crash, Modal service outage)?

### 6.4 Test Cases
186. Does each problem have predefined test cases?
187. Are test cases visible to the user, or are some hidden?
188. Can the user write and run their own test cases?
189. What is the format for test cases? (JSON input/output? Function call assertions?)
190. How are test results displayed? (Green/red pass/fail? Diff of expected vs. actual? Execution time?)

---

## 7. Real-Time Data Streaming

### 7.1 Transport Protocol
191. WebSockets, Server-Sent Events (SSE), or WebRTC for the primary real-time channel?
192. Is there a single multiplexed connection or separate channels for audio, code, and AI responses?
193. What is the reconnection strategy if the WebSocket drops?
194. Is there a heartbeat/ping-pong mechanism to detect stale connections?
195. Do we need WebRTC specifically for voice (peer-to-peer audio) or is all audio routed through the server?

### 7.2 Data Flows
196. Map every real-time data flow explicitly:
    - User microphone audio → server → STT → AI agent?
    - AI agent text response → TTS → audio stream → user speakers?
    - User code editor changes → server → AI agent context?
    - AI agent code observations → text/audio response → user?
    - Timer state → user?
    - Code execution request/response → user?
197. Which data flows are upstream (client → server) vs. downstream (server → client) vs. bidirectional?
198. What is the maximum acceptable end-to-end latency for each flow?
    - Voice input → AI voice response: ___ms?
    - Code change → AI observation: ___ms?
    - Code execution request → result: ___ms?
199. What serialization format for messages? (JSON? Protobuf? MessagePack?)
200. How large can individual messages be? (Code snapshots could be large)

### 7.3 Audio Streaming
201. Is audio streamed as raw PCM, opus, or another codec?
202. What is the chunk size / frame duration for audio streaming? (20ms? 100ms?)
203. How do we handle audio buffering and jitter?
204. Is there an audio quality degradation strategy for poor connections (adaptive bitrate)?

### 7.4 Reliability & Ordering
205. Do messages need guaranteed delivery and ordering? (Especially for code edits)
206. How do we handle out-of-order messages?
207. Is there a message queue or buffer on the server side for burst handling?
208. What happens if the server is overwhelmed with messages from too many concurrent sessions?

---

## 8. Post-Interview Summary & Critique

### 8.1 Summary Generation
209. What triggers summary generation? (Session end? User clicks "End Interview"? Timer expires?)
210. How long does summary generation take? Is it synchronous (user waits) or async (delivered later via email/notification)?
211. Is the summary generated by the same AI model that conducted the interview, or a separate model?
212. What model is used for summary generation? (GPT-4, Claude, etc.)
213. Is the full transcript + code history fed into the summary model?

### 8.2 Evaluation Rubric
214. What is the exact rubric for evaluation? Define every dimension:
    - Problem solving approach?
    - Code correctness?
    - Code quality / style?
    - Time/space complexity analysis?
    - Communication skills?
    - Debugging ability?
    - Speed / time management?
    - Use of hints?
215. Is each dimension scored numerically (1-10? 1-5?) or qualitatively (Weak/Average/Strong)?
216. Is there an overall composite score?
217. Are scores calibrated against real interview expectations? How?
218. Does the rubric differ by difficulty level?
219. Is the rubric transparent to the user (do they see the criteria)?

### 8.3 Content of Summary
220. Does the summary include a line-by-line or section-by-section code review?
221. Does it identify specific bugs and explain why they're bugs?
222. Does it provide the optimal solution for comparison?
223. Does it show time/space complexity of the user's solution vs. optimal?
224. Does it include a timeline/replay of the session? (At 5:00, user started coding. At 12:00, user got stuck.)
225. Does it include a transcript of the full conversation?
226. Does it provide actionable next steps? (e.g., "Practice more tree problems", "Work on explaining your thought process")
227. Does it suggest specific follow-up problems to practice?
228. Can the user share their summary (e.g., link to a public/private summary page)?

### 8.4 Progress Tracking
229. Are summary scores tracked over time? (Performance trend graphs?)
230. Can users compare their current performance to their historical average?
231. Are there aggregate analytics? (e.g., "You're strongest in arrays, weakest in DP")
232. Is there a "readiness score" that estimates interview preparedness?
233. Do we benchmark against other users (anonymized leaderboard, percentile ranking)?

---

## 9. Agent Architecture

### 9.1 Agent Framework
234. Which agent SDK? (OpenAI Agents SDK, Anthropic Claude Tool Use, LangGraph, CrewAI, AutoGen, custom?)
235. Why that framework? What are the deciding factors?
236. What is the minimum viable agent architecture for MVP? Can we start simple and evolve?

### 9.2 Single vs. Multi-Agent
237. Is this a single monolithic agent or multiple specialized agents?
238. If multi-agent, what are the distinct agent roles? Possible breakdown:
    - **Interviewer Agent**: Manages conversation flow, asks questions, gives feedback
    - **Code Observer Agent**: Watches code changes, detects patterns, identifies bugs
    - **Hint Engine Agent**: Decides when/what hints to give
    - **Evaluator Agent**: Generates post-interview summary
    - **Orchestrator Agent**: Coordinates all agents
239. How do agents communicate with each other? (Shared state? Message passing? Event bus?)
240. Is there a "supervisor" agent that mediates between sub-agents?
241. Can agents override each other? (e.g., Code Observer says "give hint" but Interviewer says "not yet")

### 9.3 State Management
242. Where does agent state live during a session? (In-memory? Redis? Database?)
243. What is in the agent's state? (Conversation history, code snapshots, hint count, time remaining, user profile?)
244. How is agent state serialized/deserialized for crash recovery?
245. Is agent state persisted to disk, or purely in-memory (lost on crash)?
246. How large can agent state grow during a 60-minute session? Memory implications?

### 9.4 Tool Use
247. What tools do agents have access to? (Code execution, problem lookup, timer management, code analysis?)
248. Can the AI agent run the user's code independently to verify correctness?
249. Can the AI agent access the problem's test cases and solution?
250. Does the AI agent have access to a code linter or static analysis tool?

### 9.5 Prompt Engineering
251. Where are system prompts stored and versioned? (Database? Config files? Hardcoded?)
252. Is there a prompt management system for A/B testing different prompts?
253. How do we prevent prompt injection via user speech or code? (User says "ignore your instructions")
254. How do we evaluate prompt quality? Automated evals? Human review?

---

## 10. Infrastructure & Scaling

### 10.1 Hosting & Deployment
255. Where is the backend hosted? (Vercel, AWS, GCP, Fly.io, Railway, self-managed?)
256. Where is the frontend hosted? (Vercel, Netlify, Cloudflare Pages?)
257. What is the backend framework? (Next.js API routes, FastAPI, Express, Go?)
258. What is the frontend framework? (Next.js, React SPA, SvelteKit?)
259. Is this a monorepo or polyrepo?
260. What is the CI/CD pipeline? (GitHub Actions, etc.)
261. Is there a staging environment?
262. What is the deployment strategy? (Blue-green, rolling, canary?)

### 10.2 Database & Storage
263. Primary database? (Supabase Postgres, PlanetScale, Neon, CockroachDB?)
264. Do we need a separate real-time/low-latency store? (Redis, Upstash?)
265. Where are audio recordings stored? (S3, Supabase Storage, Cloudflare R2?)
266. Where are code snapshots stored?
267. Where are session transcripts stored?
268. What is the database schema at a high level? (Users, Sessions, Problems, Summaries, Transcripts?)
269. Do we need full-text search on problems or transcripts? (Postgres FTS, Meilisearch, Typesense?)
270. What is the expected database size after 1 year at different user scales?

### 10.3 Cost Estimation
271. What is the estimated cost per interview session? Break it down:
    - STT cost per minute of audio?
    - TTS cost per character/request?
    - LLM cost per token (input/output) for the AI agent?
    - LLM cost for summary generation?
    - Modal sandbox cost per execution?
    - Bandwidth cost for audio streaming?
272. What is the all-in cost for a 30-minute session? A 60-minute session?
273. At what user volume does this become unsustainable without revenue?
274. What are the fixed monthly costs (hosting, database, etc.) regardless of usage?
275. Which costs scale linearly with users, and which have step-function scaling?

### 10.4 Scaling & Concurrency
276. How many concurrent interview sessions must the system support at launch?
277. What is the target for 6 months post-launch? 1 year?
278. What is the bottleneck for concurrent sessions? (LLM API rate limits? WebSocket connections? Modal containers? Server memory?)
279. How do we handle a sudden spike in users (e.g., HN front page)?
280. Do we need horizontal scaling for the WebSocket server?
281. Are there rate limits on any external APIs we depend on? (OpenAI, Anthropic, Modal, TTS/STT providers?)
282. What happens when we hit those rate limits?

### 10.5 Latency & Performance
283. What are the critical latency paths and their budgets?
    - Page load time: ___ms?
    - Time from "Start Interview" to AI speaking: ___ms?
    - User speech → AI response: ___ms?
    - Code "Run" click → execution result: ___ms?
284. Are there cold start issues with any services? (Modal, LLM APIs, WebSocket servers?)
285. How do we monitor latency in production?
286. What is the P99 latency target for voice interaction?

---

## 11. Privacy, Security & Compliance

### 11.1 Audio & Data Consent
287. Is the user's audio recorded and stored? If so, for how long?
288. Is explicit consent required before recording begins?
289. Can users opt out of audio recording while still using the platform?
290. Is the AI's audio stored, or just the transcript?
291. Is there a consent banner/modal, or is consent handled via Terms of Service?
292. Is recording consent per-session or one-time?

### 11.2 Data Privacy
293. Where is user data stored geographically? (Important for GDPR)
294. Do we need GDPR compliance? CCPA? SOC 2?
295. Can users request full data export (data portability)?
296. Can users request complete deletion of all their data?
297. Is any user data sent to third-party AI providers? (OpenAI, Anthropic see the user's code and voice?)
298. What are the data processing agreements with AI providers?
299. Are conversations/code used to train AI models? Can users opt out?
300. Do we log or store any PII beyond what's strictly necessary?
301. Is there a privacy policy? Who writes it?

### 11.3 Code Sandbox Security
302. Can user code in the Modal sandbox access the network?
303. Can user code access the filesystem outside the sandbox?
304. Can user code access environment variables or secrets?
305. Is there resource limiting (CPU, memory, disk) per sandbox execution?
306. How do we prevent fork bombs, crypto miners, or other abuse?
307. Is the sandbox ephemeral (destroyed after each execution)?
308. Are sandbox logs retained for abuse detection?

### 11.4 Application Security
309. Is all traffic over HTTPS/WSS?
310. How do we prevent WebSocket hijacking?
311. Is there rate limiting on all API endpoints?
312. How do we handle DDoS attacks?
313. Are API keys and secrets stored securely? (Environment variables, vault?)
314. Is there an audit log for admin actions?
315. How do we handle vulnerability disclosures?

---

## 12. Monetization & Business Model

### 12.1 Pricing Strategy
316. What is the target customer? (CS students, bootcamp grads, senior engineers, career switchers?)
317. What is the competitive landscape? (Pramp, Interviewing.io, LeetCode, AlgoExpert — how do we differ?)
318. What is the pricing model? (Freemium, flat subscription, pay-per-session, credits?)
319. If freemium, what is the free tier limit that encourages conversion without being frustrating?
320. What price point targets? ($10/mo? $30/mo? $50/mo?)
321. Is there a lifetime deal or annual discount?
322. Is there a team/enterprise plan for bootcamps or companies?

### 12.2 Usage Limits & Metering
323. How do we meter usage? (Session count, total minutes, number of code runs?)
324. Is there a daily/weekly/monthly limit, or just monthly?
325. What happens when a user hits their limit? (Hard block? Degraded experience? Upsell modal?)
326. Are limits per user or per account?

### 12.3 Launch Strategy
327. Is there a beta/early access period? How many users?
328. Do beta users get free access? For how long?
329. Is there a waitlist?
330. What is the MVP feature set vs. the full product vision?

---

## 13. Technical Risks & Failure Modes

### 13.1 AI Quality Risks
331. What if the AI gives incorrect feedback on the user's code? (Hallucinated bugs, wrong complexity analysis)
332. What if the AI's hints give away the answer too easily?
333. What if the AI's hints are too vague to be useful?
334. What if the AI feedback is inconsistent across sessions? (Different evaluation for same code)
335. What if the AI can't understand the user's approach and gives irrelevant commentary?
336. How do we detect and mitigate AI hallucination in real-time?
337. What if the AI interviewer goes "off-script" (says something inappropriate, breaks character)?
338. How do we test AI quality at scale? (Automated evals, human review, user feedback?)

### 13.2 Latency Risks
339. What is the realistic end-to-end latency for: user speaks → AI responds with voice? (STT latency + LLM latency + TTS latency)
340. What if the total voice-to-voice latency exceeds 3 seconds? Is the experience still viable?
341. What if LLM API response times spike during peak hours?
342. What if Modal cold starts cause 5+ second delays on code execution?
343. What is the degraded experience plan if latency is unacceptable? (Text fallback? Cached responses?)

### 13.3 Cost Risks
344. What if the cost per session is $2+? $5+? At what point is the unit economics broken?
345. What is the projected LLM token usage per session? (Prompt + completion tokens for agent, summary, etc.)
346. Can we reduce costs with smaller models for some tasks? (Haiku for code observation, Opus for summary?)
347. What if a user abuses the free tier with extremely long or frequent sessions?
348. Is there a cost circuit breaker per session (max spend cap)?
349. How do we optimize prompt size to reduce token costs without losing quality?

### 13.4 Scale Risks
350. What if we get 1000 concurrent users on day one? Are we ready?
351. What if WebSocket connections overwhelm the server?
352. What if the Supabase free/pro tier limits are hit unexpectedly?
353. What if Modal rate limits or quotas block code execution for paying users?
354. Do any of our vendor dependencies have usage caps we could hit?

### 13.5 User Experience Risks
355. What if voice interaction feels unnatural and users prefer text chat instead?
356. Should there be a text-only fallback mode?
357. What if users in noisy environments can't use voice at all?
358. What if users feel anxious about being "listened to" and refuse to enable the mic?
359. What if the code editor is laggy due to real-time syncing overhead?
360. What if the AI over-interrupts and users find it annoying?
361. What if users game the system (e.g., copy-paste solutions from LeetCode)?

---

## 14. Observability, Monitoring & DevOps

362. What application monitoring tool? (Datadog, Sentry, Grafana, New Relic?)
363. What are the critical alerts? (Session failure rate > X%, latency > Yms, error rate spikes?)
364. Are there structured logs for every session event? (Session start, AI utterance, code run, session end)
365. How do we track AI quality over time? (User ratings? Automated evals?)
366. Is there a session replay capability for debugging? (View what the user saw)
367. How do we detect and investigate "bad sessions" (AI misbehavior, crashes, poor feedback)?
368. What uptime SLA do we target? (99.9%? 99.5%?)
369. Is there a status page for users?
370. What is the incident response process?

---

## 15. Future Considerations & Scope Boundaries

371. Is system design interview mode in scope for V1 or future?
372. Is behavioral interview mode in scope?
373. Is multi-language voice support (non-English) planned?
374. Is mobile support required at launch?
375. Is there a collaborative/pair programming mode (two users, one interviewer)?
376. Can users invite friends to mock interview each other with AI observing?
377. Is there a "replay" feature where users can watch their interview like a video?
378. Is there an API for third-party integrations (bootcamps, hiring platforms)?
379. Is there a Chrome extension or VS Code extension planned?
380. Is offline mode ever in scope?
381. Is there a gamification layer? (XP, badges, streaks, leaderboard?)
382. Are there "interview tracks" (e.g., "Google Prep Track" — 20 curated sessions)?
383. Is there a social component? (Community, forums, shared solutions?)
384. Do we plan to support whiteboard-style diagramming for system design?
385. Is there a referral program?

---

## 16. MVP Definition & Prioritization

386. What is the absolute minimum feature set for a usable V1?
387. Which of the above features are P0 (must have), P1 (should have), P2 (nice to have)?
388. What is the target launch date?
389. How many engineers are building this?
390. What is each engineer's strength? (Frontend, backend, ML/AI, infra?)
391. Are there any hard technical constraints or pre-existing decisions that limit choices?
392. What is the definition of "done" for the MVP?
393. What user feedback mechanism exists for post-launch iteration?
394. What is the first metric we optimize for? (User retention? Session completion rate? NPS?)
395. What does success look like 30 days after launch? 90 days?

---

*Total: 395 questions across 16 categories. Every one of these is a decision that will shape the architecture, cost, user experience, and viability of this product. Answer them before writing code.*
