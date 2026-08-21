# BACKEND SKILL

**Read this before writing any backend code. Read it again at the start of every new session.**

---

## 0 · WHAT WE ARE BUILDING — never lose this

We are building an **operations system for an Indian NGO** in Pune, in one day, for a hackathon judged by senior Mastercard engineers who work on **payment security, fraud detection and digital identity**.

**The NGO is one of three, and their real operations look like this:**

| NGO | The actual workflow |
|---|---|
| **Y4D Foundation** | Skill-training **batches** (Tally, Manual Insertion Operator) → attendance → certification → **placement tracking** (student → company → salary) · free health camps · plantation drives with corporate volunteers · literacy sessions in schools |
| **Katalyst** | A **4-year cohort**: outreach at 51 partner colleges → application (eligibility: family income ≤ ₹5 lakh, women, 1st/2nd year) → written test → interview → enrolment → 600 training hours over 72 modules → **attendance feeds a scorecard** → scorecard converts to a **financial payout every six months** · **1:1 mentorship**, 500+ mentors, meetings twice a month |
| **Seva Sahayog** | **School Kit drive**: schools state requirements → material procured → **mass volunteer assembly events** (109 events, 5,641 volunteers, 71,786 kits) → distribution to 943 schools · community centres · adolescent-girl programmes across 81 centres |

**Three truths that shape every endpoint:**

1. **These are workflows, not CRUD.** Something is submitted, someone reviews it, a state changes, someone else needs to see it. Modelling this as plain create/read/update loses the entire value.
2. **The NGO's pain is invisibility.** They cannot see what's pending, what's stuck, or where the gaps are. The backend exists to make state queryable.
3. **The judges' reflexes are access control, fraud, and failure.** Expect: *who can see this beneficiary's record · what happens if it fails halfway · what's your pooling process, locking process · what data structures did you use · is it the best case.*

---

## 1 · UNIVERSAL REQUIREMENTS — every endpoint, no exceptions

- **Response envelope** `{ success, data, error }` — identical everywhere.
- **Correct status codes.** Especially 401 vs 403, and **409 for a conflicting state transition**.
- **Server-side validation on everything.** Client validation is UX; server validation is security. Never trust the client.
- **Ownership enforced inside the database query**, never with a check after fetching. A logged-in user requesting another user's record ID must get nothing back — not a 403 after the record was already loaded. This is the single most likely security question you will be asked.
- **Role checks in middleware**, not scattered through handlers.
- **`try/catch` around every await**, with error-handling middleware behind it.
- **Every status change writes to status history** — who, when, from, to, why.
- **Secrets in environment variables**, `.env` gitignored from the first commit, never logged.
- **Never log PII, tokens, or full request payloads.**
- **Collect only fields the feature actually uses.** Every extra field is a liability and a conversion cost.

---

## 2 · DATA PRINCIPLES

- **Statuses are enums, never strings.** Invalid values become impossible rather than merely discouraged.
- **A `status_history` table on every workflow entity.** Roughly ten lines, and it buys an audit trail, a timeline for the UI, and half the security answers.
- **Index every column the admin view filters by** — typically status, category, area, date. Composite index column order must match the filter order.
- **Location is a table or an enum, never free text.** Free text destroys every filter and every report.
- **Phone carries a unique constraint** where duplicates matter. It's the natural deduplication key in this context.
- **Human-readable reference codes**, not UUIDs, on anything a person will read aloud.
- **Soft delete** where records matter — NGOs almost always want them back.
- **Money as integers**, never floats.
- **Derive, don't store, anything that goes stale** — overdue flags, ages, counts that can be computed.

---

## 3 · FEATURE CATALOGUE

Each entry: how the NGO actually works · what concepts it needs · what's essential versus optional · the trap.

---

### F1 · Registration / intake
**ESSENTIAL — present in almost every brief**

*Reality:* thousands of volunteer sign-ups per drive, currently a Google Form and a spreadsheet export. **The same person submits twice** — once from their phone, once when they think it failed.

**Concepts required — all essential:**
- Input validation
- **Idempotency via deduplication on phone.** Return the existing reference rather than creating a second record. This is not a nicety; it is the most predictable real-world behaviour in the whole system
- Human-readable reference generation
- Rate limiting on the public endpoint
- Status defaulting, with the initial transition written to history

**Optional:** OTP verification of the phone · captcha (a honeypot field plus rate limiting is cheaper and doesn't exclude your users).

**The trap:** treating a repeat submission as a new record. It corrupts every count downstream, and a fraud-focused judge will ask exactly this.

---

### F2 · Public status lookup
**ESSENTIAL — the beneficiary's entire relationship with the system**

*Reality:* today the applicant calls the office repeatedly and nobody can answer.

**Concepts required:**
- **Two-field match (reference + phone) as lightweight authorisation.** Knowing a reference alone must not be enough
- `select` only the fields the applicant is entitled to see — never return the full record
- Rate limiting, because this endpoint is enumerable

**Optional:** full account authentication. Deliberately avoiding it removes an entire auth surface and is the correct trade-off for a one-day build. Be ready to defend that as a decision rather than an omission.

**The trap:** returning the whole row including internal reviewer notes. Use `select` deliberately.

---

### F3 · Filterable staff list
**ESSENTIAL — this is what the NGO actually asked for, and the query you will definitely write**

*Reality:* the coordinator needs to see what's pending, what's overdue, and where things cluster. Assume filtering by status, category, date range and place is required — every version of this brief has it.

**Concepts required:**
- **Composed `where` built conditionally from query params.** Each filter optional, none nested in a pile of ifs
- Case-insensitive partial search across two or three fields
- Date-range filtering
- **`select` over returning full records** — bandwidth matters on the devices these users have
- Pagination
- **Indexes on the filtered columns**
- Role-gated access

**Optional:** cursor pagination (offset is fine at this scale) · full-text search · saved filters.

**The trap:** the N+1 problem. Fetching a list then looping to fetch each row's relation is 51 round trips instead of one. Use a single query with the relation included.

---

### F4 · Status transition (approve / reject / assign)
**ESSENTIAL — and this is your answer to the "locking" question**

*Reality:* two coordinators can open the same queue at the same time. Katalyst reviews in stages; Seva Sahayog approves against event capacity.

**Concepts required:**
- **A state machine with legal transitions enforced server-side.** `REJECTED → APPROVED` must be impossible without passing through review
- **Optimistic concurrency: a conditional update that includes the current status in the `where` clause.** If zero rows are affected, someone else got there first — return 409. Never last-write-wins
- Status history appended on every transition, with actor and reason
- Mandatory reason on rejection
- Bulk transitions wrapped in a transaction

**Optional:** approval chains · delegation · scheduled auto-escalation.

**The trap:** an unconditional update. It silently overwrites a colleague's decision, and it is precisely what she means by *"locking process."* Getting this right — and being able to explain it in one sentence — is worth more than an extra feature.

---

### F5 · Event / capacity management
**IMPORTANT for Seva Sahayog and Y4D shapes**

*Reality:* a school-kit assembly has a real venue capacity. A single corporate host brought 400+ volunteers to one event. **Over-subscription is a genuine operational problem**, not a hypothetical.

**Concepts required:**
- **A transaction wrapping the capacity check and the sign-up.** The capacity guard belongs in the `where` clause of the decrement, not in an `if` before it
- Remaining-slots derived, not stored
- A unique constraint preventing the same person signing up twice for the same event

**Optional:** waitlist promotion · reminders · recurring events.

**The trap:** checking capacity, then inserting. Two simultaneous requests both pass the check and you oversell. The guard must be inside the atomic operation.

---

### F6 · Attendance
**IMPORTANT when the brief mentions sessions, batches, camps or training**

*Reality:* **Katalyst's scorecard — and each student's six-monthly payout — is driven by attendance at training and field visits.** Y4D tracks batch attendance for certification. Both are paper sheets today, and transcription is where errors enter. This is money, so correctness matters.

**Concepts required:**
- A join table (session × participant) with a unique constraint on the pair
- **Idempotent marking** — marking present twice must not double-count
- Bulk marking in one transaction
- Aggregation of attendance per participant over a period

**Optional:** offline queueing with later sync · geofencing · biometrics — all real work, none the point.

**The trap:** if attendance feeds a payout, a duplicate row is a financial error. The unique constraint is doing real work here, not decoration.

---

### F7 · Eligibility screening
**IMPORTANT for Katalyst-shaped and batch-enrolment briefs**

*Reality:* Katalyst screens on family income ≤ ₹5 lakh, gender, year of study and partner college. Screening early saves staff hours of reviewing ineligible applications.

**Concepts required:**
- **Eligibility rules in one function, server-side**, so a client can't bypass them
- **The rules stored as data, not hardcoded in a conditional** — thresholds change, and a configurable rule is a much better answer than a magic number
- Recording *why* someone was found ineligible

**Optional:** a rules engine · scoring · appeals.

**The trap:** hardcoding `income <= 500000` inline. When a judge asks what happens if the NGO changes the threshold, "it's a config value" is a far stronger answer than "we'd redeploy."

---

### F8 · Matching / allocation
**IMPORTANT — and the strongest differentiator surface in this catalogue**

*Reality:* Katalyst matches 500+ mentors to mentees — mentors aged 30–60, 5+ years' experience, one mentee each, meeting twice monthly. Staff do this from memory and spreadsheets. Seva Sahayog allocates limited stock against school requests.

**Concepts required:**
- Scoring candidates against weighted criteria
- **Returning the reasons alongside each match** — an array of the criteria that fired
- Deterministic tie-breaking, so the same inputs always produce the same output
- Capacity respected inside a transaction
- Match decisions written to history

**Optional:** optimisation algorithms · ML ranking · automatic re-matching.

**The trap:** returning a match with no explanation. **The reason is the feature.** An opaque allocation is a spreadsheet with extra steps; an explained one is something a coordinator can defend to the person who wasn't chosen. Agree the `reasons` field in the API contract early — bolting it on at 3 PM is expensive.

---

### F9 · In-kind donation lifecycle
**IMPORTANT for Seva Sahayog-shaped briefs**

*Reality:* pledge → collect → inventory → allocate → deliver. Donors routinely **deliver a different quantity than pledged**, and today nobody records the difference — which is exactly the gap the NGO describes.

**Concepts required:**
- Separate pledged and received quantities. **Not a boolean `collected` flag**
- Stock as a maintained row updated inside a transaction, not summed on every read
- A unique constraint on (category, centre) so double-counting is structurally impossible
- Allocation decrementing stock and creating the allocation atomically, with the quantity guard in the `where`
- Delivery confirmation as a separate state

**Optional:** barcode scanning · multi-warehouse transfers · procurement.

**The trap:** computing available stock by summing pledges minus allocations on every read. It's an N+1 waiting to happen, and a materialised row updated transactionally is both correct and a good answer to a scaling question.

---

### F10 · Monetary donation
**OPTIONAL — build only if the brief explicitly requires it**

**Concepts required if built:**
- **Money as integer paise.** Never float
- **The webhook is the source of truth, not the browser redirect.** A user closing the tab must not lose a recorded payment
- **Idempotency on the gateway reference**, because gateways retry
- Never store card data — the gateway tokenises, you store a reference

**The trap:** marking a donation successful on redirect. You will lose real payments, and *"how do you handle a dropped connection mid-payment"* is exactly the question a Mastercard engineer asks. Even a mocked gateway should follow this shape — it's the same effort and it's the right answer.

---

### F11 · Aggregation and reporting
**IMPORTANT — "we collect data but can't learn from it" is the near-universal complaint**

*Reality:* CSR partners require impact reports. Seva Sahayog reports kits distributed by region; Katalyst reports placement outcomes.

**Concepts required:**
- `groupBy` with counts for the dashboard numbers
- Date bucketing for any trend
- **Indexes on grouped columns**
- **Derived rather than stored metrics** wherever possible, so numbers can't drift from reality
- Caching for anything public — don't run six aggregations per page load

**Optional:** materialised views · scheduled snapshots · export pipelines.

**The trap:** aggregating in application code after fetching everything. That's the database's job, and doing it in JavaScript is the wrong answer to *"is it the best case."*

---

### F12 · Auth and access control
**ESSENTIAL — the highest-probability Q&A area**

*Reality:* NGO staff share office machines. Many beneficiaries have no email address.

**Concepts required:**
- Password hashing with bcrypt — never plaintext, never logged
- JWT signed server-side, sent in the Authorization header. **A JWT is signed, not encrypted** — nothing sensitive in the payload
- Auth middleware populating the request user; a separate role middleware layered on top
- **Ownership in the query.** This is the answer to *"who can see a beneficiary's data?"*
- Rate limiting on login

**Optional but the right choice in this context:** **phone OTP instead of passwords for beneficiaries.** Many have no email, share a family address, or can't complete an email-based reset. If you build it: hash the code, expire in ~5 minutes, cap attempts, invalidate on use.

**The trap:** IDOR. `/api/requests/42` returning any record to any authenticated user is the characteristic vulnerability of this exact class of app, and this panel is professionally trained to look for it.

---

### F13 · Notifications
**OPTIONAL as infrastructure, ESSENTIAL as a design consideration**

*Reality:* **WhatsApp is the notification layer here**, not email. Seva Sahayog coordinates thousands of volunteers through WhatsApp groups.

**Concepts required:**
- **A status-change hook**, even if it only logs. Structuring the code so a real sender could drop in lets you say honestly that notification is one function call away
- Deep links generated server-side or client-side — near-zero cost

**Optional:** SMS gateway · email · queue with retry · preferences.

**The trap:** building notification infrastructure at 2 PM. A hook plus a deep link is 95% of the credit for 5% of the work.

---

### F14 · AI-assisted feature
**OPTIONAL — but "use of AI" is a scored criterion**

Good fits in this domain: auto-categorising free-text submissions · generating a plain-language summary of collected data for an admin · explaining a match or a priority decision · translating between English, Hindi and Marathi.

**Concepts required:**
- **Call the model from the backend only.** An API key in a frontend bundle is visible in devtools, and this panel will ask
- Prompt for structured output; parse defensively
- **A timeout** — know your actual latency, because an eight-second call is unusable in a live flow
- **A rule-based fallback producing the same visible output.** If external APIs are blocked or slow, the fallback *becomes* the feature
- **Prompt injection awareness** — user-submitted free text going into a prompt is a real attack surface in exactly this shape of app
- Human-in-the-loop: nothing auto-decides

**The trap:** an AI feature with no fallback. A working rule-based version with visible reasoning beats a broken LLM call, every time.

---

## 4 · CONCEPT → FEATURE MAP

Reverse lookup. If you're implementing a concept, this is where it's needed and why.

| Concept | Needed for | Essential? |
|---|---|---|
| Validation, idempotency, rate limiting | F1, F2, F10 | **Always** |
| Composed `where` + indexes | F3, F11 | **Always** |
| State machine + conditional update (409) | F4, F5, F9 | **Always** — this is "locking" |
| Transactions | F4 bulk, F5, F6, F9 | Wherever two tables must change together |
| Unique constraints | F1, F5, F6, F9 | Wherever duplicates are possible |
| `status_history` | F1, F4, F8, F9 | **Always.** Ten lines, huge return |
| RBAC + ownership in the query | F3, F4, F11, F12 | **Always** — the most likely question |
| `groupBy` + aggregation | F11 | Whenever there's a dashboard |
| Webhooks + idempotency | F10 | Only with real payments |
| Timeouts, retries, fallback | F13, F14 | Any external call |
| Connection pooling | Everything | **Always** — she named it explicitly |

---

## 5 · DO

- **Model the workflow, not the table.** Ask what state changes and who needs to see it — that's the feature.
- **Write the state machine before the endpoints.** Statuses and legal transitions on paper first.
- **Put ownership in the `where` clause.** Every time, without exception.
- **Add `status_history` early.** Retrofitting it is expensive; it's ten lines up front.
- **Index what you filter by**, with column order matching filter order.
- **Return reasons alongside decisions** wherever the system decides something.
- **Make every external call have a timeout and a fallback.**
- **Wrap multi-table operations in a transaction.**
- **Return 409 rather than silently overwriting.**
- **Keep handlers small enough to explain.** Someone has to defend this to a judge.
- **Name the trade-off out loud in comments** where you took a shortcut — it becomes your Q&A answer.

## 6 · DO NOT

- **No unconditional status updates.** Ever.
- **No ownership checks after fetching.** In the query.
- **No aggregation in application code** that the database should do.
- **No boolean where a quantity or a state belongs.**
- **No free-text location.**
- **No floats for money.**
- **No stored derived values** that will go stale.
- **No secrets in code, logs, or the frontend bundle.**
- **No AI feature without a rule-based fallback.**
- **No new dependency without asking.**
- **No migrations in the deploy pipeline on the day** — push the schema from a laptop. A failed migration blocks the whole deploy at the worst possible moment.
- **No feature the brief didn't ask for.** Scope inflation arrives as extra columns.

---

## 7 · WHEN GIVEN A FEATURE REQUEST

1. **Identify the feature** in §3. If it isn't there, name the nearest match.
2. **Say whether it's essential, important or optional** for this brief, and why.
3. **Confirm in one line** what you understand the task to be, and wait.
4. **State the state machine** — what statuses, what transitions are legal.
5. **List the concepts** from §4 you'll apply.
6. **Name the trap** for that feature and how you're avoiding it.
7. **Confirm the API contract shape** you're implementing against, exactly.
8. Then build.
9. **Run §8 before reporting done.**

**If the request contradicts this file, say so and ask.** Do not silently follow either one.

---

## 8 · DEFINITION OF DONE

- [ ] Response envelope consistent; correct status codes, including 409
- [ ] Ownership enforced in the query, not after the fetch
- [ ] Server-side validation on every input
- [ ] Status transitions conditional and legal-only; history written
- [ ] Multi-table operations in transactions
- [ ] Indexes on every filtered and grouped column
- [ ] No secrets in code or logs; `.env` gitignored
- [ ] External calls have timeouts and fallbacks
- [ ] Field names match the API contract exactly
- [ ] I can explain the schema, the locking approach, and the pooling setup out loud

---

## 9 · THE FOUR ANSWERS TO HAVE READY

Prepare these as you build, not at 5 PM.

**"Who can see a beneficiary's data?"** — Only that beneficiary and staff with the admin role, enforced inside the database query rather than checked after fetching.

**"What's your locking process?"** — Optimistic concurrency. Status updates are conditional on the current status, so a second simultaneous approval affects zero rows and returns 409 rather than overwriting.

**"What's your pooling process?"** — Pooled connection for the application, direct for migrations. Free-tier Postgres caps concurrent connections, and connections are the bottleneck before the API code is.

**"What happens if it fails halfway?"** — Anything touching two tables runs in a transaction. External calls have timeouts and fall back to a deterministic path.               