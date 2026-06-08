import {
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  ClipboardList,
  FileText,
  LogOut,
  Map,
  MessageSquareWarning,
  PhoneCall,
  Settings,
  Users,
  UserRoundPlus,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const cards = [
    { title: "Manage Students", type: "students", icon: Users, color: "bg-blue-100 text-blue-600" },
    { title: "Manage Teachers", type: "teachers", icon: UserRoundPlus, color: "bg-purple-100 text-purple-600" },
    { title: "Manage Departments", type: "departments", icon: Building2, color: "bg-green-100 text-green-600" },
    { title: "Manage Guidelines", type: "guidelines", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
    { title: "Manage Notices", type: "notices", icon: Bell, color: "bg-green-100 text-green-600" },
    { title: "Manage Syllabus", type: "syllabus", icon: FileText, color: "bg-orange-100 text-orange-600" },
    { title: "Manage Exam Routine", type: "exam", icon: ClipboardList, color: "bg-pink-100 text-pink-600" },
    { title: "Manage Class Routine", type: "class", icon: CalendarClock, color: "bg-cyan-100 text-cyan-600" },
    { title: "View Complaints", type: "complaints", icon: MessageSquareWarning, color: "bg-yellow-100 text-yellow-600" },
    { title: "Emergency Contacts", type: "emergency", icon: PhoneCall, color: "bg-red-100 text-red-600" },
    { title: "Campus Map", type: "map", icon: Map, color: "bg-teal-100 text-teal-600" },
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
            <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
            <p className="mt-1 text-sm">Full system control</p>
          </div>

          <button onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-xl border border-white/20 bg-white/10 p-5">
          <div>
            <p className="text-sm">Quick Access</p>
            <h2 className="mt-1 font-bold">System Management</h2>
          </div>

          <Settings />
        </div>
      </section>

      <main className="px-6 py-6">
        <div className="rounded-xl bg-gradient-to-r from-purple-50 to-blue-50 p-5">
          <h2 className="font-bold">Super Admin Panel</h2>
          <p className="mt-8 text-sm text-slate-600">
            You can manage all users, departments, academic content, complaints, emergency contacts, and campus map information.
          </p>
        </div>

        <h2 className="mt-7 text-xl font-bold">Management Options</h2>

        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.type}
                to={`/admin/manage/${card.type}`}
                className="card flex h-24 flex-col justify-between p-4"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
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
            <li>All departments visible</li>
            <li>Can create teachers</li>
            <li>Can edit or delete any information</li>
            <li>Can resolve all complaints</li>
          </ul>
        </div>
      </main>
    </div>
  );
}