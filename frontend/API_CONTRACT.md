# API contract

Fill this in together with the backend team in the first 30 minutes. Frontend can build against mock data matching these shapes before the real backend endpoints exist — this is what lets both subteams work in parallel without blocking each other.

| Endpoint | Method | Request body | Response shape | Auth? | Status |
|---|---|---|---|---|---|
| /api/example | GET | — | `[{ _id, field1, field2 }]` | No | Not started |
| /api/events/:eventId/action-plan | GET | — | See "AI Action Plan shape" below | Yes (admin) | **PROPOSED — not built yet** |

Add one row per feature/resource. Backend updates the Status column as each endpoint goes from Not started -> In progress -> Done. Frontend checks this file before assuming an endpoint is ready.

## AI Action Plan shape (proposed — backend/AI team to confirm)

Frontend has built the full Insights UI against this shape as mock data (`src/data/mockActionPlans.js`) — swapping in the real endpoint is a one-file change once this row moves to "Done". This is the automation described in the AI Action Plan spec: feedback closes → backend job analyses it → structured plan generated → displayed here. **The frontend never triggers generation** — it only reads whatever the backend has stored for an event.

```json
{
  "eventId": "...",
  "generationState": "generated | pending | insufficient_evidence | failed",
  "analysisDate": "...",
  "responseCount": 72,
  "status": "generated | upcoming | in_progress | completed | evaluating | improved | needs_reassessment",
  "overallExperience": { "score": 4.2, "summary": "..." },
  "whatWentWell": [{ "observation": "...", "evidence": "...", "impact": "..." }],
  "needsAttention": [{ "problem": "...", "evidence": "...", "frequency": 24, "severity": "high", "priority": "critical", "rootCause": "...", "affectedActivities": [] }],
  "actionPlan": [{
    "priority": 1,
    "bucket": "must | should | could | watch",
    "problem": "...", "action": "...", "description": "...",
    "responsibleRole": "...", "deadline": "...", "targetEventId": null,
    "expectedImpact": "...", "successMetric": "...", "status": "upcoming"
  }],
  "nextEvent": { "title": "...", "date": "..." },
  "nextEventChecklist": [{ "task": "...", "phase": "before_event | during_event | after_event", "responsibleRole": "...", "deadline": "..." }],
  "previousActionPlanEvaluation": { "available": true, "result": "...", "improved": true, "evidence": "..." },
  "emailDelivery": { "status": "sent | failed | pending", "recipient": "...", "sentAt": "...", "fileName": "...-Action-Plan.pdf" }
}
```

If `generationState` is `pending`, `insufficient_evidence`, or `failed`, only `eventId`/`generationState`/`responseCount` are required — the frontend shows an appropriate waiting/empty state and doesn't expect the rest.

**Explicitly backend/AI team scope, not frontend** (per the AI Action Plan spec): the scheduled job that detects feedback-period closure, the AI analysis call, PDF report generation, and actually sending the email to the NGO admin. Frontend only ever reads the stored `emailDelivery` result and displays it — see `components/EmailDeliveryStatus`. The "Resend" button shown on a `failed` status should call a real resend endpoint once one exists; right now it just flips local UI state as a placeholder.

## Base URL
- Local dev backend: http://localhost:5000/api
- Deployed backend: [fill in Render/Railway URL once deployed]
Store this in .env as shown in .env.example — never hardcode it in a component.
