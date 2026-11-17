import { ChevronRight, Search, Star } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "../../hooks/useApi";
import { DataState } from "../../components/ui/Feedback";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/auth";
import { DEPT_COLORS } from "../../utils/constants";

export default function Departments() {
  const request = useApi("/departments");
  const departments = request.data || [];
  const [search, setSearch] = useState("");
  const [faculty, setFaculty] = useState("");
  const { user, isGuest } = useAuth();

  const filtered = departments.filter(
    (dept) =>
      `${dept.name} ${dept.official_name || ""} ${dept.short_name} ${dept.official_short_name || ""} ${dept.faculty_name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!faculty || dept.faculty_name === faculty),
  );

  const myDepartment = departments.find(
    (dept) => dept.id === user?.department_id,
  );

  return (
    <AppLayout>
      <section className="gradient-blue-green rounded-b-[24px] px-6 pb-8 pt-8 text-white">
        <h1 className="text-2xl font-bold">Departments</h1>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-600">
          <Search size={21} />
          <input
            aria-label="Search departments"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </section>

      <main className="page-pad py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <label className="min-w-0 w-full text-sm font-semibold text-slate-600 sm:w-auto">
            Faculty
            <select
              aria-label="Filter by faculty"
              value={faculty}
              onChange={(event) => setFaculty(event.target.value)}
              className="mt-2 block w-full max-w-full rounded-xl border bg-white p-3 text-sm sm:ml-3 sm:mt-0 sm:inline-block sm:w-auto"
            >
              <option value="">All faculties</option>
              {[
                ...new Set(
                  departments.map((dept) => dept.faculty_name).filter(Boolean),
                ),
              ]
                .sort()
                .map((name) => (
                  <option key={name}>{name}</option>
                ))}
            </select>
          </label>
          <Link className="btn-secondary" to="/administration">
            Administration & contacts →
          </Link>
        </div>
        <DataState request={request} empty={!filtered.length}>
          {!isGuest && myDepartment && (
            <>
              <p className="mb-4 text-slate-500">Your Department</p>
              <DepartmentCard dept={myDepartment} active student={user} />
            </>
          )}

          <p
            className={`${!isGuest && myDepartment ? "mt-7" : ""} mb-4 text-slate-500`}
          >
            {isGuest
              ? "Select a department to view details"
              : "All Departments"}
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((dept) => (
              <DepartmentCard
                key={dept.id}
                dept={dept}
                dim={dept.id === user?.department_id}
              />
            ))}
          </div>
        </DataState>
      </main>
    </AppLayout>
  );
}

function DepartmentCard({ dept, active, dim, student }) {
  const color = DEPT_COLORS[dept.short_name] || "bg-slate-100 text-slate-600";

  return (
    <Link
      to={`/departments/${dept.id}`}
      className={`mb-0 flex items-center gap-4 rounded-2xl border bg-white px-4 py-4 ${
        active ? "border-blue-600 bg-blue-50" : "border-slate-200"
      } ${dim ? "opacity-60" : ""}`}
    >
      <div
        className={`flex h-12 w-16 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${color}`}
      >
        {dept.official_short_name || dept.short_name}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold">{dept.official_name || dept.name}</h3>
          {active && <Star size={16} className="fill-blue-600 text-blue-600" />}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {active
            ? `${student?.session || ""} • ${student?.year || ""} • ${student?.semester || ""}`
            : "View details, syllabus & notices"}
        </p>
        {dept.faculty_name && (
          <p className="mt-2 text-xs text-slate-500">{dept.faculty_name}</p>
        )}
      </div>

      <ChevronRight className="text-slate-500" />
    </Link>
  );
}
