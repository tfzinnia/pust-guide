import { useState } from "react";
import { useParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState, Feedback } from "../../components/ui/Feedback";
import Field from "../../components/ui/Field";
import DownloadLink from "../../components/ui/DownloadLink";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/auth";
import api from "../../api/axios";
import { formatDateTime } from "../../utils/dates";
export default function ComplaintDetails() {
  const { id } = useParams(),
    request = useApi(`/complaints/${id}`),
    { user } = useAuth();
  const row = request.data;
  return (
    <AppLayout>
      <PageHeader
        title={`Complaint #${id}`}
        subtitle="Private complaint details and updates"
        back
      />
      <main className="page-pad space-y-5 py-6">
        <DataState request={request}>
          {row && (
            <>
              <article className="card p-6">
                <div className="flex flex-wrap justify-between gap-3">
                  <h2 className="font-bold capitalize">{row.category}</h2>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm capitalize text-blue-700">
                    {row.status.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-5 whitespace-pre-wrap leading-7 text-slate-600">
                  {row.description}
                </p>
                <p className="my-4 text-sm text-slate-500">
                  {row.is_anonymous
                    ? "Anonymous submission · identity protected"
                    : row.student_name || "Your submission"}
                  {row.assigned_name && ` · Assigned to ${row.assigned_name}`}
                </p>
                {row.image_url && (
                  <DownloadLink url={row.image_url} label="Download evidence" />
                )}
              </article>
              {user.role !== "student" && (
                <ReviewForm
                  key={`${row.status}-${row.assigned_to}`}
                  row={row}
                  refresh={request.refetch}
                />
              )}
              <section className="card p-6">
                <h2 className="mb-5 text-lg font-bold">
                  Conversation & timeline
                </h2>
                <ol className="space-y-4">
                  {(row.updates.length
                    ? row.updates
                    : [
                        {
                          id: 0,
                          actor_role: "student",
                          message: "Complaint submitted",
                          status: "submitted",
                          created_at: row.created_at,
                        },
                      ]
                  ).map((update) => (
                    <li
                      className="border-l-2 border-blue-200 pl-4"
                      key={update.id}
                    >
                      <p className="text-xs capitalize text-slate-500">
                        {update.actor_role.replace("_", " ")} ·{" "}
                        {formatDateTime(update.created_at)} (Dhaka)
                        {update.status &&
                          ` · ${update.status.replace("_", " ")}`}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                        {update.message}
                      </p>
                    </li>
                  ))}
                </ol>
                <ReplyForm id={id} refresh={request.refetch} />
              </section>
            </>
          )}
        </DataState>
      </main>
    </AppLayout>
  );
}
function ReviewForm({ row, refresh }) {
  const [form, setForm] = useState({
      status: row.status,
      assigned_to: row.assigned_to || "",
      admin_note: "",
    }),
    [state, setState] = useState({});
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      await api.patch(`/complaints/${row.id}/status`, form);
      setState({ success: "Complaint updated." });
      refresh();
    } catch (error) {
      setState({
        error:
          error.response?.data?.message || "Could not update this complaint.",
      });
    }
  }
  return (
    <form className="card p-6" onSubmit={submit}>
      <h2 className="mb-4 text-lg font-bold">Review & assignment</h2>
      <Feedback {...state} />
      <Field
        name="complaint-status"
        label="Status"
        value={form.status}
        options={[
          { value: "submitted", label: "Submitted" },
          { value: "under_review", label: "Under review" },
          { value: "resolved", label: "Resolved" },
        ]}
        onChange={(status) => setForm({ ...form, status })}
        required
      />
      <Field
        name="complaint-assignee"
        label="Responsible teacher"
        value={form.assigned_to}
        options={row.assignees.map((item) => ({
          value: item.id,
          label: item.name,
        }))}
        onChange={(assigned_to) => setForm({ ...form, assigned_to })}
      />
      <Field
        name="complaint-note"
        label="Update for the student"
        type="textarea"
        value={form.admin_note}
        onChange={(admin_note) => setForm({ ...form, admin_note })}
        maxLength={5000}
      />
      <button className="btn-primary" disabled={state.busy}>
        Save review
      </button>
    </form>
  );
}
function ReplyForm({ id, refresh }) {
  const [message, setMessage] = useState(""),
    [state, setState] = useState({});
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      await api.post(`/complaints/${id}/replies`, { message });
      setMessage("");
      setState({ success: "Reply added." });
      refresh();
    } catch (error) {
      setState({
        error: error.response?.data?.message || "Could not send your reply.",
      });
    }
  }
  return (
    <form className="mt-6 border-t pt-5" onSubmit={submit}>
      <Feedback {...state} />
      <Field
        name="complaint-reply"
        label="Add a reply"
        type="textarea"
        value={message}
        onChange={setMessage}
        maxLength={5000}
        required
      />
      <button className="btn-primary" disabled={state.busy}>
        Send reply
      </button>
    </form>
  );
}
