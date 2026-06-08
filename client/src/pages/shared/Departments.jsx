import { ChevronRight, Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";
import { DEPT_COLORS } from "../../utils/constants";

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const { user, isGuest } = useAuth();

  useEffect(() => {
    async function load() {
      const res = await api.get("/departments");
      setDepartments(res.data);
    }

    load();
  }, []);

  const filtered = departments.filter((dept) =>
    `${dept.name} ${dept.short_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const myDepartment = departments.find((dept) => dept.id === user?.department_id);

  return (
    <AppLayout>
      <section className="gradient-blue-green rounded-b-[24px] px-6 pb-8 pt-8 text-white">
        <h1 className="text-2xl font-bold">Departments</h1>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-600">
          <Search size={21} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </section>

      <main className="page-pad py-6">
        {!isGuest && myDepartment && (
          <>
            <p className="mb-4 text-slate-500">Your Department</p>
            <DepartmentCard dept={myDepartment} active student={user} />
          </>
        )}

        <p className={`${!isGuest && myDepartment ? "mt-7" : ""} mb-4 text-slate-500`}>
          {isGuest ? "Select a department to view details" : "All Departments"}
        </p>

        <div className="space-y-0">
          {filtered.map((dept) => (
            <DepartmentCard key={dept.id} dept={dept} dim={dept.id === user?.department_id} />
          ))}
        </div>
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
      <div className={`flex h-12 w-14 items-center justify-center rounded-xl text-lg font-bold ${color}`}>
        {dept.short_name}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold">{dept.name}</h3>
          {active && <Star size={16} className="fill-blue-600 text-blue-600" />}
        </div>

        <p className="mt-1 text-xs text-slate-500">
          {active
            ? `${student?.session || ""} • ${student?.year || ""} • ${student?.semester || ""}`
            : "View details, syllabus & notices"}
        </p>
      </div>

      <ChevronRight className="text-slate-500" />
    </Link>
  );
}