import { Calendar, GraduationCap, IdCard, Lock, Mail, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { SEMESTERS, SESSIONS, YEARS } from "../../utils/constants";

export default function Signup() {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    roll: "",
    password: "",
    department_id: "",
    session: "",
    year: "",
    semester: "",
  });

  const { studentSignup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDepartments() {
      const res = await api.get("/departments");
      setDepartments(res.data);
    }

    loadDepartments();
  }, []);

  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      await studentSignup(form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 px-6 py-10">
      <div className="mx-auto max-w-md">
        <Link to="/login" className="font-medium text-blue-600">
          ← Back to Login
        </Link>

        <div className="mt-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
            <GraduationCap size={34} />
          </div>

          <h1 className="mt-5 text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-slate-500">Join PUST Guide</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <Input
            icon={User}
            label="Full Name"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(v) => update("name", v)}
          />

          <Input
            icon={Mail}
            label="Email"
            placeholder="Enter your email"
            value={form.email}
            onChange={(v) => update("email", v)}
          />

          <Input
            icon={IdCard}
            label="Roll Number"
            placeholder="e.g., 2024CSE001"
            value={form.roll}
            onChange={(v) => update("roll", v)}
          />

          <Select
            label="Department"
            value={form.department_id}
            onChange={(v) => update("department_id", v)}
            options={departments.map((dept) => ({
              label: `${dept.short_name} - ${dept.name}`,
              value: dept.id,
            }))}
          />

          <Select
            label="Session"
            value={form.session}
            onChange={(v) => update("session", v)}
            options={SESSIONS.map((s) => ({ label: s, value: s }))}
          />

          <Select
            label="Year"
            value={form.year}
            onChange={(v) => update("year", v)}
            options={YEARS.map((y) => ({ label: y, value: y }))}
          />

          <Select
            label="Current Semester"
            value={form.semester}
            onChange={(v) => update("semester", v)}
            options={SEMESTERS.map((s) => ({ label: s, value: s }))}
          />

          <Input
            icon={Lock}
            label="Password"
            placeholder="Create a password"
            type="password"
            value={form.password}
            onChange={(v) => update("password", v)}
          />

          <button className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-semibold text-white">
            Sign Up
          </button>
        </form>
      </div>
    </div>
  );
}

function Input({ icon: Icon, label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className="mt-4">
      <label className="font-semibold">{label}</label>
      <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-100 px-4">
        <Icon size={20} className="text-slate-500" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent py-3 outline-none"
        />
      </div>
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="mt-4">
      <label className="font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 outline-none"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}