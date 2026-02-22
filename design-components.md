# Design Components & Libraries (Feb 2026)

> **Implementation Strategy:** We will use **Shadcn/UI** (headless + Tailwind) as the base library. It fits our requirement for "clean code" and allows full customization of the underlying architecture to match our "Warm Editorial" aesthetic.

## 1. Core Libraries

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS v4
- **UI Primitives:** `shadcn/ui` (Radix primitives)
- **Visuals:** `aceternity-ui` (Selectively used for "Hero" moments: AI Orb, Bento Grid, Number Ticker. Do NOT also install Magic UI — one animation library only.)
- **Icons:** `lucide-react` (Clean, standard, 2px stroke)
- **Motion:** `framer-motion` (for layout transitions and micro-interactions)
- **Charts:** `recharts` (customized to match the minimalist aesthetic) or `visx`
- **Markdown:** `react-markdown` + `rehype-highlight` (for AI feedback rendering)
- **Fonts:** Google Fonts (Lora, Inter, JetBrains Mono, Newsreader)

---

## 2. Key Components Checklist

### A. Navigation & Shell
- [ ] **Navbar:** Glassmorphism effect (`backdrop-blur-md`), sticky. Minimal links. Profile avatar with dropdown.
- [ ] **Footer:** Simple, 3-column. "Made by Humans & AI".
- [ ] **AuthCard:** Centered, `bg-surface`, `shadow-lg`. distinctive "Clay" colored sign-in button.

### B. Interview Interface (The "Hero" Screen)
*This screen needs custom layout engineering, not just standard components.*

- [ ] **SplitPane:** Resizable divider between Problem/Chat (Left) and Editor (Right).
- [ ] **AI Avatar/Orb:** Use **Aceternity's Animated Orb** (customized to our Clay/Forest palette).
    - *State:* Idle (Static circle), Listening (Pulsing waveform), Thinking (Spinning/morphing), Speaking (Amplitude-based animation).
    - *Style:* Minimalist, abstract. No "robot face".
- [ ] **CodeEditor (Monaco Wrapper):**
    - Custom theme matching the style guide (dark mode code on light mode UI requires careful border handling).
    - "Run Code" Floating Action Button (FAB) or Status Bar action.
- [ ] **Timer:** Use **Aceternity's Number Ticker** (or custom Framer Motion counter) for smooth countdowns, turning orange -> red.

### C. Dashboard Components
- [ ] **SessionCard:**
    - Info: Problem title, Date, Duration, Score (Badge).
    - Action: "View Summary" (Arrow icon).
- [ ] **StatCard:** Simple metric (e.g., "Questions Solved") with a sparkline chart.
- [ ] **ProblemFilter:** Pill-shaped toggle buttons (Easy/Medium/Hard).
- [ ] **Bento Grid:** Use **Aceternity Bento Grid** for the "Recent Activity" or "Learning Path" layout.

### D. Summary/Evaluation Page
- [ ] **ScoreGauge:** Radial chart showing 0-10 score.
    - *Colors:* Red (<4), Yellow (4-7), Green (>7).
    - *Animation:* Animate from 0 to score on load.
- [ ] **FeedbackBlock:**
    - *Strengths:* Green checkmark icon list.
    - *Improvements:* Orange arrow-up icon list.
- [ ] **TranscriptViewer:**
    - Chat-bubble style, but "flat" (no tails).
    - User text: Aligned right, `bg-surface`.
    - AI text: Aligned left, `bg-paper-darker`.

### E. Shared Patterns (Cross-cutting)
- [ ] **SkeletonCard:** Pulsing placeholder with `bg-paper-hover` animated shimmer. Used for SessionCard, StatCard, ScoreGauge while data loads.
- [ ] **EmptyState:** Centered illustration + headline + CTA. Variants: "No sessions yet — Start your first practice", "No payment method — Add one to unlock unlimited sessions".
- [ ] **Toast/Notification:** Shadcn `<Toaster>` customized: success = `brand-forest` left border, error = `status-error` left border. Max 3 visible, auto-dismiss 5s. Deduplicate identical messages.
- [ ] **LoadingOverlay:** Full-screen semi-transparent overlay with contextual text: "Allocating sandbox…", "Connecting to interviewer…". Used during session start flow.
- [ ] **DesktopGate:** Shown on interview routes when viewport < 1024px. Message + "Continue anyway" text link. Uses `brand-clay` accent.

---

**Epic 1 (Foundation):**
- Install Tailwind v4, clsx, tailwind-merge.
- Configure `tailwind.config.ts` with the "Clay/Paper" color palette.
- Set up `globals.css` with Google Fonts imports:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Lora:wght@400;500;600&family=Newsreader:wght@400;500;600&display=swap');
  ```
- Install Shadcn/UI base: `button`, `input`, `card`, `dropdown-menu`, `toast`.

**Epic 2 (Sessions):**
- Build `SessionCard` and Dashboard layout using **Bento Grid** concepts.
- Implement "Empty State" using a custom SVG illustration.

**Epic 4 (Voice):**
- Integrate **Aceternity Orb** for the AI Avatar.
- Implement the Audio visualizer (Canvas or CSS animation based on volume).

**Epic 5 (Editor):**
- Customize Monaco Editor theme to blend with the "Paper" UI.

**Epic 8 (Evaluator):**
- Build `ScoreGauge` and markdown styling for reports.
