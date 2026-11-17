import { useSearchParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { usePortal } from "../../context/portal";
import { Loading, Empty, Feedback } from "../../components/ui/Feedback";
import { NoticeCard, RoutineCard } from "../../components/ui/AcademicCards";
export default function SavedItems() {
  const { saved, loading, error } = usePortal(),
    [params, setParams] = useSearchParams();
  const kind = params.get("kind") || "all";
  const rows = saved.filter((item) => kind === "all" || item.kind === kind);
  return (
    <AppLayout>
      <PageHeader
        title="Saved for later"
        subtitle="Your bookmarked notices and schedules"
        back
      />
      <main className="page-pad py-6">
        <div className="mb-6 flex gap-2">
          {[
            ["all", "All"],
            ["notice", "Notices"],
            ["routine", "Routines"],
          ].map(([key, label]) => (
            <button
              aria-pressed={kind === key}
              key={key}
              className={kind === key ? "btn-primary" : "btn-secondary"}
              onClick={() => setParams(key === "all" ? {} : { kind: key })}
            >
              {label}
            </button>
          ))}
        </div>
        <Feedback error={error} />
        {loading && !error ? (
          <Loading />
        ) : rows.length ? (
          <div className="space-y-4">
            {rows.map((item) =>
              item.kind === "notice" ? (
                <NoticeCard key={`n${item.id}`} notice={item} />
              ) : (
                <RoutineCard key={`r${item.id}`} routine={item} />
              ),
            )}
          </div>
        ) : (
          <Empty>Save a notice or routine to find it here.</Empty>
        )}
      </main>
    </AppLayout>
  );
}
