import { useParams, useSearchParams } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import PageHeader from "../../components/ui/PageHeader";
import { DataState } from "../../components/ui/Feedback";
import {
  NoticeCard,
  RoutineCard,
  CourseCard,
} from "../../components/ui/AcademicCards";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../context/auth";
import {
  ContactLinks,
  DirectoryPersonCard,
  SourceNote,
} from "../../components/ui/DirectoryCards";
export default function DepartmentDetails() {
  const { id } = useParams(),
    { user, isGuest } = useAuth(),
    [params, setParams] = useSearchParams();
  const department = useApi(`/departments/${id}`);
  const own = user?.role === "student" && Number(id) === user.department_id;
  const tabs =
    isGuest || (user?.role === "student" && !own)
      ? ["Teachers", "Notices", "Syllabus"]
      : ["Teachers", "Notices", "Syllabus", "Exam", "Class", "Marking"];
  const tab = tabs.includes(params.get("tab")) ? params.get("tab") : "Teachers";
  return (
    <AppLayout>
      <PageHeader
        title={department.data?.name || "Department"}
        subtitle={
          own
            ? `${user.session} · ${user.year} · ${user.semester}`
            : "People and academic resources"
        }
        back
      />
      <main className="page-pad py-6">
        <DataState request={department}>
          {department.data?.source_url && (
            <DepartmentOverview department={department.data} />
          )}
          <div
            className="mb-6 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Department resources"
          >
            {tabs.map((item) => (
              <button
                role="tab"
                aria-selected={item === tab}
                key={item}
                className={item === tab ? "btn-primary" : "btn-secondary"}
                onClick={() => setParams({ tab: item })}
              >
                {item}
              </button>
            ))}
          </div>
          {tab === "Teachers" ? (
            <DepartmentPeople
              department={department.data}
              highlighted={Number(params.get("person"))}
            />
          ) : (
            <Content
              key={`${id}-${tab}`}
              tab={tab}
              id={id}
              own={own}
              highlighted={Number(params.get("routine"))}
              courseId={Number(params.get("course"))}
            />
          )}
        </DataState>
      </main>
    </AppLayout>
  );
}
function DepartmentOverview({ department }) {
  return (
    <section className="card mb-6 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        {department.faculty_name} · {department.official_code}
      </p>
      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <h2 className="font-bold">Department office</h2>
          <ContactLinks
            emails={department.contacts?.emails}
            phones={department.contacts?.phones}
          />
        </div>
        {department.chair && (
          <div>
            <h2 className="font-bold">Published department head</h2>
            <p className="mt-2 text-sm text-slate-700">
              {department.chair.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {department.chair.designation}
            </p>
            <ContactLinks
              emails={department.chair.emails}
              phones={department.chair.phones}
            />
          </div>
        )}
      </div>
      {department.programs?.length > 0 && (
        <div className="mt-5 border-t pt-4">
          <h3 className="text-sm font-semibold">
            Published program references
          </h3>
          {department.programs.map((program, index) => (
            <p key={index} className="mt-2 text-sm text-slate-600">
              {program.name} · {program.academic_session || program.level}
            </p>
          ))}
        </div>
      )}
      {department.resources?.length > 0 && (
        <div className="mt-4 space-y-2">
          {department.resources.map((resource) => (
            <a
              key={resource.url}
              className="block text-sm font-semibold text-blue-700"
              href={resource.url}
              target="_blank"
              rel="noreferrer"
            >
              {resource.title} ↗
            </a>
          ))}
          <p className="text-xs text-slate-500">
            Published documents do not establish that an admission period is
            still open.
          </p>
        </div>
      )}
      <SourceNote
        url={department.source_url}
        date={department.checked_at}
        notes={department.source_notes}
      />
    </section>
  );
}
function DepartmentPeople({ department, highlighted }) {
  const faculty = [...(department?.faculty_members || [])].sort(
    (a, b) => Number(b.id === highlighted) - Number(a.id === highlighted),
  );
  const accounts = department?.teachers || [];
  return (
    <div className="space-y-6">
      {faculty.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">
            Official faculty directory{" "}
            <span className="text-sm font-normal text-slate-500">
              ({faculty.length} published listings)
            </span>
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {faculty.map((person) => (
              <DirectoryPersonCard
                key={person.id}
                person={person}
                highlight={person.id === highlighted}
              />
            ))}
          </div>
        </section>
      )}
      {accounts.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold">
            {faculty.length
              ? "Teachers registered in this portal"
              : "Department teachers"}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {accounts.map((teacher) => (
              <article className="card p-5" key={teacher.id}>
                <h3 className="font-bold">{teacher.name}</h3>
                <p className="mt-2 text-sm text-slate-500">
                  {teacher.designation}
                </p>
                <ContactLinks emails={[teacher.email]} />
              </article>
            ))}
          </div>
        </section>
      )}
      {!faculty.length && !accounts.length && (
        <p className="text-slate-500">No faculty members published yet.</p>
      )}
    </div>
  );
}
function Content({ tab, id, own, highlighted, courseId }) {
  const endpoint = {
    Notices: "notices",
    Syllabus: "syllabus",
    Class: "routines",
    Exam: "routines",
    Marking: "marking",
  }[tab];
  const personalized = own && !(tab === "Syllabus" && courseId);
  const query = new URLSearchParams(personalized ? {} : { department_id: id });
  if (tab === "Class" || tab === "Exam") query.set("type", tab.toLowerCase());
  const request = useApi(`/${endpoint}${personalized ? "/my" : ""}?${query}`),
    rows = [...(request.data || [])].sort(
      (a, b) => Number(b.id === courseId) - Number(a.id === courseId),
    );
  return (
    <DataState request={request} empty={!rows.length}>
      <div className="space-y-4">
        {rows.map((row) =>
          tab === "Notices" ? (
            <NoticeCard key={row.id} notice={row} />
          ) : tab === "Syllabus" ? (
            <CourseCard
              key={row.id}
              course={row}
              highlight={row.id === courseId}
            />
          ) : tab === "Marking" ? (
            <article key={row.id} className="card p-5">
              <h2 className="font-bold">Marking criteria</h2>
              <p className="mt-2 text-sm text-slate-500">
                {row.session || "All sessions"} · {row.year || "All years"} ·{" "}
                {row.semester || "All semesters"}
              </p>
              <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
                {[
                  ["CT total", row.ct_total],
                  ["Best CTs counted", row.best_ct_counted],
                  ["CT marks", row.ct_marks],
                  ["Attendance", row.attendance_marks],
                  ["Internal total", row.internal_total],
                  ["Theory", row.theory_marks],
                  ["Total", row.total_marks],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-blue-50 p-4">
                    <dt className="text-sm text-slate-500">{label}</dt>
                    <dd className="mt-2 text-2xl font-bold text-blue-700">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ) : (
            <RoutineCard
              key={row.id}
              routine={row}
              highlight={row.id === highlighted}
            />
          ),
        )}
      </div>
    </DataState>
  );
}
