import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/auth";
import { DataState, Feedback } from "../../components/ui/Feedback";
import Field from "../../components/ui/Field";
import useApi from "../../hooks/useApi";
import { SESSIONS, YEARS, SEMESTERS } from "../../utils/constants";
export default function Signup() {
  const [form, setForm] = useState({
      name: "",
      email: "",
      roll: "",
      department_id: "",
      session: "",
      year: "",
      semester: "",
      password: "",
    }),
    [state, setState] = useState({});
  const { studentSignup } = useAuth(),
    navigate = useNavigate(),
    departments = useApi("/departments");
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      await studentSignup(form);
      navigate("/login");
    } catch (error) {
      setState({
        error:
          error.response?.data?.message || "Could not create your account.",
      });
    }
  }
  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <Link to="/login" className="text-sm font-semibold text-blue-700">
        ← Back to sign in
      </Link>
      <h1 className="mb-2 mt-6 text-3xl font-bold">Join your campus</h1>
      <p className="mb-6 text-sm text-slate-500">
        Your academic details determine which schedules and notices you receive.
      </p>
      <DataState request={departments}>
        <form className="card p-6" onSubmit={submit}>
          <Feedback {...state} />
          {[
            ["name", "Full name", "text"],
            ["email", "Email", "email"],
            ["roll", "Student roll", "text"],
            [
              "department_id",
              "Department",
              "select",
              departments.data?.map((row) => ({
                label: row.name,
                value: row.id,
              })) || [],
            ],
            ["session", "Session", "select", SESSIONS],
            ["year", "Year", "select", YEARS],
            ["semester", "Semester", "select", SEMESTERS],
            ["password", "Password (at least 10 characters)", "password"],
          ].map(([key, label, type, options]) => (
            <Field
              key={key}
              name={`signup-${key}`}
              label={label}
              type={type === "select" ? "text" : type}
              options={options}
              value={form[key]}
              onChange={(value) => setForm({ ...form, [key]: value })}
              required
              {...(type === "password"
                ? { minLength: 10, maxLength: 72, autoComplete: "new-password" }
                : {})}
            />
          ))}
          <button className="btn-primary w-full" disabled={state.busy}>
            {state.busy ? "Creating account…" : "Create student account"}
          </button>
        </form>
      </DataState>
    </main>
  );
}
