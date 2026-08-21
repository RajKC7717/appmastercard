import styles from './Logo.module.css';

/**
 * Seva Sahayog mark. Inline SVG — no network request, crisp at any size,
 * and it survives a bad connection at the venue.
 *
 * Two cupped hands holding a sapling: the in-kind collection and the
 * plantation drives, which is what the Foundation actually does.
 *
 * `sub` is the one thing that changes between the three role apps. The
 * mark, the wordmark and the type stay identical, so a volunteer, an NGO
 * admin and a corporate SPOC are visibly inside the same product — the
 * sub-label is what tells them which door they came in through.
 */
export default function Logo({ showWordmark = true, sub = 'Volunteer' }) {
  return (
    <span className={styles.logo}>
      <svg
        className={styles.mark}
        viewBox="0 0 40 40"
        role="img"
        aria-label="Seva Sahayog"
      >
        <circle cx="20" cy="20" r="20" fill="var(--color-primary)" />
        {/* sapling */}
        <path
          d="M20 22V13"
          stroke="var(--color-accent)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20 16c0-3-2.4-5-5-5 0 3 2.4 5 5 5Z"
          fill="var(--color-accent)"
        />
        <path
          d="M20 18c0-3 2.4-5 5-5 0 3-2.4 5-5 5Z"
          fill="var(--color-tint)"
        />
        {/* cupped hands */}
        <path
          d="M11 23c0 5 4 8 9 8s9-3 9-8"
          stroke="var(--color-tint)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showWordmark && (
        <span className={styles.wordmark}>
          <span className={styles.name}>Seva Sahayog</span>
          <span className={styles.sub}>{sub}</span>
        </span>
      )}
    </span>
  );
}
