import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Building2,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import Button from '../shared/ui/Button.jsx';
import Logo from '../shared/ui/Logo.jsx';
import { companies } from '../shared/data/orgData.js';
import { useAuth } from './AuthProvider.jsx';
import { COMPANY_ROLES, SIGNUP_ROLES, homeForRole } from './authApi.js';
import styles from './AuthPage.module.css';

/**
 * ONE sign-up page for all three roles, with the role chosen from a
 * dropdown at the top.
 *
 * Six fields at most — role, company, name, mobile, email, password — so
 * this stays a single page. Below roughly six fields a one-page form beats
 * a multi-step one, and a progress bar over three steps would advertise
 * length that is not there.
 *
 * Two field decisions worth defending:
 *
 *  • ONE full-name field. Indian names do not split reliably into first
 *    and last, and splitting them produces bad data and irritated users.
 *
 *  • The company dropdown appears only for a volunteer or a SPOC, because
 *    a company user has exactly one company (RULE 1) and an NGO user has
 *    none at all (RULE 4). Asking a Foundation admin which corporate
 *    partner they belong to would be asking a question with no answer.
 */
export default function SignupPage() {
  const navigate = useNavigate();
  const { signUp, busy } = useAuth();

  const [form, setForm] = useState({
    role: 'VOLUNTEER',
    companyId: '',
    name: '',
    phone: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const role = SIGNUP_ROLES.find((option) => option.value === form.role);
  const needsCompany = COMPANY_ROLES.includes(form.role);
  const activeCompanies = companies.filter((company) => !company.deletedAt);

  const change = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  };

  const validate = () => {
    if (!form.name.trim()) return 'Enter your full name.';
    if (needsCompany && !form.companyId) return 'Choose the company you work for.';
    /* Ten digits, no country code — the number the NGO already uses to
       reach people, and the natural deduplication key. */
    if (!/^\d{10}$/.test(form.phone.trim())) return 'Enter a 10-digit mobile number.';
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (form.password.length < 8) return 'Use a password of at least 8 characters.';
    return '';
  };

  const submit = async (event) => {
    event.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }

    const result = await signUp({
      role: form.role,
      companyId: needsCompany ? form.companyId : null,
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate(homeForRole(result.user.role), { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <header className={styles.header}>
          <Logo sub="Volunteer experience" />
          <h1 className={styles.heading}>Create your account</h1>
          <p className={styles.subtext}>
            Choose your role first — it decides which app opens after you sign up.
          </p>
        </header>

        <form className={styles.form} onSubmit={submit} noValidate>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="role">
              I am joining as
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

          {needsCompany && (
            <div className={styles.field}>
              <label className={styles.label} htmlFor="companyId">
                Your company
              </label>
              <div className={styles.inputWrap}>
                <Building2 size={16} className={styles.inputIcon} aria-hidden="true" />
                <select
                  id="companyId"
                  name="companyId"
                  className={styles.select}
                  value={form.companyId}
                  onChange={change}
                >
                  <option value="">Choose your company</option>
                  {activeCompanies.map((company) => (
                    <option key={company.companyId} value={company.companyId}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className={styles.selectChevron} aria-hidden="true" />
              </div>
              <p className={styles.hint}>
                Not listed? Ask your CSR team to get your company onboarded first.
              </p>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label} htmlFor="name">
              Full name
            </label>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                id="name"
                name="name"
                type="text"
                className={styles.input}
                value={form.name}
                onChange={change}
                placeholder="Rajesh Kulkarni"
                autoComplete="name"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="phone">
              Mobile number
            </label>
            <div className={styles.inputWrap}>
              <Phone size={16} className={styles.inputIcon} aria-hidden="true" />
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                className={styles.input}
                value={form.phone}
                onChange={change}
                placeholder="10-digit number"
                autoComplete="tel-national"
              />
            </div>
            <p className={styles.hint}>This is how a coordinator reaches you on the day.</p>
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
                placeholder="At least 8 characters"
                autoComplete="new-password"
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
            {busy ? 'Creating your account…' : 'Create account'}
          </Button>
        </form>

        <p className={styles.footerText}>
          Already have an account?{' '}
          <Link to="/login" className={styles.toggleLink}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
