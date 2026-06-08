import { ArrowLeft, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";

export default function Complaint() {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    category: "ragging",
    description: "",
    image_url: "",
    is_anonymous: false,
  });

  function update(name, value) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/complaints", form);
      setMessage("Complaint submitted successfully.");
      setForm({
        category: "ragging",
        description: "",
        image_url: "",
        is_anonymous: false,
      });
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to submit complaint.");
    }
  }

  return (
    <AppLayout>
      <section className="gradient-red-orange px-6 pb-8 pt-6 text-white">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2">
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 className="text-2xl font-bold">Submit Complaint</h1>
        <p className="mt-2 text-sm">Your identity can be protected</p>
      </section>

      <main className="page-pad py-6">
        {message && (
          <div className="mb-4 rounded-xl bg-blue-50 p-4 font-semibold text-blue-600">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="card p-5">
          <label className="font-bold">Complaint Category</label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 outline-none"
          >
            <option value="ragging">Ragging</option>
            <option value="harassment">Harassment</option>
            <option value="hall">Hall Issue</option>
            <option value="transport">Transport</option>
            <option value="classroom">Classroom</option>
            <option value="academic">Academic</option>
            <option value="others">Others</option>
          </select>

          <label className="mt-5 block font-bold">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows="7"
            placeholder="Write your complaint..."
            className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 outline-none"
          />

          <label className="mt-5 block font-bold">Upload Image / Evidence URL</label>
          <div className="mt-2 flex items-center gap-3 rounded-xl bg-slate-100 px-4">
            <Upload size={19} className="text-slate-500" />
            <input
              value={form.image_url}
              onChange={(e) => update("image_url", e.target.value)}
              placeholder="Optional evidence URL"
              className="w-full bg-transparent py-3 outline-none"
            />
          </div>

          <label className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 p-4">
            <span className="font-bold">Submit anonymously</span>
            <input
              type="checkbox"
              checked={form.is_anonymous}
              onChange={(e) => update("is_anonymous", e.target.checked)}
              className="h-5 w-5"
            />
          </label>

          <button className="mt-6 w-full rounded-xl bg-blue-600 py-3 font-bold text-white">
            Submit Complaint
          </button>

          <button
            type="button"
            onClick={() => navigate("/complaint-tracking")}
            className="mt-3 w-full rounded-xl border border-slate-300 py-3 font-bold"
          >
            Track Complaint
          </button>
        </form>
      </main>
    </AppLayout>
  );
}