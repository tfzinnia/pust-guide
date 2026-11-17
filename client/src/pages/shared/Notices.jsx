import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState } from "../../components/ui/Feedback";
import { NoticeCard } from "../../components/ui/AcademicCards";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/auth";
export default function Notices() {
  const { user } = useAuth();
  const request = useApi(user?.role === "student" ? "/notices/my" : "/notices");
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("All");
  const [params] = useSearchParams();
  const highlighted = Number(params.get("notice"));
  const rows = (request.data || [])
    .filter(
      (row) =>
        (category === "All" ||
          row.category?.toLowerCase() === category.toLowerCase()) &&
        `${row.title} ${row.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort(
      (a, b) => Number(b.id === highlighted) - Number(a.id === highlighted),
    );
  return (
    <AppLayout>
      <PageHeader
        title="Notices & circulars"
        subtitle="Published updates from your university and department"
      />
      <main className="page-pad py-6">
        <label className="field">
          Search notices
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search published notices…"
          />
        </label>
        <div
          className="mb-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Notice categories"
        >
          {["All", "General", "Exam", "Academic", "Event"].map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={category === item ? "btn-primary" : "btn-secondary"}
            >
              {item}
            </button>
          ))}
        </div>
        <DataState request={request} empty={!rows.length}>
          <div className="space-y-4">
            {rows.map((notice) => (
              <NoticeCard
                key={notice.id}
                notice={notice}
                highlight={notice.id === highlighted}
              />
            ))}
          </div>
        </DataState>
      </main>
    </AppLayout>
  );
}
