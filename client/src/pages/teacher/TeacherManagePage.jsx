import {
  ArrowLeft,
  CheckCircle,
  Edit,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { SEMESTERS, SESSIONS, YEARS } from "../../utils/constants";

export default function TeacherManagePage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const titleMap = {
    notices: "Manage Notices",
    syllabus: "Manage Syllabus",
    exam: "Manage Exam Routine",
    class: "Manage Class Routine",
    departments: "Manage Department",
    guidelines: "Manage Guidelines",
    complaints: "View Complaints",
  };

  const subtitleMap = {
    notices: "Add or edit department notices",
    syllabus: "Add or edit course syllabus",
    exam: "Add or edit exam schedules",
    class: "Add or edit class schedules",
    departments: "View your department information",
    guidelines: "Add or edit student guidelines",
    complaints: "Review department student complaints",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="gradient-purple-blue px-6 pb-8 pt-6 text-white">
        <button
          onClick={() => navigate("/teacher")}
          className="mb-7 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold">{titleMap[type] || "Manage"}</h1>
        <p className="mt-2">{subtitleMap[type]}</p>
      </section>

      <main className="px-6 py-6">
        {type === "notices" && <TeacherNoticeManager user={user} />}
        {type === "syllabus" && <TeacherSyllabusManager user={user} />}
        {type === "exam" && <TeacherRoutineManager user={user} routineType="exam" />}
        {type === "class" && <TeacherRoutineManager user={user} routineType="class" />}
        {type === "departments" && <TeacherDepartmentManager user={user} />}
        {type === "guidelines" && <TeacherGuidelineManager />}
        {type === "complaints" && <TeacherComplaintManager />}
      </main>
    </div>
  );
}

function TeacherNoticeManager({ user }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Academic",
    session: "",
    year: "",
    semester: "",
    is_urgent: false,
  });

  async function load() {
    const res = await api.get(`/notices?department_id=${user.department_id}`);
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    await api.post("/notices", {
      ...form,
      department_id: user.department_id,
    });

    setMessage("Notice saved successfully.");
    setForm({
      title: "",
      description: "",
      category: "Academic",
      session: "",
      year: "",
      semester: "",
      is_urgent: false,
    });
    load();
  }

  async function remove(id) {
    await api.delete(`/notices/${id}`);
    load();
  }

  return (
    <>
      <AddButton label="Add Notice" />
      <FormBox title="New Notice" onSubmit={submit} message={message}>
        <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Textarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={["General", "Exam", "Academic", "Event"]} />
        <Select label="Session" value={form.session} onChange={(v) => setForm({ ...form, session: v })} options={SESSIONS} />
        <Select label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} options={YEARS} />
        <Select label="Semester" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} options={SEMESTERS} />

        <label className="mt-4 flex items-center justify-between rounded-xl bg-slate-100 p-4">
          <span className="font-semibold">Urgent</span>
          <input
            type="checkbox"
            checked={form.is_urgent}
            onChange={(e) => setForm({ ...form, is_urgent: e.target.checked })}
          />
        </label>
      </FormBox>

      <List title="Existing Notices">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={item.title}
            subtitle={`${item.category} • ${item.session || "All sessions"} • ${item.year || "All years"} • ${item.semester || "All semesters"}`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function TeacherSyllabusManager({ user }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    session: "",
    year: "",
    semester: "",
    course_code: "",
    course_title: "",
    credits: "",
    pdf_url: "",
  });

  async function load() {
    const res = await api.get(`/syllabus?department_id=${user.department_id}`);
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    await api.post("/syllabus", {
      ...form,
      department_id: user.department_id,
    });

    setMessage("Course saved successfully.");
    setForm({
      session: "",
      year: "",
      semester: "",
      course_code: "",
      course_title: "",
      credits: "",
      pdf_url: "",
    });
    load();
  }

  async function remove(id) {
    await api.delete(`/syllabus/${id}`);
    load();
  }

  return (
    <>
      <AddButton label="Add Course" />

      <FormBox title="New Course" onSubmit={submit} message={message}>
        <Select label="Session" value={form.session} onChange={(v) => setForm({ ...form, session: v })} options={SESSIONS} />
        <Select label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} options={YEARS} />
        <Select label="Semester" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} options={SEMESTERS} />
        <Input label="Course Code" value={form.course_code} onChange={(v) => setForm({ ...form, course_code: v })} />
        <Input label="Course Title" value={form.course_title} onChange={(v) => setForm({ ...form, course_title: v })} />
        <Input label="Credits" value={form.credits} onChange={(v) => setForm({ ...form, credits: v })} />
        <Input label="PDF URL" value={form.pdf_url} onChange={(v) => setForm({ ...form, pdf_url: v })} />
      </FormBox>

      <List title="Existing Courses">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={`${item.course_code} - ${item.course_title}`}
            subtitle={`${item.session} • ${item.year} • ${item.semester} • ${item.credits} Credits`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function TeacherRoutineManager({ user, routineType }) {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    session: "",
    year: "",
    semester: "",
    course_code: "",
    course_title: "",
    routine_date: "",
    day: "",
    start_time: "",
    end_time: "",
    room: "",
    teacher_name: user?.name || "",
  });

  async function load() {
    const res = await api.get(`/routines?type=${routineType}&department_id=${user.department_id}`);
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();

    await api.post("/routines", {
      ...form,
      type: routineType,
      department_id: user.department_id,
    });

    setMessage(`${routineType === "exam" ? "Exam" : "Class"} schedule saved.`);
    setForm({
      session: "",
      year: "",
      semester: "",
      course_code: "",
      course_title: "",
      routine_date: "",
      day: "",
      start_time: "",
      end_time: "",
      room: "",
      teacher_name: user?.name || "",
    });
    load();
  }

  async function remove(id) {
    await api.delete(`/routines/${id}`);
    load();
  }

  return (
    <>
      <AddButton label={routineType === "exam" ? "Add Exam Schedule" : "Add Class Schedule"} />

      <FormBox
        title={routineType === "exam" ? "New Exam Schedule" : "New Class Schedule"}
        onSubmit={submit}
        message={message}
      >
        <Select label="Session" value={form.session} onChange={(v) => setForm({ ...form, session: v })} options={SESSIONS} />
        <Select label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} options={YEARS} />
        <Select label="Semester" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} options={SEMESTERS} />

        <Input label="Course Code" value={form.course_code} onChange={(v) => setForm({ ...form, course_code: v })} />
        <Input label="Course Title" value={form.course_title} onChange={(v) => setForm({ ...form, course_title: v })} />
        <Input label="Date" type="date" value={form.routine_date} onChange={(v) => setForm({ ...form, routine_date: v })} />
        <Select label="Day" value={form.day} onChange={(v) => setForm({ ...form, day: v })} options={["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]} />
        <Input label="Start Time" type="time" value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
        <Input label="End Time" type="time" value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
        <Input label="Room" value={form.room} onChange={(v) => setForm({ ...form, room: v })} />
        <Input label="Teacher Name" value={form.teacher_name} onChange={(v) => setForm({ ...form, teacher_name: v })} />
      </FormBox>

      <List title={`Existing ${routineType === "exam" ? "Exam" : "Class"} Schedules`}>
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={`${item.course_code} - ${item.course_title}`}
            subtitle={`${item.session} • ${item.year} • ${item.semester} • ${item.day || item.routine_date} • ${item.start_time}`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function TeacherDepartmentManager({ user }) {
  const [department, setDepartment] = useState(null);

  useEffect(() => {
    async function load() {
      const res = await api.get(`/departments/${user.department_id}`);
      setDepartment(res.data);
    }

    load();
  }, [user]);

  return (
    <div className="card p-6">
      <h2 className="text-xl font-bold">Your Department</h2>
      <p className="mt-6 text-2xl font-bold text-blue-600">{department?.short_name}</p>
      <p className="mt-2 text-lg">{department?.name}</p>
      <p className="mt-4 text-slate-600">
        Teachers can view department details but cannot create or delete departments.
      </p>
    </div>
  );
}

function TeacherGuidelineManager() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await api.get("/guidelines");
      setItems(res.data);
    }

    load();
  }, []);

  return (
    <>
      <AddButton label="Guidelines are managed globally by Super Admin" />
      <List title="Existing Guidelines">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={item.category || item.title}
            subtitle={item.description}
            hideActions
          />
        ))}
      </List>
    </>
  );
}

function TeacherComplaintManager() {
  const [items, setItems] = useState([]);

  async function load() {
    const res = await api.get("/complaints/department");
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function markResolved(id) {
    await api.patch(`/complaints/${id}/status`, {
      status: "resolved",
      admin_note: "Marked resolved by department teacher.",
    });
    load();
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <b>Priority:</b> Address ragging complaints immediately within 24 hours
      </div>

      <List title="Department Complaints">
        {items.map((item) => (
          <div key={item.id} className="card mb-4 p-5">
            <p className="text-xs text-slate-500">
              CMP-{String(item.id).padStart(3, "0")}{" "}
              <span className="rounded-full bg-green-500 px-3 py-1 font-bold text-white">
                {item.category}
              </span>
            </p>

            <h3 className="mt-3 font-bold">{item.description}</h3>
            <p className="mt-2 text-sm text-slate-500">{item.created_at?.slice(0, 10)}</p>

            <div className="mt-10 grid grid-cols-1 gap-2 md:grid-cols-2">
              <button className="rounded-xl border border-slate-300 py-3 font-bold">
                View Details
              </button>

              {item.status !== "resolved" && (
                <button
                  onClick={() => markResolved(item.id)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white"
                >
                  <CheckCircle size={18} />
                  Mark Resolved
                </button>
              )}
            </div>
          </div>
        ))}
      </List>
    </>
  );
}

function AddButton({ label }) {
  return (
    <div className="mb-6 rounded-xl bg-blue-600 py-3 text-center font-bold text-white">
      <Plus size={18} className="mr-2 inline" />
      {label}
    </div>
  );
}

function FormBox({ title, children, onSubmit, message }) {
  return (
    <form onSubmit={onSubmit} className="card mb-8 p-5">
      <h2 className="text-xl font-bold">{title}</h2>

      {message && (
        <div className="mt-4 rounded-xl bg-green-50 p-3 font-semibold text-green-700">
          {message}
        </div>
      )}

      <div className="mt-4">{children}</div>

      <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white">
        <Save size={18} />
        Save
      </button>
    </form>
  );
}

function List({ title, children }) {
  return (
    <section>
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function ItemRow({ title, subtitle, onDelete, hideActions }) {
  return (
    <div className="card mb-3 flex items-center justify-between p-4">
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      {!hideActions && (
        <div className="flex gap-4">
          <button className="text-slate-600">
            <Edit size={18} />
          </button>
          <button onClick={onDelete} className="text-red-600">
            <Trash2 size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text" }) {
  return (
    <div className="mt-4">
      <label className="font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 outline-none"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }) {
  return (
    <div className="mt-4">
      <label className="font-semibold">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows="5"
        className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 outline-none"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div className="mt-4">
      <label className="font-semibold">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl bg-slate-100 px-4 py-3 outline-none"
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}