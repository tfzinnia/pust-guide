import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../../context/auth";
import Field from "../../components/ui/Field";
import { Feedback } from "../../components/ui/Feedback";
export default function Login() {
  const [params] = useSearchParams();
  const [role, setRole] = useState("student"),
    [identifier, setIdentifier] = useState(""),
    [password, setPassword] = useState(""),
    [state, setState] = useState({});
  const { login, continueAsGuest } = useAuth(),
    navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      const user = await login(identifier, password, role);
      const next = params.get("next");
      const safeNext =
        typeof next === "string" &&
        /^\/(?:complaint(?:\?category=(?:ragging|harassment|hall|transport|classroom|academic|others))?|complaint-tracking|departments|saved|notifications|settings)$/.test(
          next,
        );
      navigate(
        user.role === "student" && safeNext
          ? next
          : user.role === "super_admin"
            ? "/admin"
            : user.role === "teacher"
              ? "/teacher"
              : "/",
      );
    } catch (error) {
      setState({
        error:
          error.response?.data?.message ||
          "Unable to sign in. Check your connection.",
      });
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-emerald-50 p-6">
      <div className="w-full max-w-md">
        <div className="mb-7 text-center">
          <GraduationCap className="mx-auto text-blue-600" size={48} />
          <h1 className="mt-3 text-3xl font-bold">PUST Guide</h1>
          <p className="mt-2 text-slate-500">
            Everything you need for campus life.
          </p>
        </div>
        <form className="card p-6" onSubmit={submit}>
          <div
            className="mb-6 flex gap-2"
            role="group"
            aria-label="Account type"
          >
            {[
              ["student", "Student"],
              ["teacher", "Teacher"],
              ["super_admin", "Admin"],
            ].map(([key, label]) => (
              <button
                type="button"
                key={key}
                aria-pressed={role === key}
                className={`${role === key ? "btn-primary" : "btn-secondary"} flex-1`}
                onClick={() => {
                  setRole(key);
                  setState({});
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <Feedback {...state} />
          <Field
            name="login-identifier"
            label={
              role === "student"
                ? "Email or student roll"
                : role === "teacher"
                  ? "Email or teacher ID"
                  : "Admin email"
            }
            value={identifier}
            onChange={setIdentifier}
            autoComplete="username"
            maxLength={254}
            required
          />
          <Field
            name="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
          <Link
            className="mb-5 block text-right text-sm text-blue-700"
            to="/forgot-password"
          >
            Forgot password?
          </Link>
          <button className="btn-primary w-full" disabled={state.busy}>
            {state.busy ? "Signing in…" : "Sign in"}
          </button>
          <p className="mt-5 text-center text-sm text-slate-600">
            New student?{" "}
            <Link className="font-semibold text-blue-700" to="/signup">
              Create an account
            </Link>
          </p>
        </form>
        <button
          className="btn-secondary mt-4 w-full"
          onClick={() => {
            continueAsGuest();
            navigate("/");
          }}
        >
          Continue as guest
        </button>
        <Link
          className="mt-4 block text-center text-sm font-semibold text-red-700"
          to="/emergency"
        >
          Emergency contacts
        </Link>
      </div>
    </main>
  );
}
