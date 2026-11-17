import { Link, useNavigate } from "react-router-dom";
import { UserRound, LogOut } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { useAuth } from "../../context/auth";
import { usePortal } from "../../context/portal";
export default function Profile() {
  const { user, isGuest, logout } = useAuth(),
    { saved, unread } = usePortal(),
    navigate = useNavigate();
  return (
    <AppLayout>
      <PageHeader
        title="Your profile"
        subtitle={user?.department_name || "Your campus account"}
      />
      <main className="page-pad space-y-5 py-6">
        {isGuest ? (
          <div className="card p-8 text-center">
            <h2 className="text-xl font-bold">Guest account</h2>
            <Link className="btn-primary mt-4" to="/signup">
              Create a student account
            </Link>
          </div>
        ) : (
          <>
            <section className="card p-6">
              <div className="flex items-center gap-4">
                <UserRound
                  className="rounded-full bg-blue-50 p-3 text-blue-600"
                  size={64}
                />
                <div>
                  <h2 className="text-xl font-bold">{user?.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{user?.email}</p>
                  <p className="mt-1 text-sm capitalize text-blue-700">
                    {user?.role.replace("_", " ")}
                  </p>
                </div>
              </div>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["Department", user?.department_name],
                  ["Student / teacher ID", user?.roll || user?.teacher_id],
                  ["Session", user?.session],
                  [
                    "Year & semester",
                    [user?.year, user?.semester].filter(Boolean).join(" · "),
                  ],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="mt-1 font-semibold">
                      {value || "Not applicable"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
            <div className="card divide-y">
              {[
                [
                  "Saved notices",
                  `/saved?kind=notice`,
                  saved.filter((item) => item.kind === "notice").length,
                ],
                [
                  "Saved routines",
                  "/saved?kind=routine",
                  saved.filter((item) => item.kind === "routine").length,
                ],
                ["Notifications", "/notifications", unread],
                ...(user?.role === "student"
                  ? [["Complaint history", "/complaint-tracking", ""]]
                  : []),
                ["Profile & account settings", "/settings", ""],
              ].map(([label, path, count]) => (
                <Link
                  className="flex justify-between p-5 font-semibold"
                  to={path}
                  key={path}
                >
                  <span>{label}</span>
                  <span className="text-blue-700">{count} →</span>
                </Link>
              ))}
            </div>
            <button
              className="btn-secondary w-full text-red-700"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              <LogOut size={18} />
              Sign out
            </button>
          </>
        )}
      </main>
    </AppLayout>
  );
}
