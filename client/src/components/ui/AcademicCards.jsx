import { Link } from "react-router-dom";
import SaveButton from "./SaveButton";
import DownloadLink from "./DownloadLink";
export function NoticeCard({ notice, highlight = false }) {
  return (
    <article
      id={`notice-${notice.id}`}
      className={`card p-5 ${notice.is_urgent ? "border-red-300" : ""} ${highlight ? "ring-2 ring-blue-500" : ""}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            {notice.is_urgent ? "Urgent · " : ""}
            {notice.category || "General"}
          </p>
          <h3 className="text-lg font-bold">{notice.title}</h3>
        </div>
        <SaveButton kind="notice" id={notice.id} />
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
        {notice.description}
      </p>
      <p className="mt-4 text-xs text-slate-500">
        {notice.department || "University-wide"} ·{" "}
        {notice.created_at?.slice(0, 10)}
      </p>
    </article>
  );
}
export function RoutineCard({ routine, highlight = false }) {
  return (
    <article className={`card p-5 ${highlight ? "ring-2 ring-blue-500" : ""}`}>
      <div className="flex flex-wrap justify-between gap-3">
        <h3 className="font-bold">
          {routine.course_code && `${routine.course_code} · `}
          {routine.course_title}
        </h3>
        <SaveButton kind="routine" id={routine.id} />
      </div>
      <p className="mt-4 text-sm text-slate-600">
        {routine.type === "exam" ? routine.routine_date : routine.day} ·{" "}
        {routine.start_time}
        {routine.end_time && `–${routine.end_time}`} (Dhaka)
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {routine.room || "Room to be announced"}
        {routine.teacher_name && ` · ${routine.teacher_name}`}
      </p>
    </article>
  );
}
export function CourseCard({ course, highlight = false }) {
  return (
    <article className={`card p-5 ${highlight ? "ring-2 ring-blue-500" : ""}`}>
      <p className="text-xs font-semibold text-blue-700">
        {course.course_code} · {course.credits} credits
      </p>
      <h3 className="mt-2 font-bold">{course.course_title}</h3>
      <p className="mb-4 mt-2 text-sm text-slate-500">
        {course.session} · {course.year} · {course.semester}
      </p>
      <DownloadLink url={course.pdf_url} cache />
    </article>
  );
}
export function ComplaintCard({ complaint }) {
  return (
    <Link
      to={`/complaints/${complaint.id}`}
      className="card block p-5 transition hover:border-blue-400"
    >
      <div className="flex flex-wrap justify-between gap-3">
        <h3 className="font-bold">Complaint #{complaint.id}</h3>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
          {complaint.status.replace("_", " ")}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold uppercase text-slate-500">
        {complaint.category}
        {complaint.is_anonymous ? " · Anonymous" : ""}
      </p>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
        {complaint.description}
      </p>
      <p className="mt-4 text-xs text-slate-500">
        {complaint.student_name ||
          (complaint.is_anonymous
            ? "Identity protected"
            : "Your submission")}{" "}
        · {complaint.created_at?.slice(0, 10)}
        {complaint.assigned_name && ` · Assigned to ${complaint.assigned_name}`}
      </p>
      <span className="mt-4 inline-block text-sm font-semibold text-blue-700">
        View details and updates →
      </span>
    </Link>
  );
}
