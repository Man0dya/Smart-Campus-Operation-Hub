import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthContext from "../context/auth-context";
import { loginLocalUser, registerLocalUser } from "../services/authApi";

const initialForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function LoginPage() {
  const navigate = useNavigate();
  const { setUser, fetchUser } = useContext(AuthContext);
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const routeByRole = (role) => {
    if (role === "ADMIN") return "/admin";
    if (role === "TECHNICIAN") return "/admin/tickets";
    return "/dashboard";
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:8080/oauth2/authorization/google";
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocalLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

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
    setSubmitting(true);
    setError("");
    setMessage("");

    if (!form.name.trim()) {
      setError("Name is required.");
      setSubmitting(false);
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      setSubmitting(false);
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match.");
      setSubmitting(false);
      return;
    }

    try {
      await registerLocalUser({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setMessage("Account created. You can now log in as USER.");
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setMode("login");
    } catch (err) {
      setError(err?.response?.data?.error || "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl backdrop-blur md:grid-cols-2 md:p-10">
        <section className="space-y-5">
          <p className="chip">University Operations Platform</p>
          <h1 className="text-3xl font-extrabold leading-tight text-slate-900 md:text-4xl">
            Smart Campus Operations Hub
          </h1>
          <p className="text-sm text-slate-600 md:text-base">
            Manage resource bookings, maintenance tickets, and notifications through role-based workflows.
          </p>
          <div className="grid gap-3 text-sm text-slate-700">
            <p className="panel">New accounts are created as USER by default</p>
            <p className="panel">Admin can promote users to TECHNICIAN or ADMIN</p>
            <p className="panel">Use Google or local email-password authentication</p>
          </div>
        </section>

        <section className="panel flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
              }`}
              onClick={() => {
                setMode("register");
                setError("");
                setMessage("");
              }}
              type="button"
            >
              Create Account
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLocalLogin} className="grid gap-3">
              <h2 className="text-xl font-bold text-slate-900">Sign in with Email</h2>
              <input
                className="field"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                className="field"
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Signing in..." : "Login"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="grid gap-3">
              <h2 className="text-xl font-bold text-slate-900">Create Local Account</h2>
              <input
                className="field"
                type="text"
                name="name"
                placeholder="Full name"
                value={form.name}
                onChange={handleChange}
                required
              />
              <input
                className="field"
                type="email"
                name="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
              />
              <input
                className="field"
                type="password"
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <input
                className="field"
                type="password"
                name="confirmPassword"
                placeholder="Confirm password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <button className="btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}

          <div className="my-1 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            <span>or</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button className="btn-secondary" onClick={handleGoogleLogin} type="button">
            Continue with Google
          </button>

          {message && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p>}
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        </section>
      </div>
    </div>
  );
}

export default LoginPage;