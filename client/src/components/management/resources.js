import { SESSIONS, YEARS, SEMESTERS } from "../../utils/constants";
const f = (key, label, type = "text", required = false, options) => ({
  key,
  label,
  type,
  required,
  options,
});
const department = f("department_id", "Department", "select", true);
const cohort = [
  f("session", "Session", "select", true, SESSIONS),
  f("year", "Year", "select", true, YEARS),
  f("semester", "Semester", "select", true, SEMESTERS),
];
const optionalCohort = cohort.map((field) => ({ ...field, required: false }));
const person = [
  f("name", "Full name", "text", true),
  f("email", "Email", "email", true),
  department,
];
const routine = [
  department,
  ...cohort,
  f("course_code", "Course code"),
  f("course_title", "Course title", "text", true),
  f("start_time", "Start time", "time", true),
  f("end_time", "End time", "time", true),
  f("room", "Room"),
  f("teacher_name", "Teacher"),
];
export const resources = {
  students: {
    title: "Students",
    endpoint: "/users",
    query: { role: "student" },
    create: "/auth/student/signup",
    role: "student",
    fields: [
      ...person,
      f("roll", "Student roll", "text", true),
      ...cohort,
      f("password", "Password", "password", true),
    ],
  },
  teachers: {
    title: "Teachers",
    endpoint: "/users",
    query: { role: "teacher" },
    create: "/auth/teacher/create",
    role: "teacher",
    fields: [
      ...person,
      f("teacher_id", "Teacher ID", "text", true),
      f("designation", "Designation", "text", true),
      f("password", "Password", "password", true),
    ],
  },
  departments: {
    title: "Departments",
    endpoint: "/departments",
    teacherReadOnly: true,
    fields: [
      f("name", "Department name", "text", true),
      f("short_name", "Short name", "text", true),
      f("description", "Description", "textarea"),
    ],
  },
  guidelines: {
    title: "Guidelines",
    endpoint: "/guidelines",
    teacherReadOnly: true,
    fields: [
      f("title", "Title", "text", true),
      f("category", "Category", "text", true),
      f("description", "Guideline text", "textarea", true),
    ],
  },
  notices: {
    title: "Notices",
    endpoint: "/notices",
    defaults: { category: "Academic", is_urgent: false },
    fields: [
      f("title", "Title", "text", true),
      f("description", "Description", "textarea", true),
      f("category", "Category", "select", true, [
        "General",
        "Exam",
        "Academic",
        "Event",
      ]),
      { ...department, required: false },
      ...optionalCohort,
      f("is_urgent", "Urgent notice", "checkbox"),
    ],
  },
  syllabus: {
    title: "Syllabus",
    endpoint: "/syllabus",
    defaults: { credits: 3 },
    fields: [
      department,
      ...cohort,
      f("course_code", "Course code", "text", true),
      f("course_title", "Course title", "text", true),
      f("credits", "Credits", "number", true),
      f("pdf_url", "PDF link (or upload below)"),
    ],
  },
  exam: {
    title: "Exam routine",
    endpoint: "/routines",
    query: { type: "exam" },
    defaults: { type: "exam" },
    fields: [...routine, f("routine_date", "Exam date", "date", true)],
  },
  class: {
    title: "Class routine",
    endpoint: "/routines",
    query: { type: "class" },
    defaults: { type: "class" },
    fields: [
      ...routine,
      f("day", "Day", "select", true, [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ]),
    ],
  },
  marking: {
    title: "Marking criteria",
    endpoint: "/marking",
    defaults: {
      ct_total: 3,
      best_ct_counted: 2,
      ct_marks: 20,
      attendance_marks: 10,
      internal_total: 30,
      theory_marks: 70,
      total_marks: 100,
    },
    fields: [
      department,
      ...optionalCohort,
      ...[
        ["ct_total", "Total CTs"],
        ["best_ct_counted", "Best CTs counted"],
        ["ct_marks", "CT marks"],
        ["attendance_marks", "Attendance marks"],
        ["internal_total", "Internal total"],
        ["theory_marks", "Theory marks"],
        ["total_marks", "Total marks"],
      ].map(([key, label]) => f(key, label, "number", true)),
    ],
  },
  emergency: {
    title: "Emergency contacts",
    endpoint: "/emergency",
    defaults: { is_urgent: false, is_verified: false },
    fields: [
      f("title", "Office / service", "text", true),
      f("phone", "Phone number", "tel", true),
      f("description", "Description", "textarea"),
      f("is_urgent", "Emergency priority", "checkbox"),
      f(
        "is_verified",
        "I have verified this contact; publish in the directory",
        "checkbox",
      ),
    ],
  },
  map: {
    title: "Campus locations",
    endpoint: "/map",
    fields: [
      f("name", "Location name", "text", true),
      f("category", "Category", "text", true),
      f("description", "Description", "textarea"),
      f("latitude", "Latitude", "number"),
      f("longitude", "Longitude", "number"),
    ],
  },
};
