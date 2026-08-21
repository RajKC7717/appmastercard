import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import styles from './Toast.module.css';

const ToastContext = createContext(null);

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info };

/**
 * Toasts with an optional undo action.
 *
 * This is the pattern every staff action uses instead of a confirmation
 * modal: do the thing immediately, show what happened, and offer to put
 * it back. A coordinator performing an action forty times a day should
 * not be asked "are you sure?" forty times — the undo costs them nothing
 * when they were sure, and saves them everything when they were not.
 *
 * A toast carrying an undo lives longer than a plain one, because reading
 * it, deciding, and reaching the button all take time.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const notify = useCallback(
    ({ message, tone = 'success', action, actionLabel = 'Undo' }) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((current) => [...current.slice(-2), { id, message, tone, action, actionLabel }]);

      const timer = window.setTimeout(() => dismiss(id), action ? 8000 : 4000);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  /* Clearing on unmount stops a timer firing into a gone component. */
  useEffect(() => {
    const store = timers.current;
    return () => store.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo(() => ({ notify, dismiss }), [notify, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICON[toast.tone] ?? Info;
          return (
            <div key={toast.id} className={`${styles.toast} ${styles[toast.tone]}`}>
              <Icon size={18} className={`${styles.icon} ${styles[`${toast.tone}Icon`]}`} aria-hidden="true" />
              <p className={styles.message}>{toast.message}</p>
              {toast.action && (
                <button
                  type="button"
                  className={styles.action}
                  onClick={() => {
                    toast.action();
                    dismiss(toast.id);
                  }}
                >
                  {toast.actionLabel}
                </button>
              )}
              <button
                type="button"
                className={styles.dismiss}
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
