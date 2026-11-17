import { Link } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { usePortal } from "../../context/portal";
import { formatDateTime } from "../../utils/dates";
import { Empty, Loading, Feedback } from "../../components/ui/Feedback";
export default function Notifications() {
  const { notifications, loading, error, unread, markRead } = usePortal(),
    [failure, setFailure] = useState("");
  async function read(id) {
    try {
      await markRead(id);
    } catch {
      setFailure("Could not update notifications. Try again.");
    }
  }
  return (
    <AppLayout>
      <PageHeader
        title="Notifications"
        subtitle={`${unread} unread updates`}
        back
      />
      <main className="page-pad py-6">
        <Feedback error={failure || error} />
        {unread > 0 && (
          <button className="btn-secondary mb-5" onClick={() => read()}>
            Mark all as read
          </button>
        )}
        {loading && !error ? (
          <Loading />
        ) : notifications.length ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <article
                className={`card p-5 ${item.read_at ? "" : "border-blue-300 bg-blue-50"}`}
                key={item.id}
              >
                <div className="flex justify-between gap-4">
                  <h2 className="font-bold">{item.title}</h2>
                  {!item.read_at && (
                    <button
                      className="text-xs font-semibold text-blue-700"
                      onClick={() => read(item.id)}
                    >
                      Mark read
                    </button>
                  )}
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.body}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {formatDateTime(item.created_at)} (Dhaka)
                </p>
                <Link
                  to={item.url}
                  onClick={() => read(item.id)}
                  className="mt-4 inline-block text-sm font-semibold text-blue-700"
                >
                  Open update →
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <Empty>
            You’re all caught up. New notices, routine changes, and complaint
            updates will appear here.
          </Empty>
        )}
      </main>
    </AppLayout>
  );
}
