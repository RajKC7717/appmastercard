// src/pages/AuthPage.jsx
import { useState } from "react";
import { Mail, Lock, User, Phone, Eye, EyeOff, ChevronDown, HeartHandshake, Loader2 } from "lucide-react";
import Button from "../components/Button/Button";
import { registerUser, loginUser } from "../api/authApi";
import styles from "./AuthPage.module.css";

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "spoc", label: "Corporate SPOC" },
  { value: "volunteer", label: "Volunteer" },
];

const EMPTY_FORM = { username: "", contactNumber: "", email: "", password: "", role: "" };

export default function AuthPage({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function switchMode(toLogin) {
    setIsLogin(toLogin);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setError("");
  }

  function validate() {
    if (!form.role) return "Please select a role.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Enter a valid email.";
    if (!form.password || form.password.length < 6) return "Password must be at least 6 characters.";
    if (!isLogin) {
      if (!form.username.trim()) return "Username is required.";
      if (!form.contactNumber.trim()) return "Contact number is required.";
      if (!/^\d{10}$/.test(form.contactNumber.trim())) return "Enter a valid 10-digit contact number.";
    }
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = isLogin
        ? await loginUser({ email: form.email, password: form.password })
        : await registerUser(form);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      setForm(EMPTY_FORM);
      if (onAuthSuccess) onAuthSuccess(data.user, isLogin ? "login" : "signup");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>
            <HeartHandshake size={22} />
          </div>
          <span className={styles.brandName}>SEVASAHAYOG</span>
          <h1 className={styles.heading}>{isLogin ? "Welcome back" : "Create your account"}</h1>
          <p className={styles.subtext}>
            {isLogin ? "Login to continue to your account." : "Sign up to start sharing your feedback."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
          <div className={styles.field}>
            <label className={styles.label}>Role</label>
            <div className={styles.inputWrap}>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={styles.select}
                autoComplete="off"
              >
                <option value="" disabled>
                  Select role
                </option>
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className={styles.selectChevron} />
            </div>
          </div>

          {!isLogin && (
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <div className={styles.inputWrap}>
                <User size={16} className={styles.inputIcon} />
                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Enter your username"
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          {!isLogin && (
            <div className={styles.field}>
              <label className={styles.label}>Contact Number</label>
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input
                  type="tel"
                  name="contactNumber"
                  value={form.contactNumber}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  autoComplete="off"
                />
              </div>
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.label}>Email ID</label>
            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                placeholder="Enter your email"
                autoComplete="off"
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`${styles.input} ${styles.hasTrailing}`}
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.trailingIcon}
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p className={styles.errorBox}>{error}</p>}

          <Button type="submit" disabled={loading}>
            {loading && <Loader2 size={16} className={styles.spinner} />}
            {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
          </Button>
        </form>

        <p className={styles.footerText}>
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button type="button" className={styles.toggleLink} onClick={() => switchMode(!isLogin)}>
            {isLogin ? "Sign Up" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
}