import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

/**
 * A dialog — STAFF SCREENS ONLY.
 *
 * Beneficiary screens get full screens instead: on a small viewport a
 * modal means a focus trap and a dismissal target the size of a fingernail.
 * On a desktop console, where an admin is creating an activity without
 * losing the list they were looking at, a dialog is the right control.
 *
 * Escape closes it, focus moves inside on open and returns to whatever
 * opened it on close, and the page behind does not scroll.
 */
export default function Modal({ open, onClose, title, description, children, footer }) {
  const panel = useRef(null);
  const opener = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    opener.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    /* Focus the panel itself rather than the first field: a dialog that
       opens with a text cursor already blinking hides its own heading
       from a screen reader. */
    panel.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      opener.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div
        ref={panel}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
      >
        <header className={styles.head}>
          <div>
            <h2 id="modal-title" className={styles.title}>
              {title}
            </h2>
            {description && <p className={styles.description}>{description}</p>}
          </div>
          <button type="button" className={styles.close} onClick={onClose}>
            <X size={16} aria-hidden="true" />
            Close
          </button>
        </header>

        <div className={styles.body}>{children}</div>

        {footer && <footer className={styles.footer}>{footer}</footer>}
      </div>
    </div>
  );
}
