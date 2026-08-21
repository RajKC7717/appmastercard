// src/components/Button/Button.jsx
import styles from "./Button.module.css";

export default function Button({
  children,
  variant = "primary",
  type = "button",
  disabled = false,
  onClick,
  ...rest
}) {
  const variantClass = variant === "secondary" ? styles.secondary : styles.primary;
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${styles.button} ${variantClass}`}
      {...rest}
    >
      {children}
    </button>
  );
}