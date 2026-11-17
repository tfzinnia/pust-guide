import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState } from "../../components/ui/Feedback";
import {
  ContactLinks,
  DirectoryPersonCard,
  SourceNote,
} from "../../components/ui/DirectoryCards";
import useApi from "../../hooks/useApi";
const categories = [
  ["", "All offices"],
  ["leadership", "Leadership"],
  ["administration", "Administration"],
  ["student-support", "Student support"],
  ["residences", "Residences"],
  ["deans", "Deans"],
  ["governance", "Governance"],
];
export default function Administration() {
  const [params, setParams] = useSearchParams(),
    meta = useApi("/directory");
  const tab = params.get("tab") || "offices",
    office = params.get("office"),
    person = params.get("person");
  return (
    <AppLayout>
      <PageHeader
        title="People who keep PUST running"
        subtitle="Official offices, faculty contacts, and university governance"
        back
      />
      <main className="page-pad py-6">
        <DataState request={meta}>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["Departments", meta.data?.counts.departments],
              ["Faculties", meta.data?.counts.faculties],
              ["Faculty listings", meta.data?.counts.faculty_members],
              ["Public role listings", meta.data?.counts.roles],
            ].map(([label, value]) => (
              <div className="card p-4" key={label}>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-blue-700">
                  {value || 0}
                </p>
              </div>
            ))}
          </div>
          <p className="notice">
            These are public official-site listings checked{" "}
            {meta.data?.checked_at || "when published"}. Appointments can
            change; use each source link to confirm. The same person may hold
            more than one listed role.
          </p>
        </DataState>
        <nav
          className="mb-6 flex flex-wrap gap-2"
          aria-label="University directory"
        >
          {[
            ["offices", "Offices & services"],
            ["people", "People"],
            ["university", "University & resources"],
          ].map(([key, label]) => (
            <button
              key={key}
              className={tab === key ? "btn-primary" : "btn-secondary"}
              aria-pressed={tab === key}
              onClick={() => setParams({ tab: key })}
            >
              {label}
            </button>
          ))}
          <Link className="btn-secondary" to="/departments">
            Departments →
          </Link>
        </nav>
        {office ? (
          <OfficeDetails
            id={office}
            highlighted={Number(person)}
            onBack={() => setParams({ tab: "offices" })}
          />
        ) : tab === "people" ? (
          <PeopleList
            initialQuery={params.get("q") || ""}
            highlighted={Number(person)}
          />
        ) : tab === "university" ? (
          <UniversityInfo request={meta} />
        ) : (
          <OfficeList onOpen={(id) => setParams({ office: id })} />
        )}
      </main>
    </AppLayout>
  );
}
function OfficeList({ onOpen }) {
  const [q, setQ] = useState(""),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("");
  const request = useApi(
      `/directory/offices?${new URLSearchParams({ q: query, category })}`,
    ),
    rows = request.data || [];
  return (
    <>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(q);
        }}
      >
        <label className="sr-only" htmlFor="office-search">
          Search offices
        </label>
        <input
          id="office-search"
          type="search"
          className="min-w-0 flex-1 rounded-xl border p-3"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Registrar, proctor, medical, dean…"
        />
        <button className="btn-secondary">Search</button>
      </form>
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map(([key, label]) => (
          <button
            className={category === key ? "btn-primary" : "btn-secondary"}
            aria-pressed={category === key}
            key={key}
            onClick={() => setCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>
      <DataState request={request} empty={!rows.length}>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((unit) => (
            <article className="card p-5" key={unit.id}>
              <h2 className="text-lg font-bold">{unit.name}</h2>
              <p className="mt-3 text-sm text-slate-600">
                {unit.head_names ||
                  (unit.category === "governance"
                    ? "Published membership"
                    : "Head not named in the checked listing")}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {unit.people_count} named role listings
              </p>
              <ContactLinks
                emails={unit.email ? [unit.email] : []}
                phones={unit.phone ? [unit.phone] : []}
              />
              <button
                className="btn-secondary mt-4"
                onClick={() => onOpen(unit.id)}
              >
                View office & people →
              </button>
              <SourceNote url={unit.source_url} date={unit.checked_at} />
            </article>
          ))}
        </div>
      </DataState>
    </>
  );
}
function OfficeDetails({ id, highlighted, onBack }) {
  const request = useApi(`/directory/offices/${id}`),
    unit = request.data;
  return (
    <>
      <button className="btn-secondary mb-5" onClick={onBack}>
        ← All offices
      </button>
      <DataState request={request}>
        {unit && (
          <>
            <section className="card mb-5 p-6">
              <h2 className="text-xl font-bold">{unit.name}</h2>
              {unit.description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {unit.description}
                </p>
              )}
              {unit.location && (
                <p className="mt-2 text-sm text-slate-500">{unit.location}</p>
              )}
              <ContactLinks
                emails={unit.email ? [unit.email] : []}
                phones={unit.phone ? [unit.phone] : []}
              />
              <SourceNote
                url={unit.source_url}
                date={unit.checked_at}
                notes={unit.notes}
              />
              {unit.contact_source_url !== unit.source_url && (
                <a
                  className="mt-2 block text-xs text-blue-700"
                  href={unit.contact_source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Office contact source →
                </a>
              )}
              {unit.unfilled_roles.length > 0 && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold">
                    Roles without a published name
                  </h3>
                  {unit.unfilled_roles.map((role, index) => (
                    <p className="mt-2 text-sm text-slate-600" key={index}>
                      {role.designation || "Role not specified"} · name not
                      supplied by the source
                    </p>
                  ))}
                </div>
              )}
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              {[...unit.people]
                .sort(
                  (a, b) =>
                    Number(b.id === highlighted) - Number(a.id === highlighted),
                )
                .map((person) => (
                  <DirectoryPersonCard
                    key={person.id}
                    person={person}
                    highlight={person.id === highlighted}
                  />
                ))}
            </div>
          </>
        )}
      </DataState>
    </>
  );
}
function PeopleList({ initialQuery, highlighted }) {
  const [q, setQ] = useState(initialQuery),
    [query, setQuery] = useState(initialQuery),
    [kind, setKind] = useState(""),
    [page, setPage] = useState(1);
  const request = useApi(
      `/directory/people?${new URLSearchParams({ q: query, kind, page })}`,
    ),
    rows = request.data?.items || [];
  return (
    <>
      <form
        className="mb-5 flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setQuery(q);
          setPage(1);
        }}
      >
        <label htmlFor="people-search" className="sr-only">
          Search people
        </label>
        <input
          id="people-search"
          className="min-w-0 flex-1 rounded-xl border p-3"
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Name, role, department, or official email…"
        />
        <select
          aria-label="Role type"
          className="rounded-xl border bg-white p-3 text-sm"
          value={kind}
          onChange={(event) => {
            setKind(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All roles</option>
          <option value="faculty">Faculty</option>
          <option value="chair">Department heads</option>
          <option value="officer">Office staff & deans</option>
          <option value="governance">Governance members</option>
        </select>
        <button className="btn-secondary">Search</button>
      </form>
      <DataState request={request} empty={!rows.length}>
        <p className="mb-4 text-sm text-slate-500">
          {request.data?.total} published role listings
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {rows.map((person) => (
            <DirectoryPersonCard
              key={person.id}
              person={person}
              highlight={person.id === highlighted}
            />
          ))}
        </div>
      </DataState>
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          className="btn-secondary"
          disabled={page === 1}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </button>
        <span className="text-sm text-slate-500">Page {page}</span>
        <button
          className="btn-secondary"
          disabled={page * 24 >= (request.data?.total || 0)}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </div>
    </>
  );
}
function UniversityInfo({ request }) {
  const info = request.data;
  return (
    <DataState request={request}>
      {info && (
        <>
          <section className="card p-6">
            <h2 className="text-xl font-bold">
              {info.name || "Pabna University of Science and Technology"}
            </h2>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                ["Founded (official overview)", info.founded],
                ["University Day", info.university_day],
                ["Published address", info.address],
                ["Academic activities began", info.academic_activities_started],
              ]
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="mt-1 font-semibold">{value}</dd>
                  </div>
                ))}
            </dl>
            <ContactLinks
              emails={info.email ? [info.email] : []}
              phones={[info.phone, info.general_contact_phone].filter(Boolean)}
            />
            <SourceNote
              url={info.source_url}
              date={info.checked_at}
              notes={info.notes}
            />
          </section>
          <h2 className="mb-4 mt-7 text-xl font-bold">
            Official student resources
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {info.resources?.map((resource) => (
              <article className="card p-5" key={resource.url}>
                <a
                  className="font-bold text-blue-700"
                  href={resource.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {resource.title} ↗
                </a>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  {resource.description}
                </p>
                {resource.note && (
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {resource.note}
                  </p>
                )}
                <SourceNote
                  url={resource.source_url}
                  date={resource.checked_at}
                />
              </article>
            ))}
          </div>
        </>
      )}
    </DataState>
  );
}
