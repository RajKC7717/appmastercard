import { useEffect, useId, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import styles from './Form.module.css';

/**
 * Every form control in the consoles, in one file.
 *
 * The rule they all obey: a visible label above the field, always. A
 * placeholder is a hint, never a label — it vanishes the moment someone
 * starts typing, which is exactly when they most want to check what the
 * field was asking for.
 */

export function Field({ label, htmlFor, hint, error, children, required = false }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={htmlFor}>
        {label}
        {required && <span className={styles.required} aria-hidden="true"> *</span>}
      </label>
      {children}
      {/* Reserved, so validating a field never nudges the next one down. */}
      <div className={styles.slot}>
        {error ? (
          <p className={styles.error} role="alert">
            {error}
          </p>
        ) : (
          hint && <p className={styles.hint}>{hint}</p>
        )}
      </div>
    </div>
  );
}

export function TextInput({ invalid = false, className = '', ...rest }) {
  return <input className={`${styles.control} ${invalid ? styles.invalid : ''} ${className}`} {...rest} />;
}

export function TextArea({ invalid = false, rows = 4, className = '', ...rest }) {
  return (
    <textarea
      rows={rows}
      className={`${styles.control} ${styles.textarea} ${invalid ? styles.invalid : ''} ${className}`}
      {...rest}
    />
  );
}

export function SelectInput({ options, placeholder, invalid = false, className = '', ...rest }) {
  return (
    <select className={`${styles.control} ${styles.select} ${invalid ? styles.invalid : ''} ${className}`} {...rest}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => {
        const { value, label } = typeof option === 'string' ? { value: option, label: option } : option;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

/**
 * Debounced search. Every list in the consoles has one, and every one of
 * them waits 250ms before filtering — a filter that runs on each keystroke
 * over a few hundred rows makes the input itself feel laggy, which reads
 * as the whole app being slow.
 */
export function SearchInput({ value, onChange, placeholder = 'Search', label, delay = 250 }) {
  const id = useId();
  const [draft, setDraft] = useState(value);

  /* The latest handler in a ref, so the debounce timer below never
     restarts just because the parent re-rendered with a new closure. */
  const latest = useRef(onChange);
  useEffect(() => {
    latest.current = onChange;
  }, [onChange]);

  /* An external reset (clearing all filters) has to reach the input. */
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) return undefined;
    const timer = window.setTimeout(() => latest.current(draft), delay);
    return () => window.clearTimeout(timer);
  }, [draft, delay, value]);

  return (
    <div className={styles.searchField}>
      <label className={styles.searchLabel} htmlFor={id}>
        {label ?? placeholder}
      </label>
      <div className={styles.searchWrap}>
        <Search size={16} className={styles.searchIcon} aria-hidden="true" />
        <input
          id={id}
          type="search"
          className={`${styles.control} ${styles.search}`}
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
        />
        {draft && (
          <button
            type="button"
            className={styles.clear}
            onClick={() => {
              setDraft('');
              latest.current('');
            }}
          >
            <X size={14} aria-hidden="true" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
