import { ArrowLeft, Phone, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";

export default function Emergency() {
  const [contacts, setContacts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const res = await api.get("/emergency");
      setContacts(res.data);
    }

    load();
  }, []);

  return (
    <AppLayout>
      <section className="gradient-red-orange px-6 pb-8 pt-6 text-white">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2">
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="flex items-center gap-4">
          <Phone size={38} />
          <div>
            <h1 className="text-2xl font-bold">Emergency Contacts</h1>
            <p className="mt-2 text-sm">Important numbers for your safety</p>
          </div>
        </div>
      </section>

      <main className="page-pad py-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
          <h2 className="font-bold">In case of emergency, call immediately!</h2>
          <p className="mt-8 text-sm">
            All emergency numbers are available 24/7 for your assistance.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className={`rounded-2xl border bg-white p-4 ${
                contact.is_urgent ? "border-red-200" : "border-slate-200"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                    contact.is_urgent
                      ? "bg-red-100 text-red-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <ShieldAlert />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{contact.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {contact.description}
                      </p>
                    </div>

                    {contact.is_urgent ? (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs font-bold text-red-600">
                        24/7
                      </span>
                    ) : null}
                  </div>

                  <a
                    href={`tel:${contact.phone}`}
                    className={`mt-4 flex w-full items-center justify-center gap-3 rounded-xl py-3 font-bold ${
                      contact.is_urgent
                        ? "bg-blue-600 text-white"
                        : "border border-slate-200 bg-slate-50 text-slate-800"
                    }`}
                  >
                    <Phone size={18} />
                    {contact.phone}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </AppLayout>
  );
}