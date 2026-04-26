import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FiEye, FiEyeOff } from "react-icons/fi";
import AuthContext from "../context/auth-context";
import { loginLocalUser, registerLocalUser } from "../services/authApi";
import FloatingToast from "../components/common/FloatingToast";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const authServerOrigin = import.meta.env.VITE_API_ORIGIN || "http://localhost:8080";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateLoginForm = ({ email, password }) => {
  const errors = {};

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password.trim()) {
    errors.password = "Password is required.";
  }

  return errors;
};

const validateRegisterForm = ({ name, email, password, confirmPassword }) => {
  const errors = {};

  if (!name.trim()) {
    errors.name = "Full name is required.";
  } else if (name.trim().length < 2) {
    errors.name = "Full name must be at least 2 characters.";
  }

  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!EMAIL_REGEX.test(email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!password.trim()) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }

  if (!confirmPassword.trim()) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Password and confirm password do not match.";
  }

  return errors;
};

function LoginPage() {
  const navigate = useNavigate();
  const { setUser, fetchUser } = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", type: "success" });
  const [submitting, setSubmitting] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const loginErrors = validateLoginForm(form);
  const registerErrors = validateRegisterForm(form);
  const activeErrors = mode === "login" ? loginErrors : registerErrors;
  const hasValidationErrors = Object.keys(activeErrors).length > 0;

  const showToast = (message, type = "success") => {
    setToast({ open: true, message, type });
  };

  const routeByRole = (role) => {
    if (role === "ADMIN") return "/admin";
    if (role === "TECHNICIAN") return "/technician/dashboard";
    return "/dashboard";
  };

  const handleGoogleLogin = () => {
    window.location.href = `${authServerOrigin}/oauth2/authorization/google`;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (error) {
      setError("");
    }
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleLocalLogin = async (event) => {
    event.preventDefault();
    setError("");

    setTouched((prev) => ({ ...prev, email: true, password: true }));
    if (Object.keys(loginErrors).length > 0) {
      setError(Object.values(loginErrors)[0]);
      return;
    }

    setSubmitting(true);

    try {
      await loginLocalUser({
        email: form.email,
        password: form.password,
      });

      const meRes = await fetchUser();
      const nextUser = meRes?.data;
      if (nextUser) {
        setUser(nextUser);
        navigate(routeByRole(nextUser.role), { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setError("");

    setTouched((prev) => ({
      ...prev,
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
    }));
    if (Object.keys(registerErrors).length > 0) {
      setError(Object.values(registerErrors)[0]);
      return;
    }

    setSubmitting(true);

    try {
      await registerLocalUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      showToast("Account created. You can now log in as USER.");
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setTouched({});
      setShowRegisterPassword(false);
      setShowConfirmPassword(false);
      setMode("login");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setTouched({});
    setError("");
    setShowLoginPassword(false);
    setShowRegisterPassword(false);
    setShowConfirmPassword(false);
  };

  const fieldClass = (fieldName) =>
    `field ${touched[fieldName] && activeErrors[fieldName] ? "border-rose-400 focus:border-rose-400" : ""}`;

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <div className="grid min-h-screen w-full overflow-hidden bg-white md:grid-cols-[1.15fr_1fr]">
        <section className="relative border-b border-slate-200 bg-slate-900 p-7 text-slate-100 md:border-b-0 md:border-r md:border-slate-800 md:p-12 overflow-hidden flex flex-col justify-end">
          <div className="absolute inset-0">
            <img src="/campus-login-bg.png" alt="Campus Background" className="h-full w-full object-cover opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/10"></div>
          </div>

          <div className="relative space-y-6 fade-up">
            <p className="inline-flex items-center rounded-full border border-slate-500/50 bg-slate-900/60 backdrop-blur-md px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-200">
              Smart Campus Hub
            </p>

            <div>
              <h1 className="text-3xl font-bold leading-tight text-white md:text-4xl">
                Unified campus operations,
                <br />
                one secure login.
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base max-w-md">
                Access bookings, maintenance workflows, and notifications with role-aware controls for students,
                technicians, and administrators.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-slate-200">
              <div className="rounded-xl border border-slate-600/50 bg-slate-900/50 backdrop-blur-md px-3 py-2.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                OAuth with Google and secure local account login
              </div>
              <div className="rounded-xl border border-slate-600/50 bg-slate-900/50 backdrop-blur-md px-3 py-2.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                Role-based destinations: USER, TECHNICIAN, ADMIN
              </div>
              <div className="rounded-xl border border-slate-600/50 bg-slate-900/50 backdrop-blur-md px-3 py-2.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
                Centralized access to resources, bookings, and tickets
              </div>
            </div>
          </div>
        </section>

        <section className="fade-up stagger-1 flex min-h-screen flex-col justify-center gap-5 bg-white p-6 md:p-12">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="mt-1 text-sm text-slate-500">
              {mode === "login"
                ? "Sign in to continue to your operations dashboard"
                : "Create your account to access Smart Campus Hub"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => switchMode("login")}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "border-slate-300 bg-white text-slate-900 shadow-sm"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => switchMode("register")}
              type="button"
            >
              Register
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLocalLogin} className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Email</label>
              <input
                className={fieldClass("email")}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.email && loginErrors.email && <p className="text-xs text-rose-600">{loginErrors.email}</p>}
              <label className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Password</label>
              <div className="relative">
                <input
                  className={`${fieldClass("password")} pr-10`}
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 inline-flex items-center text-slate-500 transition hover:text-slate-700"
                  aria-label={showLoginPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowLoginPassword((prev) => !prev)}
                >
                  {showLoginPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && loginErrors.password && <p className="text-xs text-rose-600">{loginErrors.password}</p>}
              <button className="btn-primary mt-2" type="submit" disabled={submitting || hasValidationErrors}>
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Full Name</label>
              <input
                className={fieldClass("name")}
                type="text"
                name="name"
                placeholder="Your full name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.name && registerErrors.name && <p className="text-xs text-rose-600">{registerErrors.name}</p>}
              <label className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Email</label>
              <input
                className={fieldClass("email")}
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={handleBlur}
                required
              />
              {touched.email && registerErrors.email && <p className="text-xs text-rose-600">{registerErrors.email}</p>}
              <label className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Password</label>
              <div className="relative">
                <input
                  className={`${fieldClass("password")} pr-10`}
                  type={showRegisterPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 inline-flex items-center text-slate-500 transition hover:text-slate-700"
                  aria-label={showRegisterPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowRegisterPassword((prev) => !prev)}
                >
                  {showRegisterPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {touched.password && registerErrors.password && <p className="text-xs text-rose-600">{registerErrors.password}</p>}
              <label className="mt-1 text-xs font-semibold uppercase tracking-[0.11em] text-slate-500">Confirm Password</label>
              <div className="relative">
                <input
                  className={`${fieldClass("confirmPassword")} pr-10`}
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 inline-flex items-center text-slate-500 transition hover:text-slate-700"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                >
                  {showConfirmPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
              {touched.confirmPassword && registerErrors.confirmPassword && (
                <p className="text-xs text-rose-600">{registerErrors.confirmPassword}</p>
              )}
              <button className="btn-primary mt-2" type="submit" disabled={submitting || hasValidationErrors}>
                {submitting ? "Creating account..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="my-1 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={handleGoogleLogin}
            type="button"
          >
            <FcGoogle className="h-5 w-5" />
            Continue with Google
          </button>

          {error && <p className="status-error rounded-xl px-3 py-2 text-sm">{error}</p>}

          <FloatingToast
            open={toast.open}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          />
        </section>
      </div>
    </div>
  );
}

export default LoginPage;