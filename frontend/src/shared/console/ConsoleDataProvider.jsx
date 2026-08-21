import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  cancelEvent as cancelEventRequest,
  createActionPlanRun,
  createEvent as createEventRequest,
  deleteEvent as deleteEventRequest,
  getActionPlanRuns,
  getCompanies,
  getEvents,
  getFeedback,
  getNeeds,
  respondToNeed as respondToNeedRequest,
  setEventStatus as setEventStatusRequest,
  updateEvent as updateEventRequest,
} from '../lib/orgApi.js';
import { summariseEvent, workQueueCounts } from '../lib/analytics.js';
import { summariseThemes, urgentThemes } from '../lib/insights.js';
import {
  findPreviousActivity,
  hasCuratedPlan,
  planEligibility,
  resolveActionPlan,
} from '../../admin/data/actionPlanIndex.js';

const ConsoleDataContext = createContext(null);

/**
 * One data layer for both consoles.
 *
 * `companyId` is the whole difference between them. The NGO admin passes
 * nothing and sees the Foundation; a corporate SPOC passes their own
 * company id and sees only their company's activities, volunteers and
 * feedback. Scoping in ONE place rather than filtering in each screen is
 * what makes "a SPOC cannot see another partner's feedback" a property of
 * the app rather than a promise about nine components.
 *
 * The server enforces the same scope independently — a SPOC's token is
 * checked against the event's companyId on every request — so this is the
 * convenience half of the rule, not the security half.
 */
export function ConsoleDataProvider({ companyId = null, children }) {
  const [state, setState] = useState({
    status: 'loading',
    events: [],
    feedback: [],
    needs: [],
    companies: [],
    planRuns: {},
    error: null,
  });

  const load = useCallback(async () => {
    setState((current) => ({
      ...current,
      status: current.events.length ? 'refreshing' : 'loading',
      error: null,
    }));

    try {
      const scope = companyId ? { companyId } : {};
      const [events, feedback, needs, companies, planRuns] = await Promise.all([
        getEvents(scope),
        getFeedback(scope),
        getNeeds(scope),
        getCompanies(),
        getActionPlanRuns(),
      ]);

      setState({
        status: 'loaded',
        events: events.data,
        feedback: feedback.data,
        needs: needs.data,
        companies: companies.data,
        planRuns: planRuns.data,
        error: null,
      });
    } catch (error) {
      setState((current) => ({ ...current, status: 'error', error: error.message }));
    }
  }, [companyId]);

  useEffect(() => {
    load();
  }, [load]);

  /* ---- Mutations. Each reloads, so every screen sees the same truth ---- */

  const createEvent = useCallback(
    async (payload) => {
      try {
        const { data } = await createEventRequest(payload);
        await load();
        return { ok: true, event: data };
      } catch (error) {
        return { ok: false, error: error.message, fields: error.fields };
      }
    },
    [load],
  );

  const updateEvent = useCallback(
    async (eventId, patch) => {
      try {
        await updateEventRequest(eventId, patch);
        await load();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    [load],
  );

  /**
   * Optimistic: the badge changes on the same frame as the click and the
   * row moves between groups, then the request confirms it. A rollback
   * puts the old status back and the caller shows what happened.
   */
  const setEventStatus = useCallback(
    async (eventId, status) => {
      const previous = state.events.find((event) => event.eventId === eventId)?.status;

      setState((current) => ({
        ...current,
        events: current.events.map((event) =>
          event.eventId === eventId ? { ...event, status } : event,
        ),
      }));

      try {
        await setEventStatusRequest(eventId, status);
        return { ok: true, previous };
      } catch (error) {
        setState((current) => ({
          ...current,
          events: current.events.map((event) =>
            event.eventId === eventId ? { ...event, status: previous } : event,
          ),
        }));
        return { ok: false, error: error.message };
      }
    },
    [state.events],
  );

  const cancelEvent = useCallback(
    async (eventId) => {
      try {
        await cancelEventRequest(eventId);
        await load();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    [load],
  );

  /** Hard delete. Refused by the API for anything with history behind it. */
  const deleteEvent = useCallback(
    async (eventId) => {
      try {
        await deleteEventRequest(eventId);
        await load();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message, code: error.code };
      }
    },
    [load],
  );

  /** Run the analysis for one activity and record when it ran. */
  const createPlan = useCallback(
    async (eventId) => {
      try {
        const { data } = await createActionPlanRun(eventId);
        await load();
        return { ok: true, generatedAt: data.generatedAt };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    [load],
  );

  const respondToNeed = useCallback(
    async (reference, response) => {
      try {
        await respondToNeedRequest(reference, response);
        await load();
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    },
    [load],
  );

  /* ---- Derived, computed once per data change ------------------------- */

  const value = useMemo(() => {
    const { events, feedback } = state;

    const summarised = events.map((event) => summariseEvent(event, feedback));
    const insights = feedback.flatMap((row) => row.insights ?? []);
    const themeSummary = summariseThemes(insights);

    /* Grouped ONCE, into a map, rather than filtered on each call.
       `feedbackForEvent` has to return the same array reference between
       renders: a screen that passes its result into a useEffect
       dependency list — the attendance sheet does — would otherwise
       refetch on every render, forever, because a fresh .filter() is a
       fresh array even when nothing changed. */
    const byEvent = new Map();
    feedback.forEach((row) => {
      const bucket = byEvent.get(row.eventId);
      if (bucket) bucket.push(row);
      else byEvent.set(row.eventId, [row]);
    });
    const NONE = [];
    const feedbackFor = (eventId) => byEvent.get(eventId) ?? NONE;

    /* ---- Action plans ------------------------------------------------
       Resolved here, once, for every activity — so the list page, the
       detail page and the activity page can never disagree about whether
       a plan exists. `resolveActionPlan` returns a complete plan or null,
       never a half-built one. */
    const plans = new Map();
    const planStates = new Map();

    summarised.forEach((event) => {
      const eligibility = planEligibility(event);
      const plan = resolveActionPlan({
        event,
        feedback: feedbackFor(event.eventId),
        previous: findPreviousActivity(event, summarised, feedbackFor),
        generatedAt: state.planRuns?.[event.eventId] ?? null,
      });

      if (plan) plans.set(event.eventId, plan);
      planStates.set(event.eventId, {
        hasPlan: Boolean(plan),
        curated: hasCuratedPlan(event.eventId),
        generatedAt: state.planRuns?.[event.eventId] ?? null,
        ...eligibility,
      });
    });

    return {
      ...state,
      companyId,
      reload: load,
      createEvent,
      updateEvent,
      setEventStatus,
      cancelEvent,
      deleteEvent,
      respondToNeed,
      createPlan,

      summarised,
      insights,
      themeSummary,
      urgent: urgentThemes(themeSummary),
      counts: workQueueCounts(events, feedback),

      upcoming: summarised.filter((event) =>
        ['UPCOMING', 'REGISTRATION_OPEN'].includes(event.status),
      ),
      collecting: summarised.filter((event) => event.status === 'ONGOING'),
      completed: summarised.filter((event) => event.status === 'COMPLETED'),
      openNeeds: state.needs.filter((need) => need.status === 'OPEN'),

      findEvent: (eventId) => summarised.find((event) => event.eventId === eventId) ?? null,
      feedbackForEvent: feedbackFor,

      /* One plan per activity, or null. Never a partially-built object. */
      planFor: (eventId) => plans.get(eventId) ?? null,
      planStateFor: (eventId) =>
        planStates.get(eventId) ?? { hasPlan: false, eligible: false, reason: 'Unknown activity.' },
      eventsWithPlans: summarised.filter((event) => plans.has(event.eventId)),
      eventsAwaitingPlan: summarised.filter(
        (event) => !plans.has(event.eventId) && planStates.get(event.eventId)?.eligible,
      ),
      eventsBlockedFromPlan: summarised.filter(
        (event) =>
          !plans.has(event.eventId) &&
          !planStates.get(event.eventId)?.eligible &&
          ['ONGOING', 'COMPLETED'].includes(event.status),
      ),
    };
  }, [
    state,
    companyId,
    load,
    createEvent,
    updateEvent,
    setEventStatus,
    cancelEvent,
    deleteEvent,
    respondToNeed,
    createPlan,
  ]);

  return <ConsoleDataContext.Provider value={value}>{children}</ConsoleDataContext.Provider>;
}

export function useConsoleData() {
  const context = useContext(ConsoleDataContext);
  if (!context) throw new Error('useConsoleData must be used inside <ConsoleDataProvider>');
  return context;
}
