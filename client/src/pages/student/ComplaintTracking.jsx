import { CheckCircle, Clock, Loader } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";

export default function ComplaintTracking() {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get("/complaints/my");
      setComplaints(res.data);
    }

    load();
  }, []);

  return (
    <AppLayout>
      <section className="gradient-red-orange px-6 pb-8 pt-8 text-white">
        <h1 className="text-2xl font-bold">Complaint History</h1>
        <p className="mt-2 text-sm">Track your submitted complaints</p>
      </section>

      <main className="page-pad py-6">
        {complaints.length === 0 && (
          <div className="card p-8 text-center text-slate-500">
            No complaints submitted yet.
          </div>
        )}

        <div className="space-y-4">
          {complaints.map((item) => (
            <div key={item.id} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-blue-600">
                    {item.category}
                  </p>
                  <h3 className="mt-1 font-bold">Complaint #{item.id}</h3>
                </div>

                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold capitalize text-blue-600">
                  {item.status?.replace("_", " ")}
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">
                {item.description}
              </p>

              <div className="mt-6 space-y-4">
                <Timeline active icon={Clock} label="Submitted" />
                <Timeline
                  active={["under_review", "resolved"].includes(item.status)}
                  icon={Loader}
                  label="Under Review"
                />
                <Timeline
                  active={item.status === "resolved"}
                  icon={CheckCircle}
                  label="Resolved"
                />
              </div>

              {item.admin_note && (
                <div className="mt-5 rounded-xl bg-slate-100 p-4 text-sm">
                  Admin note: {item.admin_note}
                </div>
              )}
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}

function Timeline({ active, icon: Icon, label }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
        }`}
      >
        <Icon size={16} />
      </div>
      <p className={`font-semibold ${active ? "text-slate-900" : "text-slate-400"}`}>
        {label}
      </p>
    </div>
  );
}