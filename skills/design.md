# Design system

Fill this in together as a team in the first 15 minutes of the hackathon, right after the PS drops. Once filled, every teammate pastes/references this file in their Claude conversations so all four of you generate visually consistent components.

## Brand
- Project name: SevaSahayog Volunteer Experience Platform (working title — easy to rename later, just a doc header)
- One-line tagline: Turning volunteer voices into evidence-backed action.

## Colors (real hex codes, decided as a team)
- Primary:      #016B61   (deep teal — main buttons, links, active nav/tab states, headings on light bg)
- Secondary:    #70B2B2   (medium teal — secondary buttons, icons, borders, hover accents)
- Accent:       #E5E9C5   (pale yellow-green — badges, tags, rating-star fill, small highlights)
- Tint/Highlight: #9ECFD4 (light teal — chips, table header row, selected/hover row background, small stat tiles. Not one of the template's original rows, but it's one of our 4 brand colors, so it gets a real job: small bounded UI, not big surfaces.)
- Background:   #F5F9F8   (near-white with a whisper of teal — full-page backdrop)
- Surface/card: #FFFFFF   (pure white — cards, forms, tables sit on this so feedback text/data stays maximally legible)
- Text primary: #10241F   (near-black, teal-leaning — body copy, headings)
- Text muted:   #4B6B66   (muted teal-gray — captions, timestamps, helper text, secondary table columns)
- Border/divider: #DCEAE8 (derived light neutral — card borders, input borders, table row dividers)
- Success:      #22c55e  (kept default — deliberately distinct from brand teal so a "submitted!" state doesn't blend into the primary color)
- Error:        #ef4444  (kept default, same reasoning)

Why Background ≠ Surface: the page backdrop gets a faint teal tint (#F5F9F8) so it isn't stark white-on-white, while cards/forms/tables stay pure white (#FFFFFF) so volunteer comments, ratings, and admin data tables stay legible. #9ECFD4 shows up in smaller, bounded UI (chips, table headers, hover states) rather than large card backgrounds, so it stays a visible accent instead of overwhelming the table/filter-heavy Admin and Corporate SPOC screens.

## Typography
- Font family: **Inter** (Google Fonts), fallback `system-ui, -apple-system, sans-serif`
  - Why: built for UI/screens — tall x-height, open counters, stays legible at small sizes (table cells, labels, captions) and has strong tabular-numeral support, which matters since Admin/SPOC screens are rating/stat/table-heavy. Free, fast off Google Fonts, and was already the placeholder here so nothing structural changes.
  - Loaded once via `@import` at the top of `styles/variables.css`.
- Heading sizes: h1 32px / h2 24px / h3 20px
- Body text size: 16px (added `--font-size-sm: 14px` for table cells, helper text, badges — needed immediately given how table/label-heavy the admin and SPOC views are)
- Font weights used: 400 (body/regular UI text) and 600 (headings, button labels, active nav, emphasis)

## Spacing scale
Stick to multiples of 4px only: 4, 8, 12, 16, 24, 32, 48. Don't invent one-off values like 13px or 22px.

## Component styles — agreed, all four of you use the same
- **Buttons**: rounded-md (8px). Primary = filled `--color-primary` bg, white text. Secondary = transparent bg, 1px `--color-primary` border, `--color-primary` text. Hover: primary darkens to `--color-primary-hover` (#01524A); secondary fills with `--color-tint` at low opacity. Disabled: 50% opacity, no pointer events. See [Button.jsx](Button.jsx) / [Button.module.css](Button.module.css).
- **Cards**: white surface, 1px `--color-border` border, radius-md (8px), padding `--space-6` (24px), subtle shadow `0 1px 3px rgba(1,107,97,0.08)` (tinted with brand teal instead of flat black — barely-there depth).
- **Inputs**: 1px `--color-border`, radius-sm (4px), padding `--space-2` `--space-3`. Focus: border becomes `--color-primary` + a 3px `--color-tint` ring (box-shadow, not outline). Error state: border `--color-error`, helper text below in `--color-error` at `--font-size-sm`.
- **Navbar**: top bar (not sidebar) — one shared bar reused across Volunteer/Admin/Corporate SPOC views for speed and consistency. White surface bg, 1px bottom `--color-border`. Active link: `--color-primary` text, 600 weight, 2px bottom border in `--color-primary`.
- **Icon set**: lucide-react — only icons from this library, no mixing icon sets.

## Ratings (project-specific — every feedback submission includes a rating, PS item F)
- Star rating input/display: filled star = `--color-accent` (#E5E9C5) fill with `--color-primary` outline for contrast on white; empty star = `--color-border` outline only. Keeps ratings on-brand instead of reaching for a generic yellow/gold.

## Rules
- Every component must use these tokens — no one hardcodes a random hex color or px value outside this list.
- These tokens live as CSS custom properties in src/styles/variables.css (e.g. `--color-primary: #6366f1;`), imported once globally. Every component's Component.module.css file references them with `var(--color-primary)` instead of a hardcoded value — see the starter variables.css and the Button example for the pattern.
- When asking Claude to build a component, explicitly say "follow DESIGN.md and use the variables from styles/variables.css" in the prompt so it doesn't default to generic styling or invent its own colors.
