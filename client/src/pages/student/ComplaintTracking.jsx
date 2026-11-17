import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState } from "../../components/ui/Feedback";
import { ComplaintCard } from "../../components/ui/AcademicCards";
import useApi from "../../hooks/useApi";
export default function ComplaintTracking() {
  const request = useApi("/complaints/my");
  return (
    <AppLayout>
      <PageHeader
        title="My complaints"
        subtitle="Track your reports, replies, and review progress"
      >
        <Link
          to="/complaint"
          className="mt-4 inline-block text-sm font-semibold"
        >
          + Submit a new complaint
        </Link>
      </PageHeader>
      <main className="page-pad py-6">
        <DataState request={request} empty={!request.data?.length}>
          <div className="space-y-4">
            {request.data?.map((item) => (
              <ComplaintCard key={item.id} complaint={item} />
            ))}
          </div>
        </DataState>
      </main>
    </AppLayout>
  );
}
