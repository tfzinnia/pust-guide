import { useState } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import Field from "../../components/ui/Field";
import UploadField from "../../components/ui/UploadField";
import { Feedback } from "../../components/ui/Feedback";
export default function Complaint() {
  const location = useLocation();
  const [params] = useSearchParams();
  const requestedCategory = params.get("category");
  const category = [
    "ragging",
    "harassment",
    "hall",
    "transport",
    "classroom",
    "academic",
    "others",
  ].includes(requestedCategory)
    ? requestedCategory
    : "ragging";
  const [form, setForm] = useState({
      category,
      description: "",
      image_url: "",
      is_anonymous: false,
    }),
    [state, setState] = useState({}),
    [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const [handoffKey, setHandoffKey] = useState(location.key);
  if (handoffKey !== location.key) {
    setHandoffKey(location.key);
    if (requestedCategory && category === requestedCategory)
      setForm((previous) => ({ ...previous, category }));
  }
  async function submit(event) {
    event.preventDefault();
    setState({ busy: true });
    try {
      const response = await api.post("/complaints", form);
      navigate(`/complaints/${response.data.id}`);
    } catch (error) {
      setState({
        error:
          error.response?.data?.message || "Could not submit your complaint.",
      });
    }
  }
  return (
    <AppLayout>
      <PageHeader
        title="Submit a complaint"
        subtitle="Your report is shared only with authorized university reviewers"
        back
      />
      <main className="page-pad py-6">
        <form className="card p-6" onSubmit={submit}>
          <Feedback {...state} />
          <Field
            name="report-category"
            label="Category"
            value={form.category}
            options={[
              "ragging",
              "harassment",
              "hall",
              "transport",
              "classroom",
              "academic",
              "others",
            ].map((value) => ({
              value,
              label: value.charAt(0).toUpperCase() + value.slice(1),
            }))}
            onChange={(category) => setForm({ ...form, category })}
            required
          />
          <Field
            name="report-description"
            label="Describe what happened"
            type="textarea"
            value={form.description}
            onChange={(description) => setForm({ ...form, description })}
            maxLength={10000}
            required
          />
          <UploadField
            purpose="evidence"
            value={form.image_url}
            onChange={(image_url) => setForm({ ...form, image_url })}
            onBusyChange={setUploading}
          />
          <Field
            name="report-anonymous"
            label="Hide my identity from reviewers"
            type="checkbox"
            value={form.is_anonymous}
            onChange={(is_anonymous) => setForm({ ...form, is_anonymous })}
          />
          <p className="mb-5 text-sm leading-6 text-slate-500">
            Anonymous reports hide your name, roll, and account ID from
            reviewers. Your account retains access to the report for tracking.
            Avoid including identifying details in the description or attachment
            if you want to remain anonymous.
          </p>
          <button className="btn-primary" disabled={state.busy || uploading}>
            {state.busy ? "Submitting…" : "Submit complaint"}
          </button>
          <Link className="btn-secondary ml-3 mt-3" to="/complaint-tracking">
            View my complaints
          </Link>
        </form>
      </main>
    </AppLayout>
  );
}
