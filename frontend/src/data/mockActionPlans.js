// PLACEHOLDER mock data, shaped to match the AI Action Plan JSON contract exactly
// (eventId, overallExperience, whatWentWell, needsAttention, actionPlan[], nextEventChecklist[],
// previousActionPlanEvaluation) so swapping in the real
// GET /api/events/:eventId/action-plan response later is a one-file change.
// See API_CONTRACT.md — this endpoint is PROPOSED, not yet built by the backend/AI team.
//
// generationState models the automation lifecycle (spec section 10):
// 'generated' | 'pending' (AI analysis in progress) | 'insufficient_evidence' | 'failed'
// Activities whose feedback period is still open have no entry here at all —
// the Insights page reads that straight from activity.feedbackStatus.
export const actionPlans = {
  1: {
    eventId: 1,
    generationState: 'generated',
    analysisDate: '24 Aug 2026, 06:00 AM',
    responseCount: 72,
    status: 'upcoming', // Generated | Upcoming | In Progress | Completed | Evaluating | Improved | Needs Reassessment
    emailDelivery: {
      status: 'sent',
      recipient: 'admin@sevasahayog.org',
      sentAt: '24 Aug 2026, 06:02 AM',
      fileName: 'Waste-Segregation-Drive-Action-Plan.pdf',
    },
    overallExperience: {
      score: 4.2,
      summary:
        'Volunteers found the cause meaningful and the on-ground team helpful, but a recurring number reported confusion about where to report and how waste segregation was supposed to work, which cost time at the start of the activity.',
    },
    whatWentWell: [
      {
        observation: 'Volunteers consistently described the activity as meaningful and well-intentioned.',
        evidence: '54 of 72 responses mentioned positive impact or a sense of purpose.',
        impact: 'Strong volunteer motivation — safe to repeat this activity format.',
      },
      {
        observation: 'On-ground coordination staff were rated highly once volunteers found them.',
        evidence: '41 responses praised staff helpfulness directly.',
        impact: 'The coordination team itself is not the problem — the handoff to them is.',
      },
    ],
    needsAttention: [
      {
        problem: 'Volunteers were unsure where to report and how segregation categories worked.',
        evidence:
          '"I wasn’t sure where I was supposed to report." / "The meeting point wasn’t communicated clearly." / "Had to ask multiple people where to go." (24 responses describing the same underlying issue in different words)',
        frequency: 24,
        severity: 'high',
        priority: 'critical',
        rootCause: 'No standardized pre-event briefing was sent; reporting location and segregation rules were only communicated verbally on the day.',
        affectedActivities: ['Waste Segregation Drive'],
      },
      {
        problem: 'Activity start was perceived as rushed.',
        evidence: '18 responses mentioned timing pressure at the start of the activity.',
        frequency: 18,
        severity: 'medium',
        priority: 'medium',
        rootCause: 'Segregation instructions were being explained at the same time volunteers were expected to begin work.',
        affectedActivities: ['Waste Segregation Drive'],
      },
    ],
    actionPlan: [
      {
        priority: 1,
        bucket: 'must',
        problem: 'Volunteers were unsure where to report and how segregation categories worked.',
        action: 'Create a standardized pre-event volunteer briefing.',
        description:
          'Send a standardized volunteer briefing 24 hours before the activity containing the reporting location, coordinator contact, activity schedule, segregation categories, required materials and emergency information.',
        responsibleRole: 'Activity Coordinator',
        deadline: '24 hours before next event',
        targetEventId: null,
        expectedImpact: 'Reduce instruction- and location-related confusion at the next event.',
        successMetric: 'Instruction-related negative feedback drops from 24 responses to under 10.',
        status: 'upcoming',
      },
      {
        priority: 2,
        bucket: 'must',
        problem: 'Volunteers were unsure where to report and how segregation categories worked.',
        action: 'Assign one coordinator per volunteer group at the reporting point.',
        description: 'Station a named coordinator at the entrance/meeting point for the first 30 minutes to direct arriving volunteers.',
        responsibleRole: 'Activity Coordinator',
        deadline: 'Day of next event',
        targetEventId: null,
        expectedImpact: 'Removes the "had to ask multiple people" pattern reported by volunteers.',
        successMetric: 'Zero "couldn’t find where to go" comments in next event feedback.',
        status: 'upcoming',
      },
      {
        priority: 3,
        bucket: 'should',
        problem: 'Activity start was perceived as rushed.',
        action: 'Create a standard activity-day checklist for segregation drives.',
        description: 'A printed checklist coordinators run through before volunteers start work, separating instruction time from work time.',
        responsibleRole: 'Activity Coordinator',
        deadline: 'Before next event',
        targetEventId: null,
        expectedImpact: 'Smoother, less rushed activity start.',
        successMetric: 'Timing-related complaints trend down over the next 2 events.',
        status: 'upcoming',
      },
      {
        priority: 4,
        bucket: 'could',
        problem: 'New volunteers repeatedly ask the same orientation questions.',
        action: 'Add a short volunteer orientation video to the sign-up confirmation.',
        description: 'A 2-minute video covering what to expect, what to bring, and how segregation works, sent when a volunteer registers.',
        responsibleRole: 'Volunteer Coordinator',
        deadline: 'Before next 2 events',
        targetEventId: null,
        expectedImpact: 'Faster onboarding on the day, fewer repeated questions to staff.',
        successMetric: 'Reduced staff time spent on basic orientation questions.',
        status: 'upcoming',
      },
      {
        priority: 5,
        bucket: 'watch',
        problem: 'Activity timing complaints increased slightly compared to the previous drive.',
        action: 'Monitor — no immediate action required.',
        description: 'Timing-related mentions rose modestly. Not yet a large enough pattern to justify a dedicated intervention.',
        responsibleRole: 'Activity Coordinator',
        deadline: 'Review after next event',
        targetEventId: null,
        expectedImpact: 'Early warning if this becomes a systemic issue.',
        successMetric: 'Re-evaluate priority if timing mentions exceed 20 in the next cycle.',
        status: 'upcoming',
      },
    ],
    nextEvent: { title: 'Waste Segregation Drive — Phase 2', date: '5 Sep 2026' },
    nextEventChecklist: [
      { task: 'Prepare and send standardized volunteer briefing (location, coordinator, schedule, segregation rules)', phase: 'before_event', responsibleRole: 'Activity Coordinator', deadline: '24 hours before event' },
      { task: 'Assign one coordinator to the reporting point for volunteer arrival', phase: 'before_event', responsibleRole: 'Activity Coordinator', deadline: 'Day of event' },
      { task: 'Confirm segregation bins and signage are in place before volunteers arrive', phase: 'before_event', responsibleRole: 'Logistics', deadline: '2 hours before event' },
      { task: 'Run the activity-day checklist before volunteers begin work', phase: 'during_event', responsibleRole: 'Activity Coordinator', deadline: 'Start of event' },
      { task: 'Note any repeated confusion for the next feedback cycle', phase: 'after_event', responsibleRole: 'Activity Coordinator', deadline: 'Within 24 hours after event' },
    ],
    previousActionPlanEvaluation: { available: false },
  },

  2: {
    eventId: 2,
    generationState: 'generated',
    analysisDate: '22 Aug 2026, 06:00 AM',
    responseCount: 58,
    status: 'upcoming',
    emailDelivery: {
      status: 'failed',
      recipient: 'admin@sevasahayog.org',
      sentAt: null,
      fileName: 'Education-Support-Program-Action-Plan.pdf',
    },
    overallExperience: {
      score: 4.7,
      summary:
        'Feedback was strongly positive. Volunteers highlighted visible impact and smooth coordination, with no recurring operational complaints.',
    },
    whatWentWell: [
      {
        observation: 'Volunteers reported a strong sense of impact from working directly with students.',
        evidence: '31 of 58 responses cited impact as the most memorable part of the activity.',
        impact: 'This activity format is working well and is safe to repeat as-is.',
      },
      {
        observation: 'Coordination between volunteers and the on-site team was smooth.',
        evidence: '14 responses specifically praised coordination.',
        impact: 'No operational changes needed here.',
      },
    ],
    needsAttention: [],
    actionPlan: [
      {
        priority: 1,
        bucket: 'could',
        problem: 'No recurring problems were identified in this cycle.',
        action: 'Document the current coordination approach as the standard playbook.',
        description: 'Write down what made this event work — volunteer-to-student ratio, session structure, coordination handoffs — so it can be repeated for other education activities.',
        responsibleRole: 'Activity Coordinator',
        deadline: 'Before next education activity',
        targetEventId: null,
        expectedImpact: 'Makes it easier to replicate this experience across other education activities.',
        successMetric: 'Playbook exists and is referenced when planning the next education activity.',
        status: 'upcoming',
      },
    ],
    nextEvent: null,
    nextEventChecklist: [
      { task: 'Keep current volunteer-to-student ratio and session structure', phase: 'before_event', responsibleRole: 'Activity Coordinator', deadline: 'Before next event' },
    ],
    previousActionPlanEvaluation: { available: false },
  },

  3: {
    eventId: 3,
    generationState: 'pending',
    analysisDate: null,
    responseCount: 46,
  },

  5: {
    eventId: 5,
    generationState: 'generated',
    analysisDate: '15 Aug 2026, 06:00 AM',
    responseCount: 61,
    status: 'improved',
    emailDelivery: {
      status: 'sent',
      recipient: 'admin@sevasahayog.org',
      sentAt: '15 Aug 2026, 06:03 AM',
      fileName: 'Community-Development-Camp-Action-Plan.pdf',
    },
    overallExperience: {
      score: 4.5,
      summary:
        'Volunteer experience improved compared to the previous community development camp. Engagement and impact scores rose, and the coordination complaints from the last cycle largely did not recur.',
    },
    whatWentWell: [
      {
        observation: 'Community reception and local-team coordination were rated highly.',
        evidence: '27 responses cited impact, 20 cited engagement.',
        impact: 'The changes made after the last camp appear to be working.',
      },
    ],
    needsAttention: [
      {
        problem: 'A small number of volunteers still mentioned unclear task allocation on arrival.',
        evidence: '8 responses mentioned coordination, down from 19 in the previous camp.',
        frequency: 8,
        severity: 'low',
        priority: 'low',
        rootCause: 'Task allocation is still partly assigned on the day rather than in advance.',
        affectedActivities: ['Community Development Camp'],
      },
    ],
    actionPlan: [
      {
        priority: 1,
        bucket: 'should',
        problem: 'A small number of volunteers still mentioned unclear task allocation on arrival.',
        action: 'Pre-assign volunteer task groups before arrival.',
        description: 'Send task-group assignments in the pre-event briefing rather than allocating tasks on the day.',
        responsibleRole: 'Activity Coordinator',
        deadline: '24 hours before next event',
        targetEventId: null,
        expectedImpact: 'Further reduce day-of coordination confusion.',
        successMetric: 'Coordination-related mentions drop below 5 in the next cycle.',
        status: 'upcoming',
      },
    ],
    nextEvent: { title: 'Community Development Camp — Round 2', date: '10 Sep 2026' },
    nextEventChecklist: [
      { task: 'Send pre-assigned task groups in the volunteer briefing', phase: 'before_event', responsibleRole: 'Activity Coordinator', deadline: '24 hours before event' },
      { task: 'Confirm local-team coordination handoff points', phase: 'before_event', responsibleRole: 'Activity Coordinator', deadline: 'Day before event' },
    ],
    previousActionPlanEvaluation: {
      available: true,
      result: 'Previous intervention appears to have improved the issue.',
      improved: true,
      evidence: 'Coordination-related feedback mentions decreased from 19 to 8 after pre-event coordination changes were introduced.',
    },
  },
}
