import { ArrowLeft, BookOpen, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";

export default function Guidelines() {
  const [guidelines, setGuidelines] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const res = await api.get("/guidelines");
      setGuidelines(res.data);
    }

    load();
  }, []);

  const fallback = [
    {
      id: 1,
      category: "Academic Guidelines",
      description:
        "Attend all classes regularly. Minimum 60% attendance is required. Submit assignments and projects before deadlines. Participate actively in class discussions and group work. Maintain academic integrity and avoid plagiarism. Consult teachers during office hours for academic help.",
    },
    {
      id: 2,
      category: "Campus Conduct",
      description:
        "Wear student ID card at all times on campus. Maintain discipline and respect university property. No smoking, alcohol, or drugs allowed on campus. Follow traffic rules inside campus premises. Keep the campus clean and use dustbins.",
    },
  ];

  const data = guidelines.length ? guidelines : fallback;

  return (
    <AppLayout>
      <section className="gradient-blue-green px-6 pb-8 pt-6 text-white">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2">
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="flex items-center gap-4">
          <BookOpen size={38} />
          <div>
            <h1 className="text-2xl font-bold">Student Guidelines</h1>
            <p className="mt-2 text-sm">Essential rules for campus life</p>
          </div>
        </div>
      </section>

      <main className="page-pad py-6">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
          These guidelines help create a positive learning environment for everyone.
          Please read and follow them carefully.
        </div>

        <div className="mt-6 space-y-5">
          {data.map((item) => (
            <div key={item.id} className="card p-5">
              <h2 className="font-bold">{item.category || item.title}</h2>

              <div className="mt-10 space-y-5">
                {item.description
                  .split(".")
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map((line) => (
                    <div key={line} className="flex items-center gap-4 text-slate-600">
                      <CheckCircle2 size={20} className="text-green-600" />
                      <p>{line}.</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}