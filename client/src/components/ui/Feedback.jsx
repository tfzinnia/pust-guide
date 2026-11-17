import { formatDateTime } from "../../utils/dates";
export function Feedback({ error, success }) {
  if (!error && !success) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`notice ${error ? "notice-error" : "notice-success"}`}
    >
      {error || success}
    </div>
  );
}
export function Empty({ children = "Nothing here yet." }) {
  return <div className="card p-8 text-center text-slate-500">{children}</div>;
}
export function Loading() {
  return (
    <div role="status" className="space-y-3 py-4">
      <span className="sr-only">Loading</span>
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200" />
      ))}
    </div>
  );
}
export function DataState({ request, children, empty = false }) {
  if (request.loading) return <Loading />;
  if (request.error)
    return (
      <div>
        <Feedback error={request.error} />
        <button className="btn-secondary mt-3" onClick={request.refetch}>
          Try again
        </button>
      </div>
    );
  return (
    <>
      {request.cachedAt && (
        <p role="status" className="notice">
          Offline copy saved {formatDateTime(request.cachedAt)} (Dhaka).
          Information may have changed.
        </p>
      )}
      {empty ? <Empty /> : children}
    </>
  );
}
