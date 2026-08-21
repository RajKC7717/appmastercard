import styles from './Button.module.css'

function Button({ children, variant = 'primary', icon: Icon, onClick, type = 'button' }) {
  return (
    <button
      type={type}
      className={variant === 'primary' ? styles.primary : styles.secondary}
      onClick={onClick}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

export default Button
