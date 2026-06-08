import {
  ArrowLeft,
  Bell,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  Download,
  MapPin,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import AppLayout from "../../components/layout/AppLayout";
import { useAuth } from "../../context/AuthContext";

export default function DepartmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();

  const [department, setDepartment] = useState(null);
  const [activeTab, setActiveTab] = useState("Teachers");

  const [notices, setNotices] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [examRoutine, setExamRoutine] = useState([]);
  const [classRoutine, setClassRoutine] = useState([]);
  const [marking, setMarking] = useState([]);

  const ownDept = user?.role === "student" && Number(user.department_id) === Number(id);

  const tabs = useMemo(() => {
    if (isGuest || !ownDept) return ["Teachers", "Notices", "Syllabus"];
    return ["Teachers", "Notices", "Syllabus", "Exam", "Class", "Marking"];
  }, [isGuest, ownDept]);

  useEffect(() => {
    if (!tabs.includes(activeTab)) setActiveTab("Teachers");
  }, [tabs, activeTab]);

  useEffect(() => {
    async function load() {
      const deptRes = await api.get(`/departments/${id}`);
      setDepartment(deptRes.data);

      const noticeUrl = ownDept
        ? `/notices/my`
        : `/notices?department_id=${id}`;

      const syllabusUrl = ownDept
        ? `/syllabus/my`
        : `/syllabus?department_id=${id}`;

      const examUrl = ownDept
        ? `/routines/my?type=exam`
        : `/routines?type=exam&department_id=${id}`;

      const classUrl = ownDept
        ? `/routines/my?type=class`
        : `/routines?type=class&department_id=${id}`;

      const markingUrl = ownDept
        ? `/marking/my`
        : `/marking?department_id=${id}`;

      const [noticeRes, syllabusRes, examRes, classRes, markingRes] =
        await Promise.all([
          api.get(noticeUrl),
          api.get(syllabusUrl),
          api.get(examUrl),
          api.get(classUrl),
          api.get(markingUrl),
        ]);

      setNotices(noticeRes.data);
      setSyllabus(syllabusRes.data);
      setExamRoutine(examRes.data);
      setClassRoutine(classRes.data);
      setMarking(markingRes.data);
    }

    load();
  }, [id, ownDept]);

  if (!department) {
    return (
      <AppLayout>
        <div className="p-8 text-slate-500">Loading...</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <section className="gradient-blue-green px-6 pb-8 pt-6 text-white">
        <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2">
          <ArrowLeft size={18} />
          Back
        </button>

        <h1 className="text-2xl font-bold">{department.name}</h1>
        <p className="mt-2 text-sm">
          Department of {department.short_name}
          {ownDept && ` • ${user?.session} • ${user?.year} • ${user?.semester}`}
        </p>
      </section>

      <main className="page-pad py-6">
        <div className="mb-6 grid grid-cols-3 gap-2">
          {tabs.slice(0, 3).map((tab) => (
            <TabButton key={tab} tab={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
          ))}
        </div>

        {tabs.length > 3 && (
          <div className="mb-8 grid grid-cols-3 gap-2">
            {tabs.slice(3).map((tab) => (
              <TabButton key={tab} tab={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
            ))}
          </div>
        )}

        {activeTab === "Teachers" && (
          <div className="space-y-3">
            {(department.teachers || []).length === 0 && <Empty text="No teachers found." />}

            {(department.teachers || []).map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        )}

        {activeTab === "Notices" && (
          <div className="space-y-3">
            {notices.length === 0 && <Empty text="No notices found." />}

            {notices.map((notice) => (
              <NoticeCard key={notice.id} notice={notice} />
            ))}
          </div>
        )}

        {activeTab === "Syllabus" && <SyllabusView syllabus={syllabus} />}

        {activeTab === "Exam" && (
          <RoutineView
            type="exam"
            rows={examRoutine}
            title={`Your exam schedule for ${user?.semester || "this semester"}`}
          />
        )}

        {activeTab === "Class" && (
          <RoutineView
            type="class"
            rows={classRoutine}
            title={`Your class schedule for ${user?.semester || "this semester"}`}
          />
        )}

        {activeTab === "Marking" && <MarkingView rows={marking} />}
      </main>
    </AppLayout>
  );
}

function TabButton({ tab, activeTab, setActiveTab }) {
  return (
    <button
      onClick={() => setActiveTab(tab)}
      className={`rounded-2xl py-2 font-semibold ${
        activeTab === tab
          ? "border-2 border-slate-300 bg-white"
          : "bg-slate-200 text-slate-900"
      }`}
    >
      {tab}
    </button>
  );
}

function TeacherCard({ teacher }) {
  return (
    <div className="card flex items-center gap-4 p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <UserRound />
      </div>

      <div>
        <h3 className="font-bold">{teacher.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{teacher.designation}</p>
        <p className="mt-1 text-sm text-blue-600">{teacher.email}</p>
      </div>
    </div>
  );
}

function NoticeCard({ notice }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold">{notice.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{notice.description}</p>
          <p className="mt-3 text-xs text-slate-500">{notice.created_at?.slice(0, 10)}</p>
        </div>

        <span className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
          {notice.category || "General"}
        </span>
      </div>
    </div>
  );
}

function SyllabusView({ syllabus }) {
  const grouped = syllabus.reduce((acc, item) => {
    const key = item.semester || "Semester";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  if (syllabus.length === 0) return <Empty text="No syllabus found." />;

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([semester, courses], index) => (
        <div key={semester} className="card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                {index + 1}
              </span>
              <h3 className="font-bold">{semester}</h3>
            </div>
            <ChevronDown size={18} />
          </div>

          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex items-center justify-between rounded-xl bg-slate-100 p-4"
              >
                <div>
                  <p className="text-sm text-slate-500">
                    <span className="rounded bg-blue-100 px-2 py-1 text-blue-600">
                      {course.course_code}
                    </span>{" "}
                    {course.credits} Credits
                  </p>
                  <h4 className="mt-2 font-semibold">{course.course_title}</h4>
                </div>

                <Download size={18} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RoutineView({ rows, title, type }) {
  if (rows.length === 0) return <Empty text="No routine found." />;

  if (type === "class") {
    const grouped = rows.reduce((acc, row) => {
      const key = row.day || "Day not set";
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
          {title}
        </div>

        {Object.entries(grouped).map(([day, dayRows]) => (
          <div key={day} className="card p-4">
            <div className="mb-6 rounded-xl bg-blue-50 p-3 font-semibold text-blue-600">
              {day}
            </div>

            <div className="space-y-3">
              {dayRows.map((row) => (
                <div key={row.id} className="rounded-xl bg-slate-100 p-4">
                  <h3 className="font-bold">
                    {row.course_code} - {row.course_title}
                  </h3>

                  <p className="mt-8 flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={16} /> {row.start_time} - {row.end_time || ""}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <UserRound size={16} /> {row.teacher_name || "Teacher"}
                  </p>
                  <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={16} /> {row.room || "Room not set"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
        {title}
      </div>

      {rows.map((row) => (
        <div key={row.id} className="card p-5">
          <div className="flex items-start justify-between">
            <h3 className="font-bold">
              {row.course_code} - {row.course_title}
            </h3>
            <Bell size={18} />
          </div>

          <p className="mt-12 flex items-center gap-2 text-slate-600">
            <Calendar size={17} /> {row.routine_date || "Date not set"}
          </p>
          <p className="mt-3 flex items-center gap-2 text-slate-600">
            <Clock size={17} /> {row.start_time} - {row.end_time || ""}
          </p>
          <p className="mt-3 flex items-center gap-2 text-slate-600">
            <MapPin size={17} /> {row.room || "Room not set"}
          </p>
        </div>
      ))}
    </div>
  );
}

function MarkingView({ rows }) {
  if (rows.length === 0) return <Empty text="No marking criteria found." />;

  const item = rows[0];

  const marks = [
    ["CT Total", item.ct_total],
    ["Best CT Counted", item.best_ct_counted],
    ["CT Marks", item.ct_marks],
    ["Attendance", item.attendance_marks],
    ["Internal Total", item.internal_total],
    ["Theory", item.theory_marks],
    ["Total", item.total_marks],
  ];

  return (
    <div className="card p-5">
      <h3 className="text-lg font-bold">Marking Criteria</h3>
      <p className="mt-1 text-sm text-slate-500">
        {item.session || "Session"} • {item.year || "Year"} • {item.semester || "Semester"}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        {marks.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-blue-50 p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold text-blue-600">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({ text }) {
  return <div className="card p-8 text-center text-slate-500">{text}</div>;
}