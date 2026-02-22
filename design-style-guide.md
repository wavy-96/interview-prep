# Design Style Guide: "Technical Zen" (Feb 2026)

> **Design Philosophy:** "Anti-AI Slop." We are building a tool for humans to practice their craft. The interface should feel like a well-lit study room: warm, focused, and distinctively human. We avoid the generic "corporate Memphis" or "neon cyberpunk" tropes of early AI tools.

## 1. Visual Identity & Atmosphere

**Theme:** *Warm Editorial meets Developer Productivity.*
Instead of clinical sterile white (#FFFFFF) or harsh dark mode (#000000), we use "paper" tones and "ink" colors. The vibe is "Interactive Textbook" rather than "SaaS Dashboard."

### Color Palette (Tailwind v4)

**Base / Surface**
- `bg-paper`: `#FBF9F6` (Warm off-white, like heavy cardstock)
- `bg-paper-hover`: `#F2EFE9`
- `bg-surface`: `#FFFFFF` (For cards/inputs, distinct from paper background)
- `border-subtle`: `#E6E4DD`

**Typography / Ink**
- `text-ink`: `#1F1F1F` (Soft black, high contrast but not harsh)
- `text-ink-muted`: `#666460` (Accessible gray for subtitles)
- `text-ink-faint`: `#999793` (For placeholders/disabled)

**Brand Accents (Anthropic-inspired)**
- `brand-clay`: `#D97757` (Primary CTA, Terracotta/Burnt Orange)
- `brand-clay-hover`: `#C06346`
- `brand-sand`: `#E8E4D9` (Secondary backgrounds)
- `brand-forest`: `#2D4F44` (Strong secondary, deep green)

**Functional / Feedback**
- `status-success`: `#3E7B56` (Natural green)
- `status-error`: `#C94A4A` (Muted red, not neon)
- `status-warning`: `#E0A82E` (Gold)
- `code-bg`: `#1E1E1E` (Standard VS Code dark theme for editor only—high contrast against the light UI)

---

## 2. Typography

We pair a **humanist serif** for headings (editorial authority, warmth) with a **highly legible sans** for UI/data (clarity, speed).

**Import Link:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Lora:wght@400;500;600&family=Newsreader:wght@400;500;600&display=swap');
```

**Headings: _Lora_ or _Newsreader_**
- Usage: H1, H2, Feature titles, "Big Numbers".
- Weight: Regular or Medium (avoid Bold, let the serif structure do the work).
- *Why:* Serifs signal "curated content" and "human thought," distinguishing us from generic AI chat interfaces.

**Body / UI: _Inter_**
- Usage: Dashboard tables, buttons, inputs, dense text.
- *Why:* Standard for 2026 developer tools. legible at small sizes, neutral character.

**Code: _JetBrains Mono_**
- Usage: Code editor, snippets, logs, API keys.
- Ligatures: Enabled.

---

## 3. Type Scale & Responsive Breakpoints

### Type Scale (rem-based, 1rem = 16px)

| Token | Size | Line Height | Font | Usage |
|-------|------|-------------|------|-------|
| `text-display` | 2.25rem (36px) | 1.2 | Lora | Landing hero headline |
| `text-h1` | 1.875rem (30px) | 1.3 | Lora | Page titles (Dashboard, Summary) |
| `text-h2` | 1.5rem (24px) | 1.35 | Lora | Section headings |
| `text-h3` | 1.25rem (20px) | 1.4 | Inter 600 | Card titles, sub-sections |
| `text-body` | 1rem (16px) | 1.6 | Inter 400 | Body copy, descriptions |
| `text-body-sm` | 0.875rem (14px) | 1.5 | Inter 400 | Secondary text, table cells |
| `text-caption` | 0.75rem (12px) | 1.5 | Inter 500 | Labels, badges, timestamps |
| `text-code` | 0.875rem (14px) | 1.6 | JetBrains Mono | Editor, inline code, logs |
| `text-code-sm` | 0.8125rem (13px) | 1.5 | JetBrains Mono | Output panel, terminal |

### Responsive Breakpoints

| Token | Width | Usage |
|-------|-------|-------|
| `sm` | 640px | Phone landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | **Desktop gate threshold** — interview/coding routes block below this |
| `xl` | 1280px | Standard desktop (primary design target) |
| `2xl` | 1536px | Large monitors |

**Rules:**
- Landing/auth/dashboard/billing/summary pages: responsive from `375px` up.
- Interview + live coding routes: hard-gate at `<1024px` with "Desktop required" message + "Continue anyway" escape hatch.
- Code editor minimum comfortable width: `480px` (within the split pane).

---

## 4. "Anti-AI Slop" Interaction Patterns

How we prove this is premium software, not a generic wrapper:

1.  **Intentional Friction:** Don't auto-trigger everything. Let users *commit* to an action (e.g., "Start Interview" is a slide-to-confirm, not just a click).
2.  **Visible System State:** Never show a spinning loader for >2s without text explaining *what* is happening (e.g., "Allocating sandbox...", "Compiling Java environment...").
3.  **Human-Scale Motion:** Transitions should use "spring" physics (Framer Motion), not linear tweens. Things should feel like they have weight.
4.  **Distinct "AI" Voice:** When the AI speaks/prints, it should have a visually distinct container (e.g., a "glass" texture or specific border) to separate it from system UI.

---

## 5. Spacing & Layout

- **Density:** High density in the *Code Editor* (maximise visible lines), Medium-Low density in *Dashboard/Summary* (readability).
- **Rounding:**
    - Buttons: `rounded-md` (6px) or `rounded-full` (capsule).
    - Cards: `rounded-xl` (12px-16px).
    - *Avoid:* Perfectly square corners (too brutalist) or overly squircle (too playful).
- **Shadows:** Soft, diffused shadows (`shadow-sm`, `shadow-md`) using colored shadow layers (e.g., a shadow with a hint of brown/clay) rather than pure black.

---

## 6. Accessibility (A11y)

- **Contrast:** All `text-ink` on `bg-paper` must meet WCAG AAA.
- **Motion:** Respect `prefers-reduced-motion`.
- **Screen Readers:** All charts (Summary page) must have rigorous `aria-label` descriptions or data-table fallbacks.
