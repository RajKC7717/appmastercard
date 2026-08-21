import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AlertCircle, ChevronDown, Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import Button from '../shared/ui/Button.jsx';
import Logo from '../shared/ui/Logo.jsx';
import { useAuth } from './AuthProvider.jsx';
import { DEMO_ACCOUNTS, SIGNUP_ROLES, homeForRole } from './authApi.js';
import styles from './AuthPage.module.css';

/**
 * Sign-in. Register: neither — it is the door all three walk through.
 *
 * Single page, one column, 440px, centred, nothing else on the screen.
 * The layout skill is explicit that splitting a two-field form into steps
 * adds friction and removes nothing, and that a progress bar on a short
 * flow implies length where there is none.
 *
 * The role dropdown is not decoration. The schema keeps NGO staff and
 * company employees in two different tables, and a company user's email
 * is unique only within their own company — so the server needs to know
 * which table to search before it can look anyone up. That is the
 * `loginType` field in the login body, chosen here.
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, busy } = useAuth();

  const [form, setForm] = useState({ role: 'VOLUNTEER', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const role = SIGNUP_ROLES.find((option) => option.value === form.role);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const fillFromDemoAccount = (account) => {
    setForm({ role: account.role, email: account.email, password: account.password });
    setError('');
  };

  const validate = () => {
    if (!form.email.trim()) return 'Enter the email address you signed up with.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'That email address is not complete.';
    if (!form.password) return 'Enter your password.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const result = await signIn({
      email: form.email.trim(),
      password: form.password,
      role: form.role,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    /* Back to wherever the guard interrupted them, or their own home. */
    const intended = location.state?.from?.pathname;
    navigate(intended ?? homeForRole(result.user.role), { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Logo sub="Volunteer experience" />
          <h1 className={styles.heading}>Sign in</h1>
          <p className={styles.subtext}>
            One door for volunteers, corporate SPOCs and the Seva Sahayog team. Your role
            decides which app opens.
          </p>
        </header>

        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="role">
              I am signing in as
            </label>
            <div className={styles.inputWrap}>
              <select
                id="role"
                name="role"
                className={styles.select}
                value={form.role}
                onChange={change}
              >
                {SIGNUP_ROLES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className={styles.selectChevron} aria-hidden="true" />
            </div>
            <p className={styles.hint}>{role?.hint}</p>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">
              Email address
            </label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                id="email"
                name="email"
                type="email"
                className={styles.input}
                value={form.email}
                onChange={change}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`${styles.input} ${styles.hasTrailing}`}
                value={form.password}
                onChange={change}
                placeholder="Your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.trailingIcon}
                onClick={() => setShowPassword((shown) => !shown)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Reserved height, so an error never shifts the button away
              from under a thumb that is already moving towards it. */}
          <div className={styles.errorSlot}>
            {error && (
              <p className={styles.errorBox} role="alert">
                <AlertCircle size={16} className={styles.errorIcon} aria-hidden="true" />
                {error}
              </p>
            )}
          </div>

          <Button type="submit" size="lg" fullWidth disabled={busy}>
            {busy && <Loader2 size={16} className={styles.spinner} aria-hidden="true" />}
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className={styles.footerText}>
          New here?{' '}
          <Link to="/signup" className={styles.toggleLink}>
            Create an account
          </Link>
        </p>
      </div>

      <section className={styles.demo} aria-labelledby="demo-heading">
        <h2 id="demo-heading" className={styles.demoTitle}>
          Demo accounts
        </h2>
        <p className={styles.demoCaption}>
          Tap one to fill the form. Each opens a different app — the same
          activity looks different from all three sides.
        </p>
        <div className={styles.demoList}>
          {DEMO_ACCOUNTS.map((account) => (
            <button
              key={account.email}
              type="button"
              className={styles.demoRow}
              onClick={() => fillFromDemoAccount(account)}
            >
              <span className={styles.demoAvatar} aria-hidden="true">
                {account.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')}
              </span>
              <span className={styles.demoText}>
                <span className={styles.demoName}>{account.name}</span>
                <span className={styles.demoDetail}>{account.detail}</span>
              </span>
              <span className={styles.demoRole}>{account.label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
