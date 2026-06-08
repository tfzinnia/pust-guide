import {
  ArrowLeft,
  CheckCircle,
  Edit,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";
import { SEMESTERS, SESSIONS, YEARS } from "../../utils/constants";

export default function AdminManagePage() {
  const { type } = useParams();
  const navigate = useNavigate();

  const titleMap = {
    students: "Manage Students",
    teachers: "Manage Teachers",
    departments: "Manage Departments",
    guidelines: "Manage Guidelines",
    notices: "Manage Notices",
    syllabus: "Manage Syllabus",
    exam: "Manage Exam Routine",
    class: "Manage Class Routine",
    complaints: "View Complaints",
    emergency: "Emergency Contacts",
    map: "Campus Map Locations",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="gradient-purple-blue px-6 pb-8 pt-6 text-white">
        <button
          onClick={() => navigate("/admin")}
          className="mb-7 flex items-center gap-2"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <h1 className="text-2xl font-bold">{titleMap[type] || "Manage"}</h1>
        <p className="mt-2">Super admin can add, edit, and delete this information.</p>
      </section>

      <main className="px-6 py-6">
        {type === "students" && <UserManager role="student" />}
        {type === "teachers" && <TeacherCreator />}
        {type === "departments" && <DepartmentManager />}
        {type === "guidelines" && <GuidelineManager />}
        {type === "notices" && <NoticeAdminManager />}
        {type === "syllabus" && <SyllabusAdminManager />}
        {type === "exam" && <RoutineAdminManager routineType="exam" />}
        {type === "class" && <RoutineAdminManager routineType="class" />}
        {type === "complaints" && <ComplaintAdminManager />}
        {type === "emergency" && <EmergencyManager />}
        {type === "map" && <MapLocationManager />}
      </main>
    </div>
  );
}

function UserManager({ role }) {
  const [items, setItems] = useState([]);

  async function load() {
    const res = await api.get(`/users?role=${role}`);
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id) {
    await api.delete(`/users/${id}`);
    load();
  }

  return (
    <List title="Existing Students">
      {items.map((item) => (
        <ItemRow
          key={item.id}
          title={`${item.name} (${item.roll || item.teacher_id || item.email})`}
          subtitle={`${item.email} • ${item.session || ""} • ${item.year || ""} • ${item.semester || ""}`}
          onDelete={() => remove(item.id)}
        />
      ))}
    </List>
  );
}

function TeacherCreator() {
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    teacher_id: "",
    name: "",
    email: "",
    password: "",
    department_id: "",
    designation: "",
  });

  async function load() {
    const deptRes = await api.get("/departments");
    const teacherRes = await api.get("/users?role=teacher");
    setDepartments(deptRes.data);
    setTeachers(teacherRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    await api.post("/auth/teacher/create", form);
    setMessage("Teacher created successfully.");
    setForm({
      teacher_id: "",
      name: "",
      email: "",
      password: "",
      department_id: "",
      designation: "",
    });
    load();
  }

  async function remove(id) {
    await api.delete(`/users/${id}`);
    load();
  }

  return (
    <>
      <FormBox title="Create Teacher Account" onSubmit={submit} message={message}>
        <Input label="Teacher ID" value={form.teacher_id} onChange={(v) => setForm({ ...form, teacher_id: v })} />
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Input label="Password" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        <SelectObject
          label="Department"
          value={form.department_id}
          onChange={(v) => setForm({ ...form, department_id: v })}
          options={departments.map((d) => ({ label: `${d.short_name} - ${d.name}`, value: d.id }))}
        />
        <Input label="Designation" value={form.designation} onChange={(v) => setForm({ ...form, designation: v })} />
      </FormBox>

      <List title="Existing Teachers">
        {teachers.map((item) => (
          <ItemRow
            key={item.id}
            title={`${item.name} (${item.teacher_id})`}
            subtitle={`${item.email} • ${item.designation} • ${item.department || ""}`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function DepartmentManager() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", short_name: "", description: "" });

  async function load() {
    const res = await api.get("/departments");
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    await api.post("/departments", form);
    setMessage("Department saved successfully.");
    setForm({ name: "", short_name: "", description: "" });
    load();
  }

  async function remove(id) {
    await api.delete(`/departments/${id}`);
    load();
  }

  return (
    <>
      <FormBox title="New Department" onSubmit={submit} message={message}>
        <Input label="Department Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input label="Short Name" value={form.short_name} onChange={(v) => setForm({ ...form, short_name: v })} />
        <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      </FormBox>

      <List title="Existing Departments">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={item.name}
            subtitle={item.short_name}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function GuidelineManager() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", category: "", description: "" });

  async function load() {
    const res = await api.get("/guidelines");
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    await api.post("/guidelines", {
      title: form.title || form.category,
      category: form.category,
      description: form.description,
    });
    setMessage("Guideline saved successfully.");
    setForm({ title: "", category: "", description: "" });
    load();
  }

  async function remove(id) {
    await api.delete(`/guidelines/${id}`);
    load();
  }

  return (
    <>
      <FormBox title="New Guideline Category" onSubmit={submit} message={message}>
        <Input label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <Textarea label="Guidelines Text" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      </FormBox>

      <List title="Existing Guidelines">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={item.category || item.title}
            subtitle={item.description}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function NoticeAdminManager() {
  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "General",
    department_id: "",
    session: "",
    year: "",
    semester: "",
    is_urgent: false,
  });

  async function load() {
    const deptRes = await api.get("/departments");
    const noticeRes = await api.get("/notices");
    setDepartments(deptRes.data);
    setItems(noticeRes.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    await api.post("/notices", form);
    setMessage("Notice saved successfully.");
    setForm({
      title: "",
      description: "",
      category: "General",
      department_id: "",
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
      <FormBox title="New Notice" onSubmit={submit} message={message}>
        <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Textarea label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
        <Select label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={["General", "Exam", "Academic", "Event"]} />
        <SelectObject
          label="Department"
          value={form.department_id}
          onChange={(v) => setForm({ ...form, department_id: v })}
          options={[{ label: "University Notice", value: "" }, ...departments.map((d) => ({ label: `${d.short_name} - ${d.name}`, value: d.id }))]}
        />
        <Select label="Session" value={form.session} onChange={(v) => setForm({ ...form, session: v })} options={["", ...SESSIONS]} />
        <Select label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} options={["", ...YEARS]} />
        <Select label="Semester" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} options={["", ...SEMESTERS]} />
      </FormBox>

      <List title="Existing Notices">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={item.title}
            subtitle={`${item.category} • ${item.department || "University"} • ${item.session || "All"}`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function SyllabusAdminManager() {
  return <AcademicAdminManager type="syllabus" />;
}

function RoutineAdminManager({ routineType }) {
  return <AcademicAdminManager type={routineType} />;
}

function AcademicAdminManager({ type }) {
  const isSyllabus = type === "syllabus";
  const isExam = type === "exam";

  const [departments, setDepartments] = useState([]);
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    department_id: "",
    session: "",
    year: "",
    semester: "",
    course_code: "",
    course_title: "",
    credits: "",
    pdf_url: "",
    routine_date: "",
    day: "",
    start_time: "",
    end_time: "",
    room: "",
    teacher_name: "",
  });

  async function load() {
    const deptRes = await api.get("/departments");
    const dataRes = isSyllabus
      ? await api.get("/syllabus")
      : await api.get(`/routines?type=${type}`);

    setDepartments(deptRes.data);
    setItems(dataRes.data);
  }

  useEffect(() => {
    load();
  }, [type]);

  async function submit(e) {
    e.preventDefault();

    if (isSyllabus) {
      await api.post("/syllabus", form);
    } else {
      await api.post("/routines", {
        ...form,
        type,
      });
    }

    setMessage("Saved successfully.");
    setForm({
      department_id: "",
      session: "",
      year: "",
      semester: "",
      course_code: "",
      course_title: "",
      credits: "",
      pdf_url: "",
      routine_date: "",
      day: "",
      start_time: "",
      end_time: "",
      room: "",
      teacher_name: "",
    });
    load();
  }

  async function remove(id) {
    await api.delete(isSyllabus ? `/syllabus/${id}` : `/routines/${id}`);
    load();
  }

  return (
    <>
      <FormBox
        title={isSyllabus ? "New Course" : isExam ? "New Exam Schedule" : "New Class Schedule"}
        onSubmit={submit}
        message={message}
      >
        <SelectObject
          label="Department"
          value={form.department_id}
          onChange={(v) => setForm({ ...form, department_id: v })}
          options={departments.map((d) => ({ label: `${d.short_name} - ${d.name}`, value: d.id }))}
        />
        <Select label="Session" value={form.session} onChange={(v) => setForm({ ...form, session: v })} options={SESSIONS} />
        <Select label="Year" value={form.year} onChange={(v) => setForm({ ...form, year: v })} options={YEARS} />
        <Select label="Semester" value={form.semester} onChange={(v) => setForm({ ...form, semester: v })} options={SEMESTERS} />
        <Input label="Course Code" value={form.course_code} onChange={(v) => setForm({ ...form, course_code: v })} />
        <Input label="Course Title" value={form.course_title} onChange={(v) => setForm({ ...form, course_title: v })} />

        {isSyllabus ? (
          <>
            <Input label="Credits" value={form.credits} onChange={(v) => setForm({ ...form, credits: v })} />
            <Input label="PDF URL" value={form.pdf_url} onChange={(v) => setForm({ ...form, pdf_url: v })} />
          </>
        ) : (
          <>
            <Input label="Date" type="date" value={form.routine_date} onChange={(v) => setForm({ ...form, routine_date: v })} />
            <Select label="Day" value={form.day} onChange={(v) => setForm({ ...form, day: v })} options={["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]} />
            <Input label="Start Time" type="time" value={form.start_time} onChange={(v) => setForm({ ...form, start_time: v })} />
            <Input label="End Time" type="time" value={form.end_time} onChange={(v) => setForm({ ...form, end_time: v })} />
            <Input label="Room" value={form.room} onChange={(v) => setForm({ ...form, room: v })} />
            <Input label="Teacher Name" value={form.teacher_name} onChange={(v) => setForm({ ...form, teacher_name: v })} />
          </>
        )}
      </FormBox>

      <List title="Existing Items">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={`${item.course_code} - ${item.course_title}`}
            subtitle={`${item.department || ""} • ${item.session || ""} • ${item.year || ""} • ${item.semester || ""}`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function ComplaintAdminManager() {
  const [items, setItems] = useState([]);

  async function load() {
    const res = await api.get("/complaints");
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function markResolved(id) {
    await api.patch(`/complaints/${id}/status`, {
      status: "resolved",
      admin_note: "Marked resolved by super admin.",
    });
    load();
  }

  return (
    <>
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <b>Priority:</b> Address ragging complaints immediately within 24 hours
      </div>

      <List title="All Complaints">
        {items.map((item) => (
          <div key={item.id} className="card mb-4 p-5">
            <p className="text-xs text-slate-500">
              CMP-{String(item.id).padStart(3, "0")}{" "}
              <span className="rounded-full bg-green-500 px-3 py-1 font-bold text-white">
                {item.category}
              </span>
            </p>

            <h3 className="mt-3 font-bold">{item.description}</h3>
            <p className="mt-2 text-sm text-slate-500">
              {item.student_name} • {item.roll} • {item.department} • {item.created_at?.slice(0, 10)}
            </p>

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

function EmergencyManager() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ title: "", phone: "", description: "", is_urgent: false });

  async function load() {
    const res = await api.get("/emergency");
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    await api.post("/emergency", form);
    setMessage("Emergency contact saved.");
    setForm({ title: "", phone: "", description: "", is_urgent: false });
    load();
  }

  async function remove(id) {
    await api.delete(`/emergency/${id}`);
    load();
  }

  return (
    <>
      <FormBox title="New Emergency Contact" onSubmit={submit} message={message}>
        <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      </FormBox>

      <List title="Existing Contacts">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={item.title}
            subtitle={`${item.phone} • ${item.description}`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
  );
}

function MapLocationManager() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", category: "", description: "" });

  async function load() {
    const res = await api.get("/map");
    setItems(res.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(e) {
    e.preventDefault();
    await api.post("/map", form);
    setMessage("Location saved.");
    setForm({ name: "", category: "", description: "" });
    load();
  }

  async function remove(id) {
    await api.delete(`/map/${id}`);
    load();
  }

  return (
    <>
      <FormBox title="New Campus Location" onSubmit={submit} message={message}>
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Input label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} />
      </FormBox>

      <List title="Existing Locations">
        {items.map((item) => (
          <ItemRow
            key={item.id}
            title={item.name}
            subtitle={`${item.category} • ${item.description}`}
            onDelete={() => remove(item.id)}
          />
        ))}
      </List>
    </>
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

function ItemRow({ title, subtitle, onDelete }) {
  return (
    <div className="card mb-3 flex items-center justify-between p-4">
      <div>
        <h3 className="font-bold">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
      </div>

      <div className="flex gap-4">
        <button className="text-slate-600">
          <Edit size={18} />
        </button>
        <button onClick={onDelete} className="text-red-600">
          <Trash2 size={18} />
        </button>
      </div>
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
          <option key={String(item)} value={item}>
            {item || "All"}
          </option>
        ))}
      </select>
    </div>
  );
}

function SelectObject({ label, value, onChange, options }) {
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
          <option key={String(item.value)} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}