import { useState, useEffect } from "react";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import Field from "../../components/ui/Field";
import { Feedback, DataState } from "../../components/ui/Feedback";
import { useAuth } from "../../context/auth";
import api from "../../api/axios";
import useApi from "../../hooks/useApi";
import { SEMESTERS, YEARS, SESSIONS } from "../../utils/constants";
import { clearOfflineData } from "../../utils/offline";
export default function Settings() {
  const { user, updateUser } = useAuth();
  return (
    <AppLayout>
      <PageHeader
        title="Profile & account settings"
        subtitle="Keep your account and academic information up to date"
        back
      />
      <main className="page-pad space-y-6 py-6">
        <ProfileForm user={user} updateUser={updateUser} />
        <PasswordForm />
        {user?.role === "student" && (
          <AcademicForm user={user} updateUser={updateUser} />
        )}
        <OfflineSettings />
      </main>
    </AppLayout>
  );
}
function ProfileForm({ user, updateUser }) {
  const [form, setForm] = useState({
      name: user.name,
      email: user.email,
      current_password: "",
    }),
    [state, setState] = useState({});
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      const response = await api.patch("/auth/profile", form);
      updateUser(response.data.user);
      setForm({ ...form, current_password: "" });
      setState({ success: response.data.message });
    } catch (error) {
      setState({
        error:
          error.response?.data?.message || "Could not update your profile.",
      });
    }
  }
  return (
    <form className="card p-6" onSubmit={submit}>
      <h2 className="mb-5 text-lg font-bold">Personal information</h2>
      <Feedback {...state} />
      <Field
        name="profile-name"
        label="Full name"
        value={form.name}
        onChange={(name) => setForm({ ...form, name })}
        maxLength={120}
        required
        autoComplete="name"
      />
      <Field
        name="profile-email"
        label="Email"
        type="email"
        value={form.email}
        onChange={(email) => setForm({ ...form, email })}
        required
        autoComplete="email"
      />
      {form.email !== user.email && (
        <Field
          name="profile-password"
          type="password"
          label="Current password to confirm email change"
          value={form.current_password}
          onChange={(current_password) =>
            setForm({ ...form, current_password })
          }
          autoComplete="current-password"
          required
        />
      )}
      <button className="btn-primary" disabled={state.busy}>
        Save profile
      </button>
    </form>
  );
}
function PasswordForm() {
  const [form, setForm] = useState({ current_password: "", new_password: "" }),
    [state, setState] = useState({});
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      const response = await api.patch("/auth/password", form);
      localStorage.setItem("pust_token", response.data.token);
      setForm({ current_password: "", new_password: "" });
      setState({ success: response.data.message });
    } catch (error) {
      setState({
        error:
          error.response?.data?.message || "Could not change your password.",
      });
    }
  }
  return (
    <form onSubmit={submit} className="card p-6">
      <h2 className="mb-5 text-lg font-bold">Change password</h2>
      <Feedback {...state} />
      <Field
        name="current-password"
        type="password"
        label="Current password"
        value={form.current_password}
        onChange={(current_password) => setForm({ ...form, current_password })}
        autoComplete="current-password"
        required
      />
      <Field
        name="new-password"
        type="password"
        label="New password (at least 10 characters)"
        value={form.new_password}
        onChange={(new_password) => setForm({ ...form, new_password })}
        autoComplete="new-password"
        minLength={10}
        maxLength={72}
        required
      />
      <button disabled={state.busy} className="btn-primary">
        Update password
      </button>
    </form>
  );
}
function AcademicForm({ user, updateUser }) {
  const [form, setForm] = useState({
      session: user.session,
      year: user.year,
      semester: user.semester,
    }),
    [state, setState] = useState({});
  const request = useApi("/users/academic-requests/my");
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      const response = await api.post("/users/academic-requests", form);
      setState({ success: response.data.message });
      request.refetch();
    } catch (error) {
      setState({
        error: error.response?.data?.message || "Could not send your request.",
      });
    }
  }
  async function sync() {
    try {
      const response = await api.get("/auth/me");
      updateUser(response.data.user);
      setState({ success: "Academic profile refreshed." });
    } catch {
      setState({ error: "Could not refresh your profile." });
    }
  }
  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold">Academic profile</h2>
      <p className="mb-4 mt-2 text-sm text-slate-500">
        Current: {user.session} · {user.year} · {user.semester}. Changes take
        effect after administrator approval.
      </p>
      <Feedback {...state} />
      <form onSubmit={submit}>
        {[
          ["session", "Session", SESSIONS],
          ["year", "Year", YEARS],
          ["semester", "Semester", SEMESTERS],
        ].map(([key, label, options]) => (
          <Field
            key={key}
            name={`request-${key}`}
            label={label}
            options={options}
            value={form[key]}
            onChange={(value) => setForm({ ...form, [key]: value })}
            required
          />
        ))}
        <button
          className="btn-primary"
          disabled={
            state.busy ||
            request.data?.some((item) => item.status === "pending")
          }
        >
          Request academic change
        </button>
        <button
          type="button"
          className="btn-secondary ml-2 mt-2"
          onClick={sync}
        >
          Refresh current profile
        </button>
      </form>
      <div className="mt-5">
        <DataState request={request}>
          {request.data?.slice(0, 5).map((item) => (
            <p key={item.id} className="border-t py-3 text-sm">
              {item.session} · {item.year} · {item.semester} —{" "}
              <b className="capitalize">{item.status}</b>
            </p>
          ))}
        </DataState>
      </div>
    </section>
  );
}
function OfflineSettings() {
  const [message, setMessage] = useState(""),
    [prompt, setPrompt] = useState(() => window.pustInstallPrompt || null);
  // The install button is available when the browser offers installation.
  useEffect(() => {
    const capture = () => setPrompt(window.pustInstallPrompt);
    window.addEventListener("pust:install-available", capture);
    return () => window.removeEventListener("pust:install-available", capture);
  }, []);
  return (
    <section className="card p-6">
      <h2 className="text-lg font-bold">Offline & installation</h2>
      <p className="my-3 text-sm leading-6 text-slate-500">
        Previously viewed schedules, syllabus, and verified contacts stay on
        this device. Download syllabus PDFs to keep them offline. You can also
        install PUST Guide through your browser’s “Install app” or “Add to Home
        Screen” option.
      </p>
      {prompt && (
        <button
          className="btn-primary mr-3"
          onClick={async () => {
            await prompt.prompt();
            window.pustInstallPrompt = null;
            setPrompt(null);
          }}
        >
          Install PUST Guide
        </button>
      )}
      <button
        className="btn-secondary"
        onClick={() => {
          clearOfflineData({ includeProfile: false });
          setMessage("Offline copies have been removed from this device.");
        }}
      >
        Clear offline copies
      </button>
      {message && (
        <p role="status" className="mt-3 text-sm text-green-700">
          {message}
        </p>
      )}
    </section>
  );
}
