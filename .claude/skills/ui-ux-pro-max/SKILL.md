---
name: ui-ux-pro-max
description: >-
  Design and build production-grade, beautiful, accessible user interfaces. Use
  this skill BEFORE writing any UI code — components, pages, layouts, landing
  sections, forms, dashboards, navigation, modals — or when styling, theming,
  choosing colors/typography/spacing, adding motion, or reviewing/refactoring an
  existing interface for visual quality, consistency, responsiveness, or
  accessibility. Triggers: "make it look good/professional/polished", "design",
  "UI", "UX", "landing page", "component", "layout", "style this", "theme",
  "dark mode", "responsive", "animation", "hero section", "redesign".
---

# UI/UX Pro Max

Build interfaces that look like they came out of a top design studio: intentional,
consistent, accessible, and alive. This skill is a decision framework, not a
component library. Apply it to whatever stack is in play (React, plain
HTML/CSS, Vue, Svelte, Tailwind, CSS-in-JS).

## Operating procedure

1. **Read the room first.** Before writing code, look at the existing project:
   its framework, its CSS approach (tokens? Tailwind? plain CSS?), existing
   colors/fonts/spacing, and the *tone* of the product. New UI must feel like it
   belongs. Never introduce a second design language.
2. **Establish or reuse tokens.** If the project has design tokens (CSS custom
   properties, a theme file, a Tailwind config), extend them. If it doesn't and
   the work is non-trivial, create a small token set first (see Tokens below).
   Never scatter raw hex/px values across components.
3. **Design the states, not just the happy path.** Every interactive element
   needs: default, hover, focus-visible, active, disabled, and (where relevant)
   loading, empty, and error. UI that only handles the default state is not done.
4. **Build responsive from the start.** Design mobile-first; layouts must not
   break between ~360px and ultra-wide. Never rely on fixed pixel widths for
   containers.
5. **Verify.** After building, check it in the real app (see `/run` or the
   `verify` skill) at a narrow and wide viewport, in light and dark if both
   exist. Tab through it with the keyboard. Fix what looks off.

## The non-negotiables (get these wrong and nothing else matters)

- **Spacing rhythm.** Use one spacing scale (4px base: 4, 8, 12, 16, 24, 32, 48,
  64, 96). Consistent spacing reads as "designed"; ad-hoc spacing reads as
  "amateur." Give content room to breathe — generous whitespace beats cramming.
- **Type scale + hierarchy.** Pick a modular scale (e.g. 12, 14, 16, 20, 24, 32,
  48). Body text 16px min. One clear visual hierarchy per screen: a single
  dominant element, then supporting levels. Line-height ~1.5 for body, ~1.1–1.25
  for headings. Line length 45–75 characters (`max-width: 65ch`).
- **Restrained color.** One brand/accent color used sparingly for the primary
  action and key highlights, a neutral gray ramp for everything structural, plus
  semantic colors (success/warn/error). Most of the screen should be neutral;
  color earns attention *because* it's rare.
- **Contrast.** Body text ≥ 4.5:1, large text and UI components ≥ 3:1 (WCAG AA).
  Never gray-on-gray placeholder text as real content.
- **Alignment & grid.** Everything aligns to a grid. Optical alignment beats
  mathematical when they disagree. No orphaned, randomly-placed elements.
- **Focus visibility.** Never remove focus outlines without replacing them.
  Use `:focus-visible` for a clear, on-brand focus ring.

## Tokens (the foundation)

When creating tokens, prefer CSS custom properties so theming and dark mode are
trivial. Minimum viable set:

```css
:root {
  /* Color — neutral ramp + one accent + semantics */
  --bg: #ffffff;
  --surface: #f7f7f8;
  --border: #e4e4e7;
  --text: #18181b;
  --text-muted: #71717a;
  --accent: #6d28d9;          /* one brand color */
  --accent-contrast: #ffffff;
  --success: #16a34a;
  --warning: #d97706;
  --danger: #dc2626;

  /* Spacing — 4px base scale */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px;

  /* Radius, elevation, motion */
  --radius-sm: 6px; --radius-md: 10px; --radius-lg: 16px; --radius-full: 999px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.06);
  --shadow-md: 0 4px 16px rgba(0,0,0,.08);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.12);
  --ease: cubic-bezier(.2,.8,.2,1);
  --dur-fast: 120ms; --dur: 200ms; --dur-slow: 400ms;

  /* Type */
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --fs-xs: .75rem; --fs-sm: .875rem; --fs-base: 1rem; --fs-lg: 1.25rem;
  --fs-xl: 1.5rem; --fs-2xl: 2rem; --fs-3xl: 3rem;
}

[data-theme="dark"] {
  --bg: #0b0b0f; --surface: #17171c; --border: #27272e;
  --text: #f4f4f5; --text-muted: #a1a1aa; --accent: #a78bfa;
  --shadow-sm: 0 1px 2px rgba(0,0,0,.4);
  --shadow-md: 0 4px 16px rgba(0,0,0,.5);
  --shadow-lg: 0 12px 40px rgba(0,0,0,.6);
}
```

Dark mode is not "invert the colors": raise surfaces with lighter grays (not pure
black), soften shadows into subtle glows/elevation, and slightly desaturate/lift
the accent so it doesn't vibrate.

## Color guidance

- Build a **neutral ramp** (9–11 steps) and one **accent ramp**. Derive states
  (hover = one step darker/lighter, not a random new color).
- Backgrounds layer: `--bg` (page) → `--surface` (cards) → borders separate them.
- Avoid pure `#000`/`#fff` for large areas — use near-black/near-white; it's
  gentler and looks more considered.
- Gradients: subtle and purposeful (hero backdrops, accents), never rainbow.
- Test every text/background pair for contrast before shipping.

## Typography guidance

- Two typefaces max (often one is enough). Pair a characterful display face with
  a neutral body face only if it serves the brand.
- Set `font-feature-settings` where useful; enable kerning/ligatures.
- Tighten letter-spacing slightly on large headings (`-0.02em`), loosen on
  all-caps labels (`0.05em`).
- Establish rhythm: consistent margins between headings and body (use spacing
  tokens, e.g. heading `margin-block: var(--space-8) var(--space-3)`).

## Layout & composition

- **Grid systems:** use CSS Grid for page layout, Flexbox for component-internal
  alignment. `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))` is a
  workhorse for responsive card grids.
- **Container widths:** cap reading content ~65ch; cap full-width sections
  ~1200–1440px with side padding that scales (`clamp(16px, 5vw, 64px)`).
- **Visual hierarchy:** size, weight, color, and spacing create hierarchy — use
  the fewest levers needed. Proximity groups related things; whitespace separates.
- **Consistency:** repeated patterns (cards, list rows) must be truly identical.
  Reuse components; don't hand-tune each instance.

## Motion & micro-interactions

Motion should clarify, not decorate. Rules:

- Animate `transform` and `opacity` (GPU-friendly); avoid animating layout props.
- Durations: 120–200ms for UI feedback (hover, press), 300–500ms for entrances.
- Use a consistent easing token (`--ease`). Ease-out for entering, ease-in for
  leaving.
- Every hoverable/clickable element gets a subtle transition (color, transform,
  shadow). Buttons should feel tactile: slight lift on hover, press-down on active.
- **Respect `prefers-reduced-motion`** — disable or reduce non-essential motion:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important;
    transition-duration: .01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Scroll-reveal, parallax, and staggered entrances are great for landing/portfolio
  pages — keep them subtle and performant. If the project already uses a motion
  library (Framer Motion / `motion`, GSAP), use it rather than adding another.

## Accessibility (build it in, don't bolt it on)

- Semantic HTML first: `<button>` for actions, `<a>` for navigation, real
  headings in order, `<nav>/<main>/<footer>` landmarks, `<label>` for every input.
- Keyboard: everything operable without a mouse; visible focus; logical tab order;
  Escape closes overlays; focus trapped in modals and restored on close.
- ARIA only to fill gaps native HTML can't (e.g. `aria-expanded`,
  `aria-live` for async updates, `aria-label` for icon-only buttons). Don't ARIA
  what HTML already conveys.
- Images: meaningful `alt`; decorative images `alt=""`.
- Touch targets ≥ 44×44px. Don't convey meaning by color alone.

## Components: quick specs

- **Buttons:** clear primary/secondary/ghost hierarchy; adequate padding
  (`var(--space-3) var(--space-6)`); hover/active/focus/disabled states; loading
  state with spinner + disabled; never more than one primary per view region.
- **Forms:** label above input; helper text below; inline validation on blur;
  error state with icon + message (not color alone); generous spacing; group
  related fields.
- **Cards:** consistent padding, radius, and elevation; hover lift only if
  clickable; don't nest heavy shadows.
- **Modals/dialogs:** backdrop, focus trap, Escape to close, scroll lock, entrance
  animation, `role="dialog"` + `aria-modal="true"` + labelled title.
- **Nav:** clear current-page indicator; responsive (hamburger/drawer on mobile);
  sticky headers should be compact and not eat vertical space.
- **Empty/loading/error states:** design them. Skeletons over spinners for
  content; helpful empty states with a next action; friendly, actionable errors.

## Polish checklist (run before calling UI done)

- [ ] All spacing from the scale; nothing looks cramped or arbitrarily placed
- [ ] Consistent type scale and clear hierarchy; body ≥16px
- [ ] Color restrained; accent used sparingly; AA contrast everywhere
- [ ] Every interactive element has hover / focus-visible / active / disabled
- [ ] Loading, empty, and error states exist where relevant
- [ ] Responsive from ~360px to ultra-wide; no horizontal scroll; no overflow
- [ ] Keyboard-navigable; visible focus; modals trap+restore focus
- [ ] Dark mode correct if the app supports it
- [ ] Motion subtle, GPU-friendly, and reduced-motion respected
- [ ] Images have alt text; icons have labels; landmarks present
- [ ] Verified live in the running app at narrow + wide viewports

## Anti-patterns to avoid

- Rainbow of accent colors; every element a different hue.
- Inconsistent spacing/radii/shadows across similar components.
- Tiny low-contrast gray text as primary content.
- Removing focus outlines with nothing in their place.
- Center-aligning long paragraphs; ultra-wide unreadable line lengths.
- Heavy drop shadows everywhere ("floating card soup").
- Animations that block interaction, jank on scroll, or ignore reduced-motion.
- Fixed-pixel layouts that break on mobile.
- Copy-pasting a component and hand-tweaking each copy instead of parameterizing.

When a task is ambiguous ("make it look good"), infer the product's tone from
existing code and content, propose a clear direction, and build it — then verify
and iterate.
