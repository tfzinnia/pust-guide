import { Phone } from "lucide-react";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState } from "../../components/ui/Feedback";
import useApi from "../../hooks/useApi";
import { SourceNote } from "../../components/ui/DirectoryCards";
import { Link } from "react-router-dom";
export default function Emergency() {
  const request = useApi("/emergency");
  const contacts = (request.data || []).filter((row) => row.is_verified);
  return (
    <AppLayout>
      <PageHeader
        title="Emergency contacts"
        subtitle="Verified portal entries and official PUST office contacts"
        back
      />
      <main className="page-pad py-6">
        <p className="notice">
          Use the call button to contact a published service. Availability
          depends on the office or service.
        </p>
        <Link to="/administration" className="btn-secondary mb-5">
          Find responsible offices & staff →
        </Link>
        <DataState request={request} empty={!contacts.length}>
          <div className="grid gap-4 md:grid-cols-2">
            {contacts.map((item) => (
              <article
                className={`card p-5 ${item.is_urgent ? "border-red-300" : ""}`}
                key={item.id}
              >
                <h2 className="font-bold">{item.title}</h2>
                <p className="my-3 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
                <a
                  className="btn-primary w-full"
                  href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}
                >
                  <Phone size={18} />
                  {item.phone}
                </a>
                <SourceNote url={item.source_url} date={item.checked_at} />
              </article>
            ))}
          </div>
        </DataState>
      </main>
    </AppLayout>
  );
}
