import { Link } from "react-router-dom";
import { useAuth } from "../../context/auth";
import AppLayout from "../layout/AppLayout";
import PageHeader from "../ui/PageHeader";
import { DataState } from "../ui/Feedback";
import useApi from "../../hooks/useApi";
import { resources } from "./resources";
export default function ManagementDashboard() {
  const { user } = useAuth(),
    admin = user.role === "super_admin",
    request = useApi("/portal/stats"),
    root = admin ? "/admin" : "/teacher";
  const types = admin
    ? [...Object.keys(resources), "complaints", "requests", "audit"]
    : [
        "notices",
        "syllabus",
        "exam",
        "class",
        "marking",
        "complaints",
        "departments",
        "guidelines",
      ];
  return (
    <AppLayout>
      <PageHeader
        title={admin ? "University administration" : "Teacher workspace"}
        subtitle={`${user.name}${user.department_name ? ` · ${user.department_name}` : ""}`}
      >
        <Link to="/" className="mt-4 inline-block text-sm font-semibold">
          Open student portal →
        </Link>
      </PageHeader>
      <main className="page-pad py-6">
        <DataState request={request}>
          <div className="mb-7 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              ["Students", "students"],
              ["Faculty", "teachers"],
              ["Open complaints", "complaints"],
              ["Departments", "departments"],
            ].map(([label, key]) => (
              <div className="card p-5" key={key}>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-3 text-3xl font-bold text-blue-700">
                  {request.data?.[key] ?? "—"}
                </p>
              </div>
            ))}
          </div>
        </DataState>
        <h2 className="mb-4 text-xl font-bold">Manage your campus</h2>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {types.map((type) => (
            <Link
              className="card p-6 transition hover:border-blue-400"
              key={type}
              to={`${root}/manage/${type}`}
            >
              <h3 className="font-bold">
                {resources[type]?.title ||
                  {
                    complaints: "Complaint reviews",
                    requests: "Academic requests",
                    audit: "Activity log",
                  }[type]}
              </h3>
              <p className="mt-3 text-sm text-blue-700">Open workspace →</p>
            </Link>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}
