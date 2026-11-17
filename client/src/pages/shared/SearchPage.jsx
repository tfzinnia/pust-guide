import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState, Empty } from "../../components/ui/Feedback";
import useApi from "../../hooks/useApi";
export default function SearchPage() {
  const [params, setParams] = useSearchParams(),
    [input, setInput] = useState(params.get("q") || "");
  const query = params.get("q") || "",
    request = useApi(
      query.length >= 2
        ? `/portal/search?q=${encodeURIComponent(query)}`
        : null,
    );
  const groups = [
    [
      "University offices",
      "offices",
      (row) => row.name,
      (row) => `/administration?office=${row.id}`,
    ],
    [
      "People & official contacts",
      "people",
      (row) => `${row.name} · ${row.designation}`,
      (row) =>
        row.department_id
          ? `/departments/${row.department_id}?tab=Teachers&person=${row.id}`
          : `/administration?office=${row.office_id}&person=${row.id}`,
    ],
    [
      "Departments",
      "departments",
      (row) => row.name,
      (row) => `/departments/${row.id}`,
    ],
    [
      "Notices",
      "notices",
      (row) => row.title,
      (row) => `/notices?notice=${row.id}`,
    ],
    [
      "Courses & syllabus",
      "courses",
      (row) => `${row.course_code} · ${row.course_title}`,
      (row) =>
        `/departments/${row.department_id}?tab=Syllabus&course=${row.id}`,
    ],
    [
      "Campus locations",
      "locations",
      (row) => row.name,
      (row) => `/map?location=${row.id}`,
    ],
  ];
  const total = request.data
    ? Object.values(request.data).reduce((sum, rows) => sum + rows.length, 0)
    : 0;
  return (
    <AppLayout>
      <PageHeader
        title="Search your campus"
        subtitle="Find people, university offices, departments, notices, courses, and locations"
        back
      />
      <main className="page-pad py-6">
        <form
          className="mb-6 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            setParams({ q: input.trim() });
          }}
        >
          <label className="sr-only" htmlFor="global-search">
            Search
          </label>
          <input
            id="global-search"
            className="min-w-0 flex-1 rounded-xl border border-slate-300 p-3"
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What are you looking for?"
            minLength={2}
            maxLength={100}
            required
          />
          <button className="btn-primary">Search</button>
        </form>
        {query.length < 2 ? (
          <Empty>Enter at least two characters to search.</Empty>
        ) : (
          <DataState request={request} empty={!total}>
            {groups.map(
              ([label, key, title, url]) =>
                request.data?.[key]?.length > 0 && (
                  <section key={key} className="mb-7">
                    <h2 className="mb-3 text-lg font-bold">
                      {label}{" "}
                      <span className="text-sm text-slate-500">
                        ({request.data[key].length})
                      </span>
                    </h2>
                    <div className="card divide-y">
                      {request.data[key].map((row) => (
                        <Link
                          className="block p-4 hover:bg-blue-50"
                          key={row.id}
                          to={url(row)}
                        >
                          <span className="font-semibold">{title(row)}</span>
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {row.description ||
                              row.short_name ||
                              "View details"}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </section>
                ),
            )}
          </DataState>
        )}
      </main>
    </AppLayout>
  );
}
