import {
  Bell,
  Calendar,
  ChevronRight,
  GraduationCap,
  LogOut,
  Mail,
  MessageSquare,
  Settings,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";

export default function Profile() {
  const { user, isGuest, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  if (isGuest) {
    return (
      <AppLayout>
        <section className="gradient-blue-green px-6 py-8 text-white">
          <h1 className="text-2xl font-bold">Profile</h1>
        </section>

        <main className="page-pad py-6">
          <div className="card p-6 text-center">
            <UserRound className="mx-auto text-blue-600" size={60} />
            <h2 className="mt-4 text-xl font-bold">Guest User</h2>
            <p className="mt-2 text-slate-500">Sign up to access student profile.</p>
            <button
              onClick={() => navigate("/signup")}
              className="mt-6 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white"
            >
              Sign Up
            </button>
          </div>
        </main>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="gradient-blue-green rounded-b-[24px] px-6 pb-12 pt-8 text-white">
        <h1 className="text-2xl font-bold">Profile</h1>

        <div className="mt-8 flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-blue-600">
            <UserRound size={46} />
          </div>

          <div>
            <h2 className="text-xl font-bold">{user?.name}</h2>
            <p className="mt-2">Roll: {user?.roll || "N/A"}</p>
          </div>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-3">
          <InfoBox label="Department" value={user?.department_id ? "Your Department" : "N/A"} />
          <InfoBox label="Session" value={user?.session || "N/A"} />
          <InfoBox label="Year & Semester" value={`${user?.year || ""} • ${user?.semester || ""}`} />
        </div>
      </section>

      <main className="page-pad py-6">
        <div className="card p-5">
          <h2 className="font-bold">Contact Information</h2>

          <div className="mt-8 space-y-5">
            <ContactLine icon={Mail} label="Email" value={user?.email} color="bg-blue-100 text-blue-600" />
            <ContactLine icon={GraduationCap} label="Session" value={user?.session} color="bg-purple-100 text-purple-600" />
            <ContactLine icon={Calendar} label="Year" value={user?.year} color="bg-green-100 text-green-600" />
            <ContactLine icon={UserRound} label="Semester" value={user?.semester} color="bg-yellow-100 text-yellow-600" />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <ProfileMenu icon={Bell} label="Saved Notices" badge="3" />
          <ProfileMenu icon={Calendar} label="Saved Routines" badge="2" />
          <ProfileMenu
            icon={MessageSquare}
            label="Complaint History"
            badge="2"
            onClick={() => navigate("/complaint-tracking")}
          />
          <ProfileMenu icon={Settings} label="Settings" />
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300 bg-red-50 py-4 font-bold text-red-600"
        >
          <LogOut size={20} />
          Logout
        </button>
      </main>
    </AppLayout>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl border border-white/20 bg-white/10 p-4">
      <p className="text-sm">{label}</p>
      <p className="mt-8 font-bold">{value}</p>
    </div>
  );
}

function ContactLine({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${color}`}>
        <Icon size={18} />
      </div>

      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-semibold">{value || "N/A"}</p>
      </div>
    </div>
  );
}

function ProfileMenu({ icon: Icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-slate-200 px-4 py-4 last:border-b-0"
    >
      <Icon size={20} className="text-slate-500" />
      <span className="flex-1 text-left font-semibold">{label}</span>

      {badge && (
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-sm font-bold text-white">
          {badge}
        </span>
      )}

      <ChevronRight size={20} className="text-slate-500" />
    </button>
  );
}