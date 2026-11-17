import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/auth";
import AppLayout from "../layout/AppLayout";
import PageHeader from "../ui/PageHeader";
import { DataState, Feedback } from "../ui/Feedback";
import { ComplaintCard } from "../ui/AcademicCards";
import ResourceManager from "./ResourceManager";
import { resources } from "./resources";
import useApi from "../../hooks/useApi";
import api from "../../api/axios";
import { formatDateTime } from "../../utils/dates";
export default function ManagementPage() {
  const { type } = useParams(),
    { user } = useAuth();
  const admin = user.role === "super_admin",
    root = admin ? "/admin" : "/teacher";
  const allowed = admin
    ? [...Object.keys(resources), "complaints", "requests", "audit"]
    : [
        "notices",
        "syllabus",
        "exam",
        "class",
        "marking",
        "departments",
        "guidelines",
        "complaints",
      ];
  return (
    <AppLayout>
      <PageHeader
        title={
          resources[type]?.title ||
          {
            complaints: "Complaint reviews",
            requests: "Academic change requests",
            audit: "Activity log",
          }[type] ||
          "Management"
        }
        subtitle={
          admin ? "University administration" : "Your department workspace"
        }
      >
        <Link className="mt-4 inline-block text-sm font-semibold" to={root}>
          ← Back to dashboard
        </Link>
      </PageHeader>
      <main className="page-pad py-6">
        {!allowed.includes(type) ? (
          <Feedback error="This management section is not available." />
        ) : resources[type] ? (
          <ResourceManager key={type} type={type} />
        ) : type === "complaints" ? (
          <ComplaintManager admin={admin} />
        ) : type === "requests" ? (
          <RequestManager />
        ) : (
          <AuditLog />
        )}
      </main>
    </AppLayout>
  );
}
function ComplaintManager({ admin }) {
  const [status, setStatus] = useState("");
  const request = useApi(
      `/complaints${admin ? "" : "/department"}?status=${status}`,
    ),
    rows = request.data || [];
  return (
    <>
      <label className="field">
        Filter by status
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="">All complaints</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under review</option>
          <option value="resolved">Resolved</option>
        </select>
      </label>
      <DataState request={request} empty={!rows.length}>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((item) => (
            <ComplaintCard key={item.id} complaint={item} />
          ))}
        </div>
      </DataState>
    </>
  );
}
function RequestManager() {
  const request = useApi("/users/academic-requests"),
    [state, setState] = useState({});
  async function review(id, status) {
    setState({ busy: id });
    try {
      await api.patch(`/users/academic-requests/${id}`, { status });
      setState({ success: `Request ${status}.` });
      request.refetch();
    } catch (error) {
      setState({
        error: error.response?.data?.message || "Could not review the request.",
      });
    }
  }
  return (
    <>
      <Feedback {...state} />
      <DataState request={request} empty={!request.data?.length}>
        <div className="space-y-3">
          {request.data?.map((item) => (
            <article key={item.id} className="card p-5">
              <h2 className="font-bold">
                {item.name} · {item.roll}
              </h2>
              <p className="my-3 text-sm text-slate-500">
                {item.session} · {item.year} · {item.semester}
              </p>
              <p className="mb-3 text-sm font-semibold capitalize">
                {item.status}
              </p>
              {item.status === "pending" && (
                <div className="flex gap-3">
                  <button
                    className="btn-primary"
                    disabled={state.busy === item.id}
                    onClick={() => review(item.id, "approved")}
                  >
                    Approve
                  </button>
                  <button
                    className="btn-secondary"
                    disabled={state.busy === item.id}
                    onClick={() => review(item.id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      </DataState>
    </>
  );
}
function AuditLog() {
  const request = useApi("/portal/audit");
  return (
    <DataState request={request} empty={!request.data?.length}>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100">
            <tr>
              {["Actor", "Action", "Resource", "Time (Dhaka)"].map((label) => (
                <th className="p-4" key={label}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {request.data?.map((row) => (
              <tr className="border-t" key={row.id}>
                <td className="p-4">{row.actor_name || "Former account"}</td>
                <td className="p-4">{row.action}</td>
                <td className="p-4">
                  {row.resource} #{row.resource_id}
                </td>
                <td className="whitespace-nowrap p-4">
                  {formatDateTime(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DataState>
  );
}
