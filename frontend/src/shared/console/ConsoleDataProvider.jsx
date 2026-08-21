import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  cancelEvent as cancelEventRequest,
  createEvent as createEventRequest,
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
      const [events, feedback, needs, companies] = await Promise.all([
        getEvents(scope),
        getFeedback(scope),
        getNeeds(scope),
        getCompanies(),
      ]);

      setState({
        status: 'loaded',
        events: events.data,
        feedback: feedback.data,
        needs: needs.data,
        companies: companies.data,
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

    return {
      ...state,
      companyId,
      reload: load,
      createEvent,
      updateEvent,
      setEventStatus,
      cancelEvent,
      respondToNeed,

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
      feedbackForEvent: (eventId) => byEvent.get(eventId) ?? NONE,
    };
  }, [
    state,
    companyId,
    load,
    createEvent,
    updateEvent,
    setEventStatus,
    cancelEvent,
    respondToNeed,
  ]);

  return <ConsoleDataContext.Provider value={value}>{children}</ConsoleDataContext.Provider>;
}

export function useConsoleData() {
  const context = useContext(ConsoleDataContext);
  if (!context) throw new Error('useConsoleData must be used inside <ConsoleDataProvider>');
  return context;
}
