import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getActivities,
  getFeedbackHistory,
  getNeeds,
  getVolunteer,
  registerForEvent,
} from '../lib/api.js';

const VolunteerContext = createContext(null);

/**
 * Loads the volunteer, their activities, their feedback and their open needs
 * once, and shares them across the four tabs. Every consumer gets the same
 * four states: loading, error, empty and loaded.
 *
 * `reload()` runs after a submit so home, events and history all reflect the
 * new record without a full page refresh.
 */
export function VolunteerProvider({ children }) {
  const [state, setState] = useState({
    status: 'loading',
    volunteer: null,
    activities: [],
    feedback: [],
    needs: [],
    error: null,
  });

  const load = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      status: prev.volunteer ? 'refreshing' : 'loading',
      error: null,
    }));
    try {
      const [me, acts, history, needs] = await Promise.all([
        getVolunteer(),
        getActivities(),
        getFeedbackHistory(),
        getNeeds(),
      ]);
      setState({
        status: 'loaded',
        volunteer: me.data,
        activities: acts.data,
        feedback: history.data,
        needs: needs.data,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({ ...prev, status: 'error', error: error.message }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Register for an activity, optimistically. The card flips to "Registered"
   * and the needed count drops on the same frame as the tap — a half-second
   * of nothing after a button press reads as a broken button.
   */
  const register = useCallback(async (activityId) => {
    setState((prev) => ({
      ...prev,
      activities: prev.activities.map((a) =>
        a.activityId === activityId
          ? { ...a, isRegistered: true, volunteersRegistered: a.volunteersRegistered + 1 }
          : a,
      ),
    }));

    try {
      await registerForEvent(activityId);
      return { ok: true };
    } catch (error) {
      /* Roll the optimistic update back and say what happened. */
      setState((prev) => ({
        ...prev,
        activities: prev.activities.map((a) =>
          a.activityId === activityId
            ? { ...a, isRegistered: false, volunteersRegistered: a.volunteersRegistered - 1 }
            : a,
        ),
      }));
      return { ok: false, error: error.message, code: error.code };
    }
  }, []);

  const value = useMemo(() => {
    const { activities, feedback } = state;
    const withFeedback = new Set(feedback.map((f) => f.activityId));

    /* Active and upcoming are ONE list — from the volunteer's side they are
       the same thing: activities that still need something from them. Today's
       come first, then the rest in date order. */
    const current = activities
      .filter((a) => a.status === 'ACTIVE' || a.status === 'UPCOMING')
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'ACTIVE' ? -1 : 1;
        return new Date(a.date) - new Date(b.date);
      });

    /* Past shows only what the volunteer actually gave feedback for. An
       attended activity with no feedback is not a memory worth surfacing —
       the feedback window has closed and there is nothing left to do. */
    const past = activities
      .filter((a) => a.status === 'PAST' && withFeedback.has(a.activityId))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      ...state,
      reload: load,
      register,
      current,
      past,
      awaitingFeedback: current.filter((a) => a.feedbackOpen && !a.alreadySubmitted),
      openNeeds: state.needs.filter((n) => n.status === 'OPEN'),
      counts: { current: current.length, past: past.length },
      findActivity: (id) => activities.find((a) => a.activityId === id) ?? null,
      findFeedback: (id) => feedback.find((f) => f.activityId === id) ?? null,
    };
  }, [state, load, register]);

  return <VolunteerContext.Provider value={value}>{children}</VolunteerContext.Provider>;
}

export function useVolunteer() {
  const context = useContext(VolunteerContext);
  if (!context) {
    throw new Error('useVolunteer must be used inside <VolunteerProvider>');
  }
  return context;
}
