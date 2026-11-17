import { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { useAuth } from "../../context/auth";
import useApi from "../../hooks/useApi";
import api from "../../api/axios";
import Field from "../ui/Field";
import UploadField from "../ui/UploadField";
import { DataState, Feedback } from "../ui/Feedback";
import { resources } from "./resources";
export default function ResourceManager({ type }) {
  const config = resources[type],
    { user } = useAuth();
  const [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [editing, setEditing] = useState(null),
    [state, setState] = useState({});
  const readOnly = user.role === "teacher" && config.teacherReadOnly;
  const params = new URLSearchParams({
    ...config.query,
    page,
    q: query,
    ...(user.role === "teacher" && !config.teacherReadOnly
      ? { department_id: user.department_id }
      : {}),
  });
  const request = useApi(`${config.endpoint}?${params}`);
  const rows = (request.data?.items || []).filter(
    (item) =>
      !(type === "departments" && user.role === "teacher") ||
      item.id === user.department_id,
  );
  async function remove(item) {
    if (
      !window.confirm(
        `Delete ${item.title || item.name || item.course_title || "this record"}? This action cannot be undone.`,
      )
    )
      return;
    setState({ busy: item.id });
    try {
      await api.delete(`${config.endpoint}/${item.id}`);
      setState({ success: "Record deleted." });
      request.refetch();
    } catch (error) {
      setState({
        error: error.response?.data?.message || "Could not delete this record.",
      });
    }
  }
  async function reset(item) {
    setState({ busy: item.id });
    try {
      const response = await api.post(`/users/${item.id}/reset-password`);
      setState({ success: response.data.message, resetUrl: response.data.url });
    } catch (error) {
      setState({
        error:
          error.response?.data?.message || "Could not create a reset link.",
      });
    }
  }
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{config.title}</h2>
        {!readOnly && (
          <button className="btn-primary" onClick={() => setEditing({})}>
            <Plus size={17} />
            Add{" "}
            {type === "students"
              ? "student"
              : type === "teachers"
                ? "teacher"
                : "record"}
          </button>
        )}
      </div>
      <Feedback {...state} />
      {state.resetUrl && (
        <label className="field">
          Private password reset link
          <input
            readOnly
            value={state.resetUrl}
            onFocus={(event) => event.target.select()}
          />
        </label>
      )}
      {editing && (
        <ResourceForm
          key={editing.id || "new"}
          config={config}
          item={editing}
          user={user}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setState({ success: "Record saved." });
            request.refetch();
            window.dispatchEvent(new Event("pust:portal-update"));
          }}
        />
      )}
      {readOnly && (
        <p className="notice">
          This information is maintained by the university administrator.
        </p>
      )}
      <form
        className="mb-5 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search);
        }}
      >
        <label className="sr-only" htmlFor="manage-search">
          Search records
        </label>
        <input
          id="manage-search"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 p-3"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search records…"
        />
        <button className="btn-secondary">Search</button>
      </form>
      <DataState request={request} empty={!rows.length}>
        <div className="space-y-3">
          {rows.map((item) => (
            <article
              className="card flex flex-wrap items-start justify-between gap-4 p-5"
              key={item.id}
            >
              <div className="min-w-0">
                <h3 className="font-bold">
                  {item.name ||
                    item.title ||
                    `${item.course_code || ""} ${item.course_title || "Marking criteria"}`}
                </h3>
                <p className="mt-2 break-words text-sm text-slate-500">
                  {[
                    item.email,
                    item.roll,
                    item.teacher_id,
                    item.short_name,
                    item.department,
                    item.session,
                    item.year,
                    item.semester,
                    item.day,
                    item.routine_date,
                    item.start_time,
                    item.phone,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {item.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                    {item.description}
                  </p>
                )}
                {type === "emergency" && (
                  <p className="mt-2 text-xs font-semibold text-blue-700">
                    {item.is_verified
                      ? "Verified · published"
                      : "Unverified · hidden from directory"}
                  </p>
                )}
                {type === "map" && (
                  <p className="mt-2 text-xs text-slate-500">
                    {item.latitude == null
                      ? "Coordinates not published"
                      : `${item.latitude}, ${item.longitude}`}
                  </p>
                )}
              </div>
              {!readOnly && (
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn-secondary"
                    aria-label={`Edit ${item.name || item.title || "record"}`}
                    onClick={() => {
                      setEditing(item);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <Edit size={16} />
                    Edit
                  </button>
                  <button
                    className="btn-secondary text-red-700"
                    aria-label={`Delete ${item.name || item.title || "record"}`}
                    disabled={state.busy === item.id}
                    onClick={() => remove(item)}
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                  {config.role && (
                    <button
                      className="btn-secondary"
                      disabled={state.busy === item.id}
                      onClick={() => reset(item)}
                    >
                      Reset access
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      </DataState>
      <div className="mt-6 flex items-center justify-between">
        <button
          className="btn-secondary"
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-slate-500">
          Page {page} · {request.data?.total || 0} records
        </span>
        <button
          className="btn-secondary"
          disabled={
            page * (request.data?.limit || 20) >= (request.data?.total || 0)
          }
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
function ResourceForm({ config, item, user, onSaved, onCancel }) {
  const initial = Object.fromEntries(
    config.fields.map((field) => [
      field.key,
      item[field.key] ??
        config.defaults?.[field.key] ??
        (field.type === "checkbox" ? false : ""),
    ]),
  );
  const [form, setForm] = useState({
      ...config.defaults,
      ...initial,
      ...(user.role === "teacher" ? { department_id: user.department_id } : {}),
    }),
    [state, setState] = useState({}),
    [uploading, setUploading] = useState(false);
  const departments = useApi("/departments");
  function change(key, value) {
    setForm((previous) => ({ ...previous, [key]: value }));
  }
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    const body = { ...form, ...(config.role ? { role: config.role } : {}) };
    if (!body.password) delete body.password;
    try {
      if (item.id) await api.patch(`${config.endpoint}/${item.id}`, body);
      else await api.post(config.create || config.endpoint, body);
      onSaved();
    } catch (error) {
      setState({
        error: error.response?.data?.message || "Could not save this record.",
      });
    }
  }
  return (
    <form className="card mb-7 border-blue-200 p-6" onSubmit={submit}>
      <h3 className="mb-5 text-lg font-bold">
        {item.id ? "Edit record" : "New record"}
      </h3>
      <Feedback {...state} />
      <div className="grid gap-x-5 md:grid-cols-2">
        {config.fields
          .filter(
            (field) =>
              !(field.key === "department_id" && user.role === "teacher"),
          )
          .map((field) => (
            <div
              className={field.type === "textarea" ? "md:col-span-2" : ""}
              key={field.key}
            >
              <Field
                name={`edit-${field.key}`}
                label={field.label}
                type={field.type === "select" ? "text" : field.type}
                required={field.key === "password" ? !item.id : field.required}
                options={
                  field.key === "department_id"
                    ? departments.data?.map((item) => ({
                        value: item.id,
                        label: `${item.short_name} · ${item.name}`,
                      })) || []
                    : field.options
                }
                value={form[field.key]}
                onChange={(value) => change(field.key, value)}
                {...(field.type === "password"
                  ? {
                      minLength: 10,
                      maxLength: 72,
                      autoComplete: "new-password",
                    }
                  : field.type === "number"
                    ? {
                        step: ["credits", "latitude", "longitude"].includes(
                          field.key,
                        )
                          ? "any"
                          : "1",
                        min:
                          field.key === "latitude"
                            ? -90
                            : field.key === "longitude"
                              ? -180
                              : 0,
                        max:
                          field.key === "latitude"
                            ? 90
                            : field.key === "longitude"
                              ? 180
                              : 1000,
                      }
                    : {})}
              />
            </div>
          ))}
      </div>
      {config.endpoint === "/syllabus" && (
        <UploadField
          purpose="syllabus"
          value={form.pdf_url}
          onChange={(value) => change("pdf_url", value)}
          onBusyChange={setUploading}
        />
      )}
      <div className="mt-3 flex gap-3">
        <button className="btn-primary" disabled={state.busy || uploading}>
          {state.busy ? "Saving…" : "Save record"}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={state.busy}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
