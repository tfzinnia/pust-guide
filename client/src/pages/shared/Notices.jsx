import { Calendar, Pin, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";

const filters = ["All", "Exam", "Academic", "Event"];

export default function Notices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    async function load() {
      const url = user?.role === "student" ? "/notices/my" : "/notices";
      const res = await api.get(url);
      setNotices(res.data);
    }

    load();
  }, [user]);

  const fallback = [
    {
      id: "1",
      title: "Final Exam Schedule Published",
      description:
        "The final examination schedule for Spring semester has been published. Students are requested to check...",
      category: "Exam",
      created_at: "2026-04-20",
      is_urgent: 1,
    },
    {
      id: "2",
      title: "Library Hours Extended",
      description:
        "During the exam period, library hours will be extended until 11 PM. Students can utilize...",
      category: "General",
      created_at: "2026-04-18",
    },
    {
      id: "3",
      title: "Department CT-2 Schedule",
      description:
        "Class Test 2 for all CSE courses will be held from April 22-25. Detailed schedule...",
      category: "Academic",
      created_at: "2026-04-15",
    },
    {
      id: "4",
      title: "Campus Cleaning Drive",
      description:
        "Join us for a campus-wide cleaning drive on April 28. All students are encouraged...",
      category: "Event",
      created_at: "2026-04-12",
    },
  ];

  const data = notices.length ? notices : fallback;

  const filtered = useMemo(() => {
    return data.filter((notice) => {
      const matchesSearch = `${notice.title} ${notice.description}`
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesFilter =
        filter === "All" ||
        notice.category?.toLowerCase() === filter.toLowerCase();

      return matchesSearch && matchesFilter;
    });
  }, [data, search, filter]);

  return (
    <AppLayout>
      <section className="gradient-blue-green rounded-b-[24px] px-6 pb-8 pt-8 text-white">
        <h1 className="text-2xl font-bold">Notices & Circulars</h1>

        <div className="mt-6 flex items-center gap-3 rounded-xl bg-white px-4 py-3 text-slate-600">
          <Search size={21} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
      </section>

      <main className="page-pad py-6">
        <div className="mb-7 grid grid-cols-4 rounded-2xl bg-slate-200 p-1">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-xl py-2 font-semibold ${
                filter === item ? "bg-white" : "text-slate-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((notice) => (
            <div
              key={notice.id}
              className={`rounded-2xl border bg-white p-5 ${
                notice.is_urgent
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <Pin size={18} className="mt-1 text-blue-600" />
                  <div>
                    <h3 className="font-bold">{notice.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {notice.description}
                    </p>

                    <p className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                      <Calendar size={15} />
                      {notice.created_at?.slice(0, 10)}
                    </p>
                  </div>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold text-white ${
                    notice.category?.toLowerCase() === "exam"
                      ? "bg-red-500"
                      : "bg-green-500"
                  }`}
                >
                  {notice.category || "General"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}