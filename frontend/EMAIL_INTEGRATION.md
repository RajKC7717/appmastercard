# Feedback confirmation email — integration spec

**Owner: backend.** The frontend is already wired for this and needs no further
change. This file says exactly what to add, which keys go where, and what the
email should contain.

---

## 1 · The contract the frontend already expects

`POST /api/feedback` must return this on success (201):

```jsonc
{
  "success": true,
  "data": {
    "reference": "FB-2026-0147",
    "status": "COMPLETE",
    "submittedAt": "2026-08-21T17:04:11.220Z",

    // ↓ the only new part
    "confirmationEmail": {
      "sent": true,                              // did the provider ACCEPT it?
      "to": "rajesh.kulkarni@amdocs.com"         // the address it went to
    }
  }
}
```

The confirmation screen reads `confirmationEmail`:

| `sent` | What the volunteer sees |
|---|---|
| `true` | “A confirmation email has been sent to `r*************i@amdocs.com`” — green |
| `false` / missing | “Your feedback is saved. The confirmation email is on its way.” — neutral |

**Never hardcode `sent: true`.** Claiming an email was sent when the provider
rejected it is the one failure mode that costs trust, and the volunteer has no
way to find out otherwise. Report what actually happened.

The address is masked client-side by `maskEmail()` in `src/volunteer/lib/format.js`,
so send the real address — nothing sensitive is rendered.

---

## 2 · Where it fires

Inside `submitFeedback()`, **after** the transaction that writes `feedback` +
`feedback_ratings` commits — never inside it.

```
BEGIN
  INSERT feedback                     (registration_id UNIQUE → dedupe is structural)
  INSERT feedback_ratings × 9
  UPDATE event_registrations SET feedback_submitted_at = now()
COMMIT
  ↓
enqueue "feedback.confirmation" job   ← here
  ↓
respond 201 with confirmationEmail
```

Three rules:

1. **A failed email must never fail the submission.** The feedback is the
   product; the email is a receipt. Wrap the send, catch everything, and return
   `sent: false` rather than a 500.
2. **Don't block the response on an SMTP round trip.** Queue it, or send with a
   ~3s timeout and report the outcome. A volunteer on venue Wi-Fi should not
   wait on your mail provider.
3. **Idempotent on `reference`.** A retried job must not send a second email.
   `feedback.registration_id` is already UNIQUE, so key the job on the
   `feedback_id` and skip if a send is already recorded.

For the **409 duplicate** path, send nothing. The volunteer already got their
email the first time.

---

## 3 · Keys — what goes where

### `backend/.env` (never committed — `.env` is already in `.gitignore`)

Pick **one** provider block.

**Option A — Resend** (recommended: 3 lines of code, 3,000 free emails/month,
no SMTP setup)

```dotenv
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="Seva Sahayog <feedback@sevasahayog.org>"
EMAIL_REPLY_TO=volunteering@sevasahayog.org
```

**Option B — SMTP via Nodemailer** (use if the NGO already has a mailbox, e.g.
Google Workspace)

```dotenv
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false                 # true only for port 465
SMTP_USER=volunteering@sevasahayog.org
SMTP_PASS=xxxx xxxx xxxx xxxx     # Google App Password, NOT the account password
EMAIL_FROM="Seva Sahayog <volunteering@sevasahayog.org>"
EMAIL_REPLY_TO=volunteering@sevasahayog.org
```

**Shared, both options**

```dotenv
APP_BASE_URL=https://volunteer.sevasahayog.org   # builds links in the email body
EMAIL_ENABLED=true                                # false in dev → log, don't send
```

### `backend/.env.example` (committed)

Mirror every key above with **empty or placeholder values**. This is the file
teammates copy, and a key that only exists in someone's local `.env` is a
deploy-day outage.

```dotenv
EMAIL_PROVIDER=resend
RESEND_API_KEY=
EMAIL_FROM="Seva Sahayog <feedback@example.org>"
EMAIL_REPLY_TO=
APP_BASE_URL=http://localhost:5173
EMAIL_ENABLED=false
```

### `backend/src/config/index.js`

Read them once, here, with the rest of the config — not with `process.env`
scattered through the service. Fail fast at boot if `EMAIL_ENABLED=true` and the
provider key is missing, so a misconfiguration is a startup error rather than a
silent no-op discovered by a volunteer.

### Deployment

Set the same keys as environment variables on the host (Render / Railway /
Fly / EC2). Nothing in this list belongs in the repo, in a Postman collection,
or in the frontend — **the frontend must never see the mail key.** It has no
mail code and no `VITE_`-prefixed mail variable, and it must stay that way:
anything prefixed `VITE_` is compiled into the JS bundle and readable by anyone.

---

## 4 · What the email should contain

Keep it short. It is a receipt, not a newsletter. Send **HTML + a plain-text
alternative** — plain text alone looks broken, HTML alone gets spam-filtered.

**Subject**

```
Thank you — feedback received for {{eventName}} ({{reference}})
```

Putting the reference in the subject makes it findable by search later, which is
the entire reason a human-readable reference exists.

**Body — the only fields that matter**

| Element | Source |
|---|---|
| Volunteer's first name | `company_users.name` |
| Event name, date, venue | `events.event_name`, `event_date`, `location` |
| Corporate partner | `companies.company_name` |
| **Reference, large** | the `FB-YYYY-NNNN` you returned |
| Submitted at | `feedback.submitted_at`, rendered in IST |
| One line on what happens next | static copy |
| Link to their history | `{{APP_BASE_URL}}/volunteer/history` |
| Reply-to a real mailbox | `EMAIL_REPLY_TO` |

**Do NOT include:** the ratings themselves, the free-text comment, or the
low-score reasons. Three reasons — email is not a confidential channel, a
volunteer's candid criticism landing in a forwardable inbox discourages candour
next time, and the volunteer can already read it all back in the History tab
behind their login.

**Suggested body copy**

> Namaste {{firstName}},
>
> Thank you for sharing your feedback on **{{eventName}}**, {{eventDate}} at
> {{location}}.
>
> **Your reference: {{reference}}**
>
> The Seva Sahayog coordinator for this activity reads every response. Where you
> rated something 2 or below, your note goes to them directly this week.
>
> You can read back everything you submitted any time at {{historyUrl}}.
>
> — Seva Sahayog Foundation

Set `List-Unsubscribe` only if you ever send anything non-transactional. A
confirmation receipt is transactional and does not need it.

---

## 5 · Testing checklist

- [ ] `EMAIL_ENABLED=false` in dev logs the rendered email and returns `sent: false`
- [ ] A provider outage returns 201 with `sent: false` — the feedback still saves
- [ ] A retried queue job sends exactly one email
- [ ] The 409 duplicate path sends nothing
- [ ] `.env.example` lists every key the code reads
- [ ] No mail key appears anywhere under `frontend/`
- [ ] The reference in the email matches the one on the confirmation screen

---

## 6 · Note for the schema

Two payload fields sent by the frontend have no column yet:

- **`themeComments`** — `{ "STAFF_SUPPORT": "Nobody could tell us when the bus
  would arrive." }`. The reason a volunteer gave *at the moment* they scored a
  theme 2 or below. This is the highest-signal text in the whole form and it is
  already theme-tagged, so it needs no AI classification at all.
  **Recommended home: a nullable `comment TEXT` column on `feedback_ratings`.**
  It is one-to-one with a rating, which is exactly what it describes.
- **`source`** — `"PORTAL"`. Which channel the feedback came through, for the
  admin's channel-effectiveness view. A small enum on `feedback` if you want it;
  safe to drop for now.

Everything else in the payload maps to existing columns:
`ratings` → `feedback_ratings` (one row per theme, `source = EXPLICIT`),
`overallComment` → `feedback.overall_comment`, `language` → `feedback.language`.
