import { useState } from "react";
import { Link } from "react-router-dom";
import Field from "../../components/ui/Field";
import { Feedback } from "../../components/ui/Feedback";
import api from "../../api/axios";
export default function Recovery({ reset = false }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [state, setState] = useState({});
  const [token] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get("token") || "",
  );
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      const response = await api.post(
        reset ? "/auth/reset-password" : "/auth/forgot-password",
        reset ? { password, token } : { email },
      );
      setState({ success: response.data.message });
      setPassword("");
    } catch (error) {
      setState({
        error:
          error.response?.data?.message || "Could not process this request.",
      });
    }
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form className="card w-full max-w-md p-7" onSubmit={submit}>
        <h1 className="mb-3 text-2xl font-bold">
          {reset ? "Set a new password" : "Recover your account"}
        </h1>
        <p className="mb-5 text-sm text-slate-500">
          {reset
            ? "Reset links expire after 30 minutes and can be used once."
            : "Enter your account email to request a password reset link."}
        </p>
        <Feedback {...state} />
        {reset ? (
          <Field
            name="reset-password"
            label="New password"
            type="password"
            minLength={10}
            maxLength={72}
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            required
          />
        ) : (
          <Field
            name="recovery-email"
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
            required
          />
        )}
        <button
          className="btn-primary w-full"
          disabled={state.busy || (reset && !token)}
        >
          {state.busy
            ? "Please wait…"
            : reset
              ? "Reset password"
              : "Request reset link"}
        </button>
        {reset && !token && (
          <p role="alert" className="mt-3 text-sm text-red-700">
            Open the complete reset link provided in your email or by your
            administrator.
          </p>
        )}
        <Link
          className="mt-5 block text-sm font-semibold text-blue-700"
          to="/login"
        >
          ← Back to sign in
        </Link>
      </form>
    </main>
  );
}
