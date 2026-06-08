import {
  Bell,
  BookOpen,
  Building2,
  Map,
  MessageSquareWarning,
  PhoneCall,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";

export default function Home() {
  const { user, isGuest } = useAuth();

  const guestCards = [
    {
      title: "Guidelines",
      icon: BookOpen,
      path: "/guidelines",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Circulars",
      icon: Bell,
      path: "/notices",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Departments",
      icon: Building2,
      path: "/departments",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Campus Map",
      icon: Map,
      path: "/map",
      color: "bg-teal-100 text-teal-600",
    },
    {
      title: "Emergency",
      icon: PhoneCall,
      path: "/emergency",
      color: "bg-red-100 text-red-600",
    },
  ];

  const studentCards = [
    {
      title: "Guidelines",
      icon: BookOpen,
      path: "/guidelines",
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Circulars",
      icon: Bell,
      path: "/notices",
      color: "bg-green-100 text-green-600",
    },
    {
      title: "My Department",
      icon: Building2,
      path: user?.department_id ? `/departments/${user.department_id}` : "/departments",
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Complaint",
      icon: MessageSquareWarning,
      path: "/complaint",
      color: "bg-yellow-100 text-yellow-600",
    },
    {
      title: "Campus Map",
      icon: Map,
      path: "/map",
      color: "bg-teal-100 text-teal-600",
    },
    {
      title: "Emergency",
      icon: PhoneCall,
      path: "/emergency",
      color: "bg-red-100 text-red-600",
    },
  ];

  const cards = isGuest ? guestCards : studentCards;

  return (
    <AppLayout>
      <section className="gradient-blue-green rounded-b-[24px] px-6 pb-9 pt-8 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isGuest ? "Welcome Guest!" : `Welcome ${user?.name || "Student"}!`}
            </h1>
            <p className="mt-1 text-sm text-white">
              {isGuest
                ? "Explore campus information"
                : `${user?.department_id ? "Your Department" : "Student"} • ${user?.session || ""} • ${user?.year || ""} • ${user?.semester || ""}`}
            </p>
          </div>

          {!isGuest && (
            <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
              <Bell size={22} />
              <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold">
                3
              </span>
            </div>
          )}
        </div>

        <div className="mt-7 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-600">
          <Search size={21} />
          <input
            placeholder="Search departments, notices, syllabus..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </section>

      <main className="page-pad py-6">
        <section className="rounded-xl bg-gradient-to-r from-blue-50 to-green-50 p-5">
          <h2 className="text-lg font-bold">
            {isGuest ? "Guest Mode" : "Quick Tip for Students"}
          </h2>
          <p className="mt-8 text-sm leading-6 text-slate-600">
            {isGuest
              ? "You're browsing as a guest. Sign up as a student to access exam routines, class schedules, and personalized features!"
              : 'Visit "My Department" to access your syllabus, exam routine, class routine, and marking criteria all in one place!'}
          </p>
        </section>

        <h2 className="mt-7 text-xl font-bold">Quick Access</h2>

        <section className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Link
                key={card.title}
                to={card.path}
                className="card flex h-32 flex-col justify-between p-4 transition hover:bg-slate-50"
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}
                >
                  <Icon size={22} />
                </div>
                <p className="font-semibold">{card.title}</p>
              </Link>
            );
          })}
        </section>
      </main>
    </AppLayout>
  );
}