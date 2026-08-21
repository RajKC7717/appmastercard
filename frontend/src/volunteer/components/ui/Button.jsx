import { Link } from 'react-router-dom';
import styles from './Button.module.css';

/**
 * The only button in the app.
 * variant: primary | secondary | ghost | danger
 * size:    md (40px) | lg (56px, thumb-zone)
 * Renders a real <button> or a real <Link>. Never a clickable div.
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon: Icon,
  iconRight = false,
  to,
  href,
  className = '',
  ...rest
}) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  /* Icons are decorative here — every button already carries its text label. */
  const content = (
    <>
      {Icon && !iconRight && <Icon className={styles.icon} aria-hidden="true" />}
      <span className={styles.label}>{children}</span>
      {Icon && iconRight && <Icon className={styles.icon} aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      {content}
    </button>
  );
}
