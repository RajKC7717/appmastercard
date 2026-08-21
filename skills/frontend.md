# FRONTEND SKILL

**Read this before writing any frontend code. Read it again at the start of every new session.**

---

## 0 · WHAT WE ARE BUILDING — never lose this

We are building an **operations system for an Indian NGO** in Pune, in one day, for a hackathon judged by senior Mastercard engineers.

**The NGO is one of three, and they work like this:**

| NGO | What they actually do |
|---|---|
| **Y4D Foundation** (Pune, pan-India) | Skill-training batches (Tally, Manual Insertion Operator) with placement tracking · free health camps · Miyawaki tree-plantation drives with corporate volunteers · digital & financial literacy sessions in schools · volunteer chapters across states |
| **Katalyst** (Mumbai/Pune, women in STEM) | A **4-year cohort programme** for engineering students from families earning ≤ ₹5 lakh · outreach at 51 partner colleges → orientation → application → written test + interview → enrolment · 600 hours of training across 72 modules · **1:1 mentorship**, mentors aged 30–60 with 5+ years' experience, meeting **twice a month for an hour** · a **scorecard** grading attendance at training and field visits, converted to a financial payout every six months |
| **Seva Sahayog** (Pune/Mumbai, volunteer-driven) | The **School Kit drive** — collect requirements from schools → procure → mass volunteer assembly events → distribute (71,786 kits, 943 schools, 5,641 volunteers in one year) · community learning centres · adolescent-girl programmes across 81 centres · menstrual health awareness · in-kind donation collection |

**Three truths that must shape every screen:**

1. **These processes run on paper registers, WhatsApp groups and Google Forms today.** We are not replacing software. We are replacing a spreadsheet and a phone call. The bar is "better than a WhatsApp group," not "better than Salesforce."
2. **The people using this are not office workers.** Beneficiaries are on cheap Android phones, on patchy mobile data, often reading Marathi or Hindi more comfortably than English, and frequently anxious about an outcome that matters to them.
3. **The NGO staff member is drowning in invisibility.** They cannot see who is waiting, what is stuck, or where the gaps are. Every admin screen exists to answer that.

**The scoring criterion this frontend is judged against, verbatim: *"how simply it serves real NGO end-users."*** Simplicity is on the rubric. It is not the consolation prize.

---

## 1 · THE TWO REGISTERS — decide this before every screen

Every screen belongs to exactly one register. **State which one before you start.** If it's ambiguous, it's a staff screen.

### Register A — Beneficiary / volunteer / applicant
Mobile-first. One task per screen. Flat navigation, no nested menus, no modals. Large type, large targets. Generous spacing. Status is the biggest thing on the screen. Plain language. Language toggle visible on the first screen.

*Why:* the HCI research on low-literacy users in India is consistent that deep menus are where people abandon tasks. Flat beats nested, every time.

### Register B — NGO staff / coordinator
Dense tables. Filters and search are the feature, not decoration. Counts that drive the next action at the top. Bulk actions. Optimistic updates with undo instead of confirmation modals. Desktop-first, tolerable on a tablet.

*Why:* a coordinator does this forty times a day. Density is correct here. Applying beneficiary spacing to an operations screen is a mistake, not a kindness.

### Keeping them apart
Separate directories. Only shared primitives (`Button`, `Input`, `Card`, `StatusStamp`, `EmptyState`, `Skeleton`, `Toast`) cross the boundary. **Never reuse a beneficiary card in a staff table** — under time pressure this is the tempting shortcut and it collapses the whole design argument.

The shared token file keeps them recognisably the same product. Layout, density and type scale keep them recognisably different tools.

---

## 2 · UNIVERSAL REQUIREMENTS — every screen, no exceptions

- **Four states on anything async:** loading (skeleton matching the content shape) · empty (with the action that fills it) · error (what happened + retry) · loaded. Built in the same commit as the screen, never "later."
- **Zero layout shift.** Reserve heights. Content jumping during a recorded demo reads as broken.
- **One status system.** A colour means one thing everywhere, forever, and always carries the word beside it.
- **Every input has a visible label above it.** Placeholder is a hint, never a label.
- **Every icon carries a text label.** Icon-only buttons are ambiguous for everyone and unusable for low-literacy users.
- **Visible focus on everything interactive.** Real `<button>` and `<a>`, never a clickable div.
- **One primary action per screen.**
- **Body ≥16px, ≥18px on beneficiary screens. Touch targets ≥48px.**
- **All colour, spacing and type from the token file.** No hex, no Tailwind colour utilities, no gradients.
- **Copy in active voice, sentence case.** The button verb matches its confirmation ("Approve" → "Approved"). Empty states are invitations, never "No data." Errors say what happened and what to do, and never apologise.

---

## 3 · FIELD STANDARDS — Indian NGO context

These are not preferences. Getting them wrong makes the product unusable for the actual users.

| Field | Standard | Why |
|---|---|---|
| **Phone** | 10 digits, the primary identifier, `inputMode="numeric"` | Many beneficiaries have no email. Phone is how the NGO already reaches them, and it's the natural deduplication key |
| **Name** | ONE full-name field | Indian naming conventions don't split reliably into first/last. Splitting produces bad data and irritated users |
| **Area / locality** | Dropdown from a fixed list, never free text | Free text destroys every filter and report. Use real Pune localities: Kothrud, Hadapsar, Wagholi, Pimpri, Chinchwad, Katraj, Bhosari, Kharadi, Warje, Baner, Hinjewadi, Yerawada |
| **Date of birth** | DOB, not age | Age goes stale. Compute it |
| **Gender** | Include it | Several real programmes are gender-specific — Katalyst is women-only, adolescent-girl programmes are too. Eligibility depends on it |
| **Family income** | Bracket dropdown, never an exact figure | Katalyst's real eligibility threshold is ≤ ₹5 lakh. Asking for an exact number is intrusive and gets guessed anyway |
| **College / school** | Dropdown of partner institutions + "Other" | Katalyst has 51 partner colleges; Seva Sahayog works with 943 schools. Free text makes reporting impossible |
| **Year of study** | Dropdown | Katalyst enrols first-year or direct-second-year only. Eligibility depends on it |
| **Email** | Optional, never required | Requiring it excludes exactly the people the NGO exists to serve |
| **Consent** | Explicit checkbox stating what it covers | Beneficiary data, photos and stories all need it. Never a pre-ticked box |
| **Language** | Preference stored and persisted | See §5 |
| **Reference code** | Human-readable, e.g. `VOL-2026-0147` | Someone reads this aloud over the phone to a coordinator. A UUID is unusable |

**Ask for the fewest fields that make the feature work.** Every field costs completions and creates a liability. If the brief doesn't require it, don't collect it — and be ready to say so.

---

## 4 · FEATURE CATALOGUE

When given a feature, find it here first. Each entry says what must exist — not how to build it.

---

### F1 · Volunteer / beneficiary registration
**Register A · ESSENTIAL in almost every brief**

*How it really works:* Seva Sahayog runs a rolling volunteer form; thousands sign up per drive. Y4D recruits through college chapters. Today it's a Google Form and the coordinator exports a spreadsheet.

**Fields:** name · phone · area · what they want to help with or need · availability (weekends / weekdays / either) if the brief mentions scheduling · consent checkbox.

**Must exist:** multi-step, one question per screen, with a thin progress rule · autosave between steps so a dropped connection doesn't cost eight fields · duplicate handling that returns the existing reference rather than creating a second record · **a confirmation screen showing a large reference code the user can screenshot, what happens next, and roughly when** · a way to return and check status later.

**The confirmation screen is the most important screen in this flow.** Teams treat it as a throwaway "Success!" toast. It is the thing that removes the anxiety the whole feature exists to address.

**Do NOT build:** account creation, password, email verification, profile photo upload, or a settings page.

---

### F2 · Status tracking / self-service lookup
**Register A · ESSENTIAL — this is the beneficiary's entire relationship with the system**

*How it really works:* today the applicant calls the office, repeatedly, and nobody can tell them anything. This is the single most common stated pain across all three NGOs.

**Inputs:** reference code + phone. Two fields is enough authorisation — no login.

**Must exist:** one large status card as the whole screen · plain-language status written for someone anxious ("Pending review — we'll notify you", not "Status: PENDING") · what happens next and when · a share button so they can send it on WhatsApp · a timeline of what has happened so far if `status_history` exists.

**Do NOT build:** a dashboard, notification preferences, or a document vault.

---

### F3 · Staff work queue (the admin list)
**Register B · ESSENTIAL — this is what the NGO actually asked for**

*How it really works:* the coordinator lives in a spreadsheet exported from a form. They cannot see what's overdue, what's unassigned, or where requests cluster.

**Must exist:** dense table · **filters for status, category, area and date range** — assume all four, every brief needs them · debounced search on name and reference · counts at the top that drive the next action ("23 pending · 4 over two weeks old") — two or three, not four vanity cards · sortable columns with a sensible default · row opens a detail view · **bulk selection with an action bar** · sticky header · loading, empty and error states.

**Do NOT build:** column customisation, saved views, a settings panel, CSV import.

---

### F4 · Review / approve / reject
**Register B · ESSENTIAL wherever a status exists**

*How it really works:* Katalyst reviews applications through a written test and an interview stage. Seva Sahayog approves volunteer sign-ups against event capacity. Both are currently a person scrolling a spreadsheet.

**Must exist:** approve and reject as distinct actions, with a **mandatory reason on reject** · **optimistic update with undo toast** — the row visibly moves between status groups and the count changes · a 409 handled gracefully when someone else already actioned it ("Already actioned by another staff member") · the status history appended on every transition · bulk approve.

**The row moving between groups with the count updating is the best five-second demo moment in the whole product.** Make it work.

**Do NOT build:** approval chains, delegation, or a comment thread.

---

### F5 · Event / drive / camp management with sign-up
**Register A for sign-up, B for management · IMPORTANT — the core of Seva Sahayog and Y4D**

*How it really works:* Seva Sahayog runs 109 school-kit assembly events in a season; a single corporate host brings 400+ volunteers. Y4D runs plantation drives and health camps. Coordination today is a WhatsApp broadcast and a paper attendance sheet, and **over-subscription is a real operational problem** — more people arrive than the venue holds.

**Event fields:** title · date and time · venue with area · capacity · type · description.

**Must exist:** an event list with date and remaining-slots visible · a sign-up action that **respects capacity** · a "full" state that is clearly communicated rather than a failed submit · the volunteer's own upcoming commitments · staff view of who has signed up per event · **attendance marking on the day, usable on a phone at a venue with one bar of signal**.

**Do NOT build:** calendar sync, recurring events, ticketing, maps.

---

### F6 · Attendance tracking
**Register B, phone-first · IMPORTANT when the brief mentions sessions, batches, camps or training**

*How it really works:* Katalyst's entire scorecard — and therefore each student's six-monthly payout — is driven by hours of training and field visits attended. Y4D tracks batch attendance across certificate courses. Both use paper sheets today, and the transcription is where errors enter.

**Must exist:** a session list · a participant list per session with a fast present/absent toggle · **works on a phone, one-handed, standing in a room** · a running count of marked vs total · an offline-tolerant path or at minimum a clear "not saved yet" state · attendance summary per participant across sessions.

**Do NOT build:** biometrics, geofencing, facial recognition, or a QR scanner unless the brief explicitly asks — QR *generation* is cheap and demos well; scanning is not.

---

### F7 · Application with eligibility screening
**Register A · IMPORTANT for Katalyst-shaped and Y4D-batch briefs**

*How it really works:* Katalyst screens on family income ≤ ₹5 lakh, gender, year of study and partner college — before a written test and interview. Screening ineligible applicants early saves staff hours.

**Must exist:** eligibility questions asked **first**, before the long form · an ineligible outcome that is **kind and explains why**, and where possible points to an alternative · multi-stage status visible to the applicant (submitted → shortlisted → test → interview → selected / waitlisted) · a waitlist state, because NGOs are genuinely reluctant to reject.

**Do NOT build:** document upload, test delivery, or interview scheduling — all are big features and none is the point.

---

### F8 · Mentor–mentee matching
**Register B · IMPORTANT for Katalyst-shaped briefs — and the strongest differentiator surface**

*How it really works:* Katalyst runs a pool of 500+ mentors, aged 30–60 with 5+ years' experience, each assigned one mentee (occasionally two), meeting twice a month for an hour, with a two-to-four-year commitment. Matching is done by staff from memory and spreadsheets.

**Must exist:** mentor list with capacity and current load visible · mentee list with unmatched clearly flagged · a match action · **the reason for the match shown inline on the card** — same city, overlapping availability, relevant field · meeting log per pair (date, duration, notes) · flag pairs with no meeting logged recently.

**The printed reason is the feature.** An opaque match is a spreadsheet with extra steps; a match that explains itself is something a coordinator can defend to a mentee who asks "why not me?" This is the single highest-value differentiator available in this catalogue.

**Do NOT build:** chat, video calling, or automatic scheduling.

---

### F9 · Donation — in-kind pledge to distribution
**Mixed · IMPORTANT for Seva Sahayog-shaped briefs**

*How it really works:* the School Kit drive has three distinct phases — collect requirements from schools, procure and receive material, assemble and distribute. A kit is a bag, ten notebooks, a drawing book and a compass box, sponsored at roughly ₹250–600. Donors pledge and then frequently **deliver a different quantity than pledged**, and today nobody records the difference.

**Must exist:** pledge form (item type, quantity, drop-off or pickup preference, centre) · reference code · **collection marking that records the quantity actually received, not a boolean** · inventory view by category and centre · institution request intake · allocation against requests · delivery confirmation.

**Partial fulfilment is the detail every other team will miss.** A boolean "collected" flag loses the exact information the NGO said they lack.

**Do NOT build:** payment gateways, barcode scanning, or logistics routing.

---

### F10 · Monetary donation
**Register A · OPTIONAL — build only if the brief explicitly requires it**

*How it really works:* all three NGOs take online donations; 80G tax exemption is a genuine motivator for Indian donors and the receipt is a legal document.

**Must exist if built:** three steps maximum · suggested amount chips each with a concrete equivalence ("₹600 funds one school kit") · trust markers next to the button, not in the footer · a processing state that says don't close the window · a failure state that preserves the amount and offers retry, never a dead end.

**Do NOT build:** a real payment integration. Mock it, and say so honestly in the pitch. Never store card details.

---

### F11 · Impact dashboard
**Register B · IMPORTANT — "we collect data but can't learn from it" is the near-universal complaint**

**Must exist:** **three big numbers at the top, maximum** — the ones that change what someone does next · **exactly one chart** · the chart labelled directly rather than with a legend · **a caption stating the finding, not the data** ("Requests cluster in three areas — two have no assigned volunteer", not "Requests by area") · an "as of" date, because an undated impact number is not credible · a date-range filter · a print view, because these get emailed to CSR partners.

**Do NOT build:** four charts, a chart library showcase, real-time updates, or export to Excel.

---

### F12 · Language toggle
**Register A · The highest-signal optional feature in the entire product**

*How it really works:* Seva Sahayog and Y4D serve Marathi-speaking communities in Pune. An English-only beneficiary interface isn't a minor gap; it is the gap.

**Must exist:** EN / हिंदी / मराठी · **on the first screen, visible, not in settings** · beneficiary flow only — staff screens stay English, and say so honestly · persisted across reloads · the document language attribute updated for screen readers · **no fixed-width buttons**, because Devanagari runs longer than English · a font that actually covers Devanagari, chosen before the first line of CSS.

---

### F13 · Notifications
**Both registers · OPTIONAL for the UI, ESSENTIAL as a concept**

*How it really works:* **WhatsApp is the notification layer in this context**, not email. Seva Sahayog coordinates 5,000+ volunteers through WhatsApp groups.

**Must exist:** a share/notify action producing a pre-filled WhatsApp deep link · a tap-to-call link on staff screens.

Deep links are roughly ten lines and open the actual apps on a phone. **Do NOT build** in-app notification infrastructure, a bell icon, or preference settings.

---

## 5 · ACCESSIBILITY AND LOW-BANDWIDTH — non-negotiable

These users are the reason the product exists, and the criterion is literally about serving them.

- Contrast ≥4.5:1 body, ≥3:1 large text and borders
- Status never communicated by colour alone
- Whole flow completable by keyboard, focus always visible
- Every image has alt text; decorative images have empty alt
- Two font weights loaded, not six · SVG for icons and illustrations · lazy-load below the fold
- Chart library code-split out of the beneficiary bundle
- `prefers-reduced-motion` respected
- **Test the beneficiary flow on a real phone on mobile data before recording the demo**

---

## 6 · DO

- **Name the register before starting any screen.**
- **Build the empty state at the same time as the list.** Deferred states never get built.
- **Show one record from both sides** — the beneficiary sees "Pending review", the staff sees the same row with the same stamp. Being able to show one thing from two sides is the strongest proof the system is real.
- **Use realistic data always** — plausible Indian names, real Pune localities, dates spread over weeks, and a deliberate spread of edge cases: one overdue, one rejected, one missing an optional field, one that stresses the layout.
- **Make status the largest element** on any beneficiary-facing screen.
- **Optimistic updates with undo** on every staff action.
- **Debounce every search input.**
- **Keep components small enough to explain.** If it's over ~150 lines and you don't fully understand it, split it. Someone has to defend this to a judge.
- **Ask before adding a dependency.**

## 7 · DO NOT

- **No marketing landing page** — no hero, no features grid, no scroll animations, no parallax. The front door is a login or the first task screen.
- **No animation beyond 250ms state transitions.** Nothing triggered by scroll, ever.
- **No dark mode.** Doubles QA, costs hours, nobody asked.
- **No gradients, glassmorphism, neon, 3D, custom cursors, splash screens.**
- **No modals on beneficiary screens** — full screens instead.
- **No account creation** unless the brief explicitly requires it. Reference-code lookup covers most cases and removes an entire auth surface.
- **No icon-only buttons. No placeholder-as-label. No clickable divs.**
- **No more than two font families.**
- **No lorem ipsum, no `test test`, no "coming soon"** in any demoed screen.
- **No polishing anything off the demo path.**
- **No second signature element.** One memorable thing; everything else quiet.

---

## 8 · WHEN GIVEN A FEATURE REQUEST

1. **Identify the feature** in §4. If it isn't there, find the nearest match and say which.
2. **Name the register.** Beneficiary or staff — state it before writing anything.
3. **Confirm in one line** what you understand the task to be, and wait.
4. **List the fields** you'll use, checked against §3.
5. **Name the four states** you'll build.
6. **Say what you are deliberately NOT building** from that feature's "do NOT" list.
7. Then build.
8. **Run §9 before reporting done.**

**If the request contradicts this file, say so and ask.** Do not silently follow either one.

---

## 9 · DEFINITION OF DONE

- [ ] Register named and consistently applied
- [ ] Loading, empty and error states all exist
- [ ] Zero raw hex, zero Tailwind colour classes, zero gradients
- [ ] Every input labelled, every icon has text, focus visible everywhere
- [ ] Nothing shifts layout while loading
- [ ] Beneficiary screens work at 375px
- [ ] Field names match the API contract exactly
- [ ] Copy is active voice; button verb matches its confirmation
- [ ] Realistic data, no placeholders
- [ ] I can explain every line of this to a judge