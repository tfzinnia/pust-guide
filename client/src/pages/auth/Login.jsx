import { GraduationCap, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const [roleTab, setRoleTab] = useState("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const { login, continueAsGuest } = useAuth();
  const navigate = useNavigate();

  const roleColor =
    roleTab === "teacher"
      ? "bg-green-600"
      : roleTab === "admin"
        ? "bg-purple-600"
        : "bg-blue-600";

  const label =
    roleTab === "teacher"
      ? "Email or Teacher ID"
      : roleTab === "admin"
        ? "Admin Email"
        : "Email or Student ID";

  const buttonText =
    roleTab === "teacher"
      ? "Login as Teacher"
      : roleTab === "admin"
        ? "Login as Admin"
        : "Login";

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const user = await login(identifier, password);

      if (roleTab === "student" && user.role !== "student") {
        setError("Please select the correct login type.");
        return;
      }

      if (roleTab === "teacher" && user.role !== "teacher") {
        setError("Please select the correct login type.");
        return;
      }

      if (roleTab === "admin" && user.role !== "super_admin") {
        setError("Please select the correct login type.");
        return;
      }

      if (user.role === "teacher") navigate("/teacher");
      else if (user.role === "super_admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }
  }

  function guestLogin() {
    continueAsGuest();
    navigate("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 px-6">
      <div className="w-full max-w-md">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
            <GraduationCap size={34} />
          </div>

          <h1 className="mt-5 text-3xl font-bold">Welcome to PUST Guide</h1>
          <p className="mt-2 text-slate-500">Your smart campus companion</p>
        </div>

        <div className="mt-8 grid grid-cols-3 rounded-2xl bg-slate-200 p-1">
          {["student", "teacher", "admin"].map((item) => (
            <button
              key={item}
              onClick={() => setRoleTab(item)}
              className={`rounded-xl py-2 font-semibold capitalize ${
                roleTab === item ? "bg-white" : "text-slate-700"
              }`}
            >
              {item === "student" ? "Student" : item === "teacher" ? "Teacher" : "Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-7">
          {error && (
            <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <label className="font-semibold">{label}</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-100 px-4">
            <Mail size={20} className="text-slate-500" />
            <input
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={`Enter your ${label.toLowerCase()}`}
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>

          <label className="mt-5 block font-semibold">Password</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-100 px-4">
            <Lock size={20} className="text-slate-500" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Enter your password"
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>

          <button type="button" className="mt-4 text-blue-600">
            Forgot password?
          </button>

          <button
            type="submit"
            className={`mt-6 w-full rounded-xl py-3 font-semibold text-white ${roleColor}`}
          >
            {buttonText}
          </button>
        </form>

        {roleTab !== "admin" && (
          <p className="mt-8 text-center text-slate-600">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-blue-600">
              Sign Up
            </Link>
          </p>
        )}

        <button
          onClick={guestLogin}
          className="mt-8 w-full text-center font-medium text-slate-600"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
}