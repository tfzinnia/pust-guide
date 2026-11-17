import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState } from "../../components/ui/Feedback";
import useApi from "../../hooks/useApi";
export default function Guidelines() {
  const request = useApi("/guidelines");
  return (
    <AppLayout>
      <PageHeader
        title="Student guidelines"
        subtitle="Published guidance for academic and campus life"
        back
      />
      <main className="page-pad py-6">
        <DataState request={request} empty={!request.data?.length}>
          <div className="space-y-4">
            {request.data?.map((item) => (
              <article className="card p-6" key={item.id}>
                <p className="mb-2 text-xs font-semibold uppercase text-blue-700">
                  {item.category}
                </p>
                <h2 className="text-lg font-bold">{item.title}</h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </DataState>
      </main>
    </AppLayout>
  );
}
