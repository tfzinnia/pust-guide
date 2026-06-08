import {
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  LogOut,
  MessageSquareWarning,
  Settings,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const cards = [
    {
      title: "Manage Guidelines",
      icon: BookOpen,
      path: "/teacher/manage/guidelines",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Manage Notices",
      icon: Bell,
      path: "/teacher/manage/notices",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Manage Department",
      icon: Building2,
      path: "/teacher/manage/departments",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Manage Syllabus",
      icon: FileText,
      path: "/teacher/manage/syllabus",
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Manage Exam Routine",
      icon: ClipboardList,
      path: "/teacher/manage/exam",
      color: "bg-pink-100 text-pink-600",
    },
    {
      title: "Manage Class Routine",
      icon: CalendarClock,
      path: "/teacher/manage/class",
      color: "bg-cyan-100 text-cyan-600",
    },
    {
      title: "View Complaints",
      icon: MessageSquareWarning,
      path: "/teacher/manage/complaints",
      color: "bg-yellow-100 text-yellow-600",
    },
  ];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="gradient-purple-blue rounded-b-xl px-6 pb-8 pt-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Teacher Dashboard</h1>
            <p className="mt-1 text-sm">
              {user?.name} • {user?.designation || "Teacher"}
            </p>
          </div>

          <button onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-5">
          <div>
            <p className="text-sm">Quick Access</p>
            <h2 className="mt-1 font-bold">Content Management</h2>
          </div>

          <Settings />
        </div>
      </section>

      <main className="px-6 py-6">
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-5">
          <h2 className="font-bold">Teacher Panel</h2>
          <p className="mt-8 text-sm text-slate-600">
            You can manage content for your own department and view department complaints.
          </p>
        </div>

        <div className="mt-7 flex items-center justify-between">
          <h2 className="text-xl font-bold">Management Options</h2>

          <Link
            to="/"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold"
          >
            View Student Portal
          </Link>
        </div>

        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                to={card.path}
                className="card flex h-24 flex-col justify-between p-4"
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon size={20} />
                </div>
                <p className="font-semibold">{card.title}</p>
              </Link>
            );
          })}
        </section>

        <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-green-700">
          <h3 className="font-bold">Quick Stats</h3>
          <ul className="ml-5 mt-2 list-disc text-sm">
            <li>8 Departments</li>
            <li>125 Active Students</li>
            <li>24 Faculty Members</li>
            <li>5 Pending Complaints</li>
          </ul>
        </div>
      </main>
    </div>
  );
}