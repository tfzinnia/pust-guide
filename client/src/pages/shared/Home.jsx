import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Map,
  MessageSquareWarning,
  PhoneCall,
  Search,
  Bookmark,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/auth";
import { usePortal } from "../../context/portal";
import useApi from "../../hooks/useApi";
import { DataState, Empty } from "../../components/ui/Feedback";
import { NoticeCard, RoutineCard } from "../../components/ui/AcademicCards";
export default function Home() {
  const { user, isGuest } = useAuth(),
    { unread } = usePortal();
  const dashboard = useApi(
    user?.role === "student" ? "/portal/dashboard" : null,
  );
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const cards = [
    ["Guidelines", BookOpen, "/guidelines"],
    ["Administration", Building2, "/administration"],
    ["Notices", Bell, "/notices"],
    [
      "Departments",
      Building2,
      user?.department_id
        ? `/departments/${user.department_id}`
        : "/departments",
    ],
    ["Campus map", Map, "/map"],
    ["Emergency", PhoneCall, "/emergency"],
    ...(user?.role === "student"
      ? [["Complaints", MessageSquareWarning, "/complaint-tracking"]]
      : []),
    ...(user ? [["Saved items", Bookmark, "/saved"]] : []),
  ];
  return (
    <AppLayout>
      <header className="gradient-blue-green rounded-b-3xl px-6 pb-8 pt-8 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/80">
              PUST GUIDE · YOUR CAMPUS COMPANION
            </p>
            <h1 className="mt-3 text-3xl font-bold">
              Welcome, {isGuest ? "Guest" : user?.name}.
            </h1>
            <p className="mt-2 text-sm">
              {user?.department_name || "Explore your campus"}
              {user?.role === "student" &&
                ` · ${user.session} · ${user.year} · ${user.semester}`}
            </p>
          </div>
          {user && (
            <Link
              to="/notifications"
              aria-label={`${unread} unread notifications`}
              className="relative rounded-full bg-white/20 p-3"
            >
              <Bell size={22} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-2 py-1 text-xs font-bold">
                  {unread}
                </span>
              )}
            </Link>
          )}
        </div>
        <form
          className="mt-7 flex rounded-xl bg-white p-2 text-slate-700"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(`/search?q=${encodeURIComponent(search)}`);
          }}
        >
          <label className="sr-only" htmlFor="home-search">
            Search campus information
          </label>
          <input
            id="home-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Departments, notices, courses, locations…"
            className="min-w-0 flex-1 rounded-lg px-3"
          />
          <button className="btn-primary" aria-label="Search">
            <Search size={20} />
          </button>
        </form>
      </header>
      <main className="page-pad space-y-7 py-7">
        {isGuest && (
          <div className="notice">
            <b>Explore without an account.</b> Sign in to see your schedule,
            save resources, and track complaints.{" "}
            <Link className="font-semibold underline" to="/login">
              Sign in
            </Link>
          </div>
        )}
        {user?.role === "student" && (
          <DataState request={dashboard}>
            <section>
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="text-blue-600" size={22} />
                <h2 className="text-xl font-bold">Today at a glance</h2>
                <span className="ml-auto text-xs text-slate-500">
                  {dashboard.data?.today} · Dhaka
                </span>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500">
                    TODAY’S CLASSES
                  </h3>
                  {dashboard.data?.classes.length ? (
                    dashboard.data.classes.map((row) => (
                      <RoutineCard key={row.id} routine={row} />
                    ))
                  ) : (
                    <Empty>No classes scheduled for today.</Empty>
                  )}
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500">
                    NEXT EXAM
                  </h3>
                  {dashboard.data?.nextExam ? (
                    <RoutineCard routine={dashboard.data.nextExam} />
                  ) : (
                    <Empty>No upcoming exams published.</Empty>
                  )}
                  <Link
                    className="btn-secondary"
                    to={`/departments/${user.department_id}?tab=Class`}
                  >
                    View full timetable →
                  </Link>
                </div>
              </div>
            </section>
            {dashboard.data?.notices.length > 0 && (
              <section className="mt-7">
                <div className="mb-4 flex justify-between">
                  <h2 className="text-xl font-bold">Latest for you</h2>
                  <Link
                    to="/notices"
                    className="text-sm font-semibold text-blue-700"
                  >
                    All notices →
                  </Link>
                </div>
                <div className="space-y-3">
                  {dashboard.data.notices.slice(0, 3).map((notice) => (
                    <NoticeCard key={notice.id} notice={notice} />
                  ))}
                </div>
              </section>
            )}
          </DataState>
        )}
        <section>
          <h2 className="mb-4 text-xl font-bold">Campus essentials</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {cards.map(([label, Icon, path]) => (
              <Link
                key={label}
                to={path}
                className="card p-5 transition hover:border-blue-400 hover:shadow-sm"
              >
                <Icon size={25} className="mb-5 text-blue-600" />
                <span className="text-sm font-bold">{label}</span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </AppLayout>
  );
}
