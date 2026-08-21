# LAYOUT SKILL

**Companion to FRONTEND-SKILL.md.** That file says *what to display and what data to collect.* This file says *where things go on the screen and why.*

Read both before building any screen.

---

## 0 · THE ONLY QUESTION THAT MATTERS

Before choosing any layout, answer this:

> **When this person opens this screen, what question is already in their head?**

The layout's job is to answer that question **without scrolling, without navigating, and without reading anything else first.** Everything below is derived from that.

Two people use this system, and they arrive with completely different questions.

---

## 1 · THE VOLUNTEER / BENEFICIARY — the moment they open it

**Their physical reality:** a mid-range Android phone, held in one hand, thumb-driven. They arrived from a WhatsApp link the NGO sent. They may be on a bus, in a queue, or being talked to. Mobile data, possibly capped. Possibly reading Marathi or Hindi more comfortably than English.

**Their mental state, first visit:** *"Am I in the right place, and what do I do?"*
**Their mental state, every visit after:** **"What is happening with my thing?"**

**Three behavioural facts that decide the layout:**

1. **They will not explore.** They will not scroll to discover. They will not open a menu to look around. If the answer isn't visible, they leave and call the office — which is the exact behaviour the product exists to eliminate.
2. **They have low trust in web forms.** The interface has to look like it belongs to a real organisation and like their submission actually went somewhere.
3. **They will be interrupted.** Any flow must survive being abandoned mid-way and resumed.

### Layout consequences — non-negotiable

- **The answer to their question is above the fold.** No scroll to see status.
- **The primary action sits at the BOTTOM of the screen**, in the thumb zone. Not the top. Full-width.
- **No navigation chrome.** No sidebar, no hamburger, no tab bar unless there are genuinely 3+ destinations. Chrome steals space from the one thing that matters.
- **One screen, one job, one primary button.**
- **Returning users land on status, never on a menu or a dashboard.**
- **Language toggle top-right on the first screen** — small, but present before they read anything.
- **Vertical rhythm is generous.** This is not the place for density.

### The beneficiary shell

```
┌─────────────────────────────┐
│ [NGO name]        EN हिं मरा│  ← thin bar, 48px, nothing else
├─────────────────────────────┤
│                             │
│                             │
│   ONE THING                 │  ← the question, answered
│   large, unmissable          │     display-size type
│                             │
│   supporting line            │
│                             │
│                             │
│         (breathing room)     │
│                             │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │    PRIMARY ACTION     │  │  ← thumb zone, full width, 56px
│  └───────────────────────┘  │
│      secondary, text-only    │
└─────────────────────────────┘
```

**Max content width 480px, centred.** On a desktop browser it should look like a phone screen in the middle of the page — that is correct, not a bug. It signals the intended device.

---

## 2 · THE NGO STAFF MEMBER — the moment they open it

**Their physical reality:** a laptop or a shared office desktop, at a desk, often with a phone call happening or about to. Full keyboard. Reliable network.

**Their mental state, every single time:** **"What needs me today?"**

Not *"let me explore the data."* They arrived mid-task, to do a specific thing, and they will be interrupted before they finish it.

**Three behavioural facts that decide the layout:**

1. **They do the same action forty times.** Every extra click is multiplied by forty.
2. **They use this a few times a week, not hourly.** They will **not** memorise icons. This matters enormously — it rules out icon-only navigation.
3. **They get interrupted constantly.** They need to be able to look at the screen after two minutes on the phone and know where they are.

### Layout consequences — non-negotiable

- **They land on the work queue, not a chart dashboard.** The first screen answers "what needs me" with counts and a filtered list. Charts are a separate destination they visit occasionally.
- **Sidebar navigation with visible text labels.** Not icon-only.
- **Filters persistent and visible**, never behind a "Filters" button on desktop.
- **The row action is reachable from the list.** Don't force a navigation to a detail page to approve something.
- **Breadcrumb or a clear page title**, so an interrupted person re-orients in one glance.
- **Density is correct here.** Sixty rows means sixty rows.

### The staff shell

```
┌────────────┬──────────────────────────────────────────────┐
│            │  Requests            [search]      [user ▾]  │ ← top bar: global only
│  NGO       ├──────────────────────────────────────────────┤
│            │  23 pending · 4 overdue · 61 this month      │ ← counts, top-left = F-pattern
│  ▸ Queue   ├──────────────────────────────────────────────┤
│    Requests│  [Status ▾][Category ▾][Area ▾][Date ▾]      │ ← filters always visible
│    Overdue ├──────────────────────────────────────────────┤
│            │  ☐ Name        Category   Area    Status     │
│  ▸ People  │  ☐ Sunita K.   Education  Kothrud PENDING    │
│    Volunt. │  ☐ Rahul J.    Health     Hadapsar APPROVED  │
│    Mentors │  ☐ Prerna S.   Education  Wagholi PENDING    │
│            │  …                                            │
│  ▸ Insights│                                               │
│    Reports │                                               │
│            ├──────────────────────────────────────────────┤
│  ─────     │  3 selected   [Approve] [Reject]             │ ← appears on selection
│  Log out   │                                               │
└────────────┴──────────────────────────────────────────────┘
   240px
```

### Why sidebar and not top navigation

Top navigation works for five to seven destinations. An operations tool has fifteen to forty sections, and a horizontal nav either truncates into a hamburger — defeating the purpose — or spawns a second tier of tabs. Both add clicks and hide features. A sidebar stays visible, so the user never wonders how to get back, and it accommodates nested groups cleanly.

**Sidebar specification:**
- **240–280px wide**, fixed
- **Item height ~36px** — deliberately smaller than the 44–48px mobile touch target, because this is a desktop pattern
- **Three levels maximum.** Primary sections at 15–16px, slightly bolder, with an obvious active state
- **Labels always visible.** Icon-only rails suit tools people live in daily; a coordinator who opens this twice a week will not have memorised your icons. **Clarity beats compactness here**
- **Global utilities — search, account, notifications — go in the top bar**, not the sidebar, so they're available on every screen
- **Below 768px the sidebar pattern breaks down entirely.** Hide it and switch to a bottom tab bar or a slide-over drawer

**One warning worth stating plainly:** copying a sidebar from a product you admire without checking whether the user behaviour matches is a beginner mistake. Notion's left rail solves a different problem from a reporting console, which solves a different problem from an NGO's weekly work queue.

---

## 3 · AUTHENTICATION LAYOUT — and an important correction

You asked about breaking login into multiple pages with a progress bar. **The research says don't**, and the reason is worth understanding because it applies everywhere.

**Multi-step layouts help long forms and actively hurt short ones.** Below roughly six fields, a single-page form outperforms a multi-step equivalent, because the added navigation creates friction that wasn't there to begin with. A login is one or two fields. Splitting it adds steps and removes nothing, and **a progress bar on a two-screen login implies length where there is none** — which is worse than having no bar at all.

**However — phone-OTP login is genuinely two screens**, and that's fine, because it isn't chunking. The one-time code does not exist until the phone number has been submitted. That's **sequential necessity**, not progressive disclosure. No progress bar.

### Login layout (staff)

```
┌─────────────────────────────┐
│                             │
│      [NGO name]             │
│      Staff sign-in          │
│                             │
│      Phone number           │  ← label ABOVE the field
│      ┌───────────────────┐  │
│      │                   │  │
│      └───────────────────┘  │
│                             │
│      Password               │
│      ┌───────────────────┐  │
│      │              show │  │  ← show/hide, not a second field
│      └───────────────────┘  │
│                             │
│      ┌───────────────────┐  │
│      │     Sign in       │  │
│      └───────────────────┘  │
│                             │
│      Forgot password?       │
└─────────────────────────────┘
```

**Single column, centred, max 400px.** Nothing else on the screen — no marketing panel, no illustration, no testimonial. A login screen has one job.

### OTP layout (beneficiary)

Two screens. Screen one: phone number, one field, one button. Screen two: the code.

```
┌─────────────────────────────┐
│  ←                          │  ← back must work, and must keep the number
│                             │
│   Enter the code            │
│   Sent to 98765 43210       │  ← echo it back, so they can check
│                             │
│   ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐  │  ← autofocus, auto-advance,
│   └──┘└──┘└──┘└──┘└──┘└──┘  │     auto-submit on last digit
│                             │
│   Resend in 0:24            │  ← visible timer, or they tap six times
│                             │
└─────────────────────────────┘
```

Numeric keypad on focus. One-time-code autofill enabled so the phone offers the code from the SMS.

---

## 4 · MULTI-STEP FORMS — where they DO belong, and how

Use multi-step for **registration and application flows** — the ones with eight to fifteen fields. Not for login, not for a three-field lookup.

Nielsen Norman Group's guidance names the variable most people skip: **"The order of the questions should primarily minimize the effort necessary to fill in the form."** Order first, chunking second.

### The rules

**Step count: 3 to 4. Never more than 5.** Past that, completion falls off regardless of how well it's built.

**Fields per step: 3 to 5 maximum.** Only the current step's fields are visible — showing all fifteen with step one highlighted defeats the entire point.

**Step 1 must be the easiest thing in the flow.** Ideally one multiple-choice question anyone can answer in two seconds — *"What kind of help do you need?"* with three large buttons. **Never** open with "enter your name, phone, email and address." The first screen is the highest-stakes moment in the flow; if they clear it, they overwhelmingly finish.

**Each step must be a recognisable unit** — "about you," "what you need," "confirm." **Arbitrary groupings break trust.** When fields are bundled for no visible reason, users start wondering why you're asking and whether the form is longer than stated.

**Progress indicator — get this right, it cuts both ways:**
- **Label the phases, don't just count them.** "Your details → What you need → Confirm" beats "Step 2 of 4," which beats a bare percentage.
- **Never reveal a large number of steps.** "Step 1 of 9" causes immediate abandonment from people who didn't know the form was that long. A bar that reveals too much is worse than no bar.
- **Early progress must feel fast.** A bar that jumps to a third after one easy question motivates. One that inches forward increases abandonment and makes people report a worse experience.
- **Thin rule across the top**, from the token colours, not a heavy stepper component with circles and connectors.
- **If you skip a step conditionally, say so** — otherwise people click at a step in the indicator that will never arrive.

**Back navigation is mandatory, and it must not wipe data.** If going back loses their answers, many abandon rather than retype. **Save on every step transition.**

**Ask sensitive things late.** Income bracket, personal circumstances, anything that feels intrusive goes after they've already invested effort.

### The form screen shell

```
┌─────────────────────────────┐
│ ▔▔▔▔▔▔▔▔░░░░░░░   EN हिं मरा│  ← thin progress rule + language
│ Your details                 │  ← phase label, not "Step 2 of 4"
├─────────────────────────────┤
│  ←                          │
│                             │
│   What is your name?        │  ← the question as a heading
│                             │
│   Full name                 │  ← label above
│   ┌───────────────────────┐ │
│   │                       │ │
│   └───────────────────────┘ │
│   (space reserved for error)│  ← reserved, so nothing shifts
│                             │
│   Mobile number             │
│   ┌───────────────────────┐ │
│   │                       │ │
│   └───────────────────────┘ │
│                             │
├─────────────────────────────┤
│  ┌───────────────────────┐  │
│  │       Continue        │  │  ← thumb zone
│  └───────────────────────┘  │
└─────────────────────────────┘
```

**Single column, always.** Multi-column forms are measurably slower to complete and worse on mobile. **Labels above fields** — top-aligned labels are the fastest position in eye-tracking studies. **Validate on blur, not at submit** — inline validation is one of the most reliable improvements available and it costs nothing.

---

## 5 · PAGE ARCHETYPES

Every screen in this product is one of six. Identify which before you start.

### A · List / work queue *(staff)*
```
Page title + counts  →  filters  →  table  →  bulk action bar
```
Counts top-left. Filters horizontal, always visible, never behind a button on desktop. Sticky table header. Row hover. Whole row navigates; the primary action is a button inside the row. Bulk bar slides up on selection. Pagination or infinite scroll at the bottom — not both.

### B · Detail *(staff)*
```
Breadcrumb  →  title + status + primary actions (top-right)  →  two columns: facts | timeline
```
Actions top-right where the eye lands after reading the title. The status history timeline goes in the right column — it's the highest-value cheap element on this page. Back to the list must return to the **same filter state**; losing filters on back is a real irritation at forty repetitions.

### C · Dashboard *(staff)*
```
3 big numbers  →  1 chart + caption  →  supporting table
```
**F-pattern:** people scan top-left, across, then down the left side. **The single most important number goes top-left, largest type, highest contrast.** Secondary metrics top-right at medium emphasis. Detail in the lower half.

**Avoid the "democratic layout" trap** — giving every metric equal space means none of them reads as important. The primary number should be visually two to three times the secondary ones.

**Working memory holds five to nine things.** Three numbers and one chart is the target. Past about a dozen metrics, engagement drops sharply and the dashboard becomes wallpaper.

> A dashboard is not a report. It's a cockpit. Every element has to earn its space by helping someone make a decision or take an action.

### D · Form *(beneficiary)*
Covered in §4.

### E · Status *(beneficiary)*
```
One card, filling the screen: status stamp → reference → plain sentence → what next → share
```
Nothing else. No navigation. This is the single most-visited screen by the people the product exists for, and its entire job is answering one question in under a second.

### F · Empty / error *(both)*
Same footprint as the populated version, so nothing shifts when data arrives. Centred, vertically. One line of explanation, one action. A blank rectangle is not an empty state.

---

## 6 · GRID, SPACING, BREAKPOINTS

**Spacing scale:** 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. Never an off-scale value.

| | Beneficiary | Staff |
|---|---|---|
| Screen padding | 24px | 24–32px |
| Between fields | 24px | 16px |
| Between sections | 32px | 24px |
| Table cell padding | — | 8–12px |
| Max content width | 480px | 1440px |

**Breakpoints:** `<768px` mobile · `768–1024px` tablet · `>1024px` desktop.

- **Beneficiary screens are designed at 375px** and simply centre on larger screens. Don't spread a single-column flow across a desktop width.
- **Staff screens are designed at 1280px.** Below 768px the sidebar becomes a drawer and tables become stacked cards — but a coordinator on a phone is an edge case, not the design target.
- **Desktop grid: 12 columns.** Primary content 8, sidebar or aside 4.

**Whitespace groups things.** Related items close together, unrelated items far apart. This does more for comprehension than borders, and it's free.

---

## 7 · NAVIGATION RULES

| Context | Pattern |
|---|---|
| Beneficiary, 1–2 destinations | **None.** Back arrow only |
| Beneficiary, 3+ destinations | Bottom tab bar — thumb-reachable |
| Staff desktop | Left sidebar, labels visible, 240–280px |
| Staff mobile | Bottom tabs or slide-over drawer |
| Global utilities | Top bar, every screen |
| Deep hierarchy | Breadcrumb under the top bar |

**Never a hamburger menu on a beneficiary screen.** Hidden navigation reduces discoverability and adds cognitive load — and for a user who won't explore, hidden means non-existent.

**Nesting maximum: two levels.** Deep hierarchies are where low-literacy users abandon tasks, and "go up a level" is a metaphor that reliably confuses.

**Active state must be unmistakable.** Not a slightly different shade — a clear fill or a left border plus a weight change.

---

## 8 · LAYOUT ANTI-PATTERNS

| Never | Why |
|---|---|
| **A marketing landing page** | No hero, no features grid, no scroll reveals. The front door is a login or the first task screen |
| **A progress bar on a 2-step flow** | Implies length where there is none. Worse than nothing |
| **"Step 1 of 9"** | Revealing a long form causes immediate abandonment |
| **Splitting a 3-field form into steps** | Adds friction with no benefit. Below ~6 fields, single page wins |
| **A back button that wipes entered data** | The most reliable way to lose someone mid-flow |
| **Icon-only sidebar** | Staff use this weekly, not hourly. They haven't memorised your icons |
| **Hamburger on beneficiary screens** | Hidden = non-existent for a user who won't explore |
| **Primary action at the top on mobile** | Out of the thumb zone |
| **Landing staff on a chart dashboard** | They came to do work, not to browse data |
| **Four stat cards of equal size** | Democratic layout. Nothing reads as important |
| **Filters behind a button on desktop** | Filtering is the feature, not a secondary option |
| **Modals on beneficiary screens** | Small viewport, focus traps, dismissal confusion. Use a full screen |
| **Two-column forms** | Measurably slower, worse on mobile |
| **Labels beside or inside fields** | Top-aligned is fastest. Placeholder-as-label vanishes on focus |
| **Losing filter state on back** | Trivial once, infuriating forty times |
| **Blank rectangle as an empty state** | Reads as broken |
| **Reusing the beneficiary layout for a staff table** | Collapses the whole design argument. It's the tempting 2 PM shortcut |
| **Sidebar copied from a product with different user behaviour** | Solves someone else's problem |

---

## 9 · WHEN GIVEN A SCREEN TO BUILD

Do this before writing anything:

1. **State the user.** Beneficiary or staff.
2. **State the question in their head** when they open it.
3. **Name the archetype** from §5 — list, detail, dashboard, form, status, or empty.
4. **Name the shell** — beneficiary (§1), staff (§2), or auth (§3).
5. **Sketch the vertical order in text**, top to bottom, before any markup. *"Progress rule → phase label → question heading → two fields → continue button in thumb zone."*
6. **Say where the primary action sits** and why.
7. **If it's a form: state the field count**, and therefore whether it's single-page or multi-step. Under six fields → single page. Say so explicitly.
8. **Confirm in one line** what you understand the layout to be, and wait.
9. Then build.
10. Run §10.

**If a request conflicts with this file, say so and ask.** Don't silently follow either.

---

## 10 · DEFINITION OF DONE

- [ ] The question in the user's head is answered above the fold, without scrolling
- [ ] Correct shell for the correct user
- [ ] One primary action per screen, in the thumb zone on mobile
- [ ] Single-column forms, labels above fields, error space reserved
- [ ] Multi-step only if >6 fields · 3–5 steps · phase labels not raw counts · back preserves data
- [ ] Staff screens land on work, not charts
- [ ] Sidebar labels visible, active state unmistakable, ≤2 levels deep
- [ ] Filters visible on desktop, not hidden behind a button
- [ ] Dashboard: primary number top-left, 2–3× larger than secondary, ≤3 numbers, 1 chart
- [ ] Empty and error states occupy the same footprint as the populated version
- [ ] Beneficiary screens verified at 375px · staff at 1280px
- [ ] Spacing entirely on the 4px scale
- [ ] Back navigation preserves state — filters, form data, scroll position
- [ ] No hamburger on beneficiary screens, no icon-only sidebar, no modals on mobile

---

## THE FIVE THINGS THAT MATTER MOST

1. **Answer the question in their head, above the fold.** Beneficiary: *"what's happening with my thing?"* Staff: *"what needs me today?"*
2. **Primary action in the thumb zone on mobile. Top-left for the most important number on desktop.** Both follow from how people actually use the device.
3. **Multi-step is for long forms only.** Under six fields it makes things worse. Login is two fields — don't split it, and don't put a progress bar on it.
4. **Sidebar with visible labels for staff.** They use this weekly, not hourly. Clarity beats compactness.
5. **Back must never destroy state.** Not form data, not filters, not scroll position. It's the cheapest way to lose someone, and the easiest thing to get right.