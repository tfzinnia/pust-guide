const { run, get, all } = require("../config/db");
const { assert, text, id, academic } = require("../utils/http");
const { audit, notifyAudience } = require("./activity");
const configs = {
  notices: {
    fields: [
      "title",
      "description",
      "category",
      "department_id",
      "session",
      "year",
      "semester",
      "is_urgent",
    ],
    required: ["title", "description"],
    defaults: { category: "General", is_urgent: 0 },
    audience: true,
  },
  syllabus: {
    fields: [
      "department_id",
      "session",
      "year",
      "semester",
      "course_code",
      "course_title",
      "credits",
      "pdf_url",
    ],
    required: [
      "department_id",
      "session",
      "year",
      "semester",
      "course_code",
      "course_title",
    ],
    defaults: { credits: 0 },
    audience: true,
  },
  routines: {
    fields: [
      "type",
      "department_id",
      "session",
      "year",
      "semester",
      "course_code",
      "course_title",
      "routine_date",
      "day",
      "start_time",
      "end_time",
      "room",
      "teacher_name",
    ],
    required: [
      "type",
      "department_id",
      "session",
      "year",
      "semester",
      "course_title",
      "start_time",
    ],
    audience: true,
  },
  marking_criteria: {
    fields: [
      "department_id",
      "session",
      "year",
      "semester",
      "ct_total",
      "best_ct_counted",
      "ct_marks",
      "attendance_marks",
      "internal_total",
      "theory_marks",
      "total_marks",
    ],
    required: ["department_id"],
    defaults: {
      ct_total: 3,
      best_ct_counted: 2,
      ct_marks: 20,
      attendance_marks: 10,
      internal_total: 30,
      theory_marks: 70,
      total_marks: 100,
    },
    audience: true,
  },
  departments: {
    fields: ["name", "short_name", "description"],
    required: ["name", "short_name"],
  },
  guidelines: {
    fields: ["title", "description", "category"],
    required: ["title", "description"],
    defaults: { category: "General" },
  },
  emergency_contacts: {
    fields: ["title", "phone", "description", "is_urgent", "is_verified"],
    required: ["title", "phone"],
    defaults: { is_urgent: 0, is_verified: 0 },
  },
  campus_locations: {
    fields: ["name", "category", "description", "latitude", "longitude"],
    required: ["name", "category"],
  },
};
const numeric = new Set([
  "credits",
  "ct_total",
  "best_ct_counted",
  "ct_marks",
  "attendance_marks",
  "internal_total",
  "theory_marks",
  "total_marks",
  "latitude",
  "longitude",
]);
function canManage(user, item, config) {
  return (
    user.role === "super_admin" ||
    (config.audience &&
      user.role === "teacher" &&
      item.department_id &&
      Number(item.department_id) === Number(user.department_id))
  );
}
function visibleTo(item, user) {
  return (
    (!item.department_id ||
      Number(item.department_id) === Number(user.department_id)) &&
    ["session", "year", "semester"].every(
      (key) => !item[key] || item[key] === user[key],
    )
  );
}
async function validate(table, input, user) {
  const config = configs[table],
    result = {};
  for (const field of config.fields) {
    let value = input[field] ?? config.defaults?.[field] ?? "";
    if (field === "department_id") {
      value = value === "" ? null : id(value, "Department");
      if (value)
        assert(
          await get("SELECT id FROM departments WHERE id = ?", [value]),
          "Department does not exist",
        );
    } else if (numeric.has(field)) {
      if (["latitude", "longitude"].includes(field) && value === "")
        value = null;
      else {
        value = Number(value);
        assert(Number.isFinite(value), `${field} must be a number`);
        assert(
          field === "latitude"
            ? Math.abs(value) <= 90
            : field === "longitude"
              ? Math.abs(value) <= 180
              : value >= 0 && value <= 1000,
          `${field} is out of range`,
        );
        if (!["credits", "latitude", "longitude"].includes(field))
          assert(Number.isInteger(value), `${field} must be an integer`);
      }
    } else if (field.startsWith("is_")) {
      assert(
        [true, false, 0, 1, "0", "1"].includes(value),
        `${field} must be true or false`,
      );
      value = value === true || value === 1 || value === "1" ? 1 : 0;
    } else
      value = text(value, field, {
        required: config.required.includes(field),
        max: field === "description" ? 10000 : 500,
      });
    result[field] = value;
  }
  for (const field of config.required)
    assert(
      result[field] !== null && result[field] !== "",
      `${field} is required`,
    );
  if (config.audience) Object.assign(result, academic(result));
  if (table === "routines") {
    assert(["class", "exam"].includes(result.type), "Invalid routine type");
    assert(
      /^\d{2}:\d{2}$/.test(result.start_time) &&
        result.start_time < "24:00" &&
        Number(result.start_time.slice(3)) < 60,
      "Enter a valid start time",
    );
    assert(
      !result.end_time ||
        (/^\d{2}:\d{2}$/.test(result.end_time) &&
          result.end_time < "24:00" &&
          Number(result.end_time.slice(3)) < 60 &&
          result.end_time > result.start_time),
      "End time must be later than start time",
    );
    assert(
      result.type !== "exam" ||
        (/^\d{4}-\d{2}-\d{2}$/.test(result.routine_date) &&
          !Number.isNaN(Date.parse(result.routine_date)) &&
          new Date(result.routine_date).toISOString().slice(0, 10) ===
            result.routine_date),
      "Exam date is required",
    );
    assert(
      result.type !== "class" ||
        [
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
        ].includes(result.day),
      "Select a class day",
    );
  }
  if (table === "syllabus" && result.pdf_url) {
    assert(
      /^https?:\/\//i.test(result.pdf_url) ||
        /^\/api\/files\/[a-f0-9-]+$/.test(result.pdf_url),
      "Use a document link or an uploaded PDF",
    );
    if (result.pdf_url.startsWith("/api/files/")) {
      const file = await get("SELECT * FROM uploaded_files WHERE id = ?", [
        result.pdf_url.split("/").pop(),
      ]);
      assert(
        file?.purpose === "syllabus" &&
          (user.role === "super_admin" ||
            file.department_id === Number(result.department_id)),
        "Choose a syllabus PDF for this department",
      );
    }
  }
  if (table === "marking_criteria") {
    assert(
      result.best_ct_counted <= result.ct_total,
      "Best CT count cannot exceed total CTs",
    );
    assert(
      result.ct_marks + result.attendance_marks === result.internal_total &&
        result.internal_total + result.theory_marks === result.total_marks,
      "Mark components must add up to their totals",
    );
  }
  if (table === "campus_locations")
    assert(
      (result.latitude === null) === (result.longitude === null),
      "Set both latitude and longitude",
    );
  if (table === "emergency_contacts")
    assert(
      /^[+\d][\d\s()-]{2,25}$/.test(result.phone),
      "Enter a valid phone number",
    );
  return result;
}
function controller(table) {
  const config = configs[table];
  async function list(req, res) {
    const clauses = [],
      params = [];
    for (const field of config.fields.filter((key) =>
      [
        "department_id",
        "session",
        "year",
        "semester",
        "type",
        "category",
      ].includes(key),
    )) {
      if (req.query[field]) {
        clauses.push(`t.${field} = ?`);
        params.push(req.query[field]);
      }
    }
    if (req.query.q) {
      const fields = config.fields.filter(
        (key) => !numeric.has(key) && !key.startsWith("is_"),
      );
      clauses.push(
        `(${fields.map((key) => `COALESCE(t.${key},'') LIKE ?`).join(" OR ")})`,
      );
      params.push(
        ...fields.map(() => `%${String(req.query.q).slice(0, 100)}%`),
      );
    }
    if (req.path === "/my") {
      assert(req.user?.role === "student", "Student access required", 403);
      clauses.push(
        "(t.department_id IS NULL OR t.department_id = ?) AND (COALESCE(t.session,'') = '' OR t.session = ?) AND (COALESCE(t.year,'') = '' OR t.year = ?) AND (COALESCE(t.semester,'') = '' OR t.semester = ?)",
      );
      params.push(
        req.user.department_id,
        req.user.session,
        req.user.year,
        req.user.semester,
      );
    }
    if (table === "emergency_contacts" && req.user?.role !== "super_admin")
      clauses.push("t.is_verified = 1");
    const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
    const join = config.audience
      ? " LEFT JOIN departments d ON d.id = t.department_id"
      : "";
    const select = config.audience ? "t.*, d.short_name AS department" : "t.*";
    const order =
      table === "notices"
        ? "t.is_urgent DESC, t.created_at DESC, t.id DESC"
        : table === "routines"
          ? "t.routine_date, t.start_time"
          : "t.id DESC";
    const paged = req.query.page !== undefined;
    const page = Math.max(1, Math.floor(Number(req.query.page) || 1)),
      limit = Math.min(
        100,
        Math.max(1, Math.floor(Number(req.query.limit) || 20)),
      );
    const items = await all(
      `SELECT ${select} FROM ${table} t${join}${where} ORDER BY ${order}${paged ? " LIMIT ? OFFSET ?" : ""}`,
      paged ? [...params, limit, (page - 1) * limit] : params,
    );
    if (paged)
      return res.json({
        items,
        total: (
          await get(`SELECT COUNT(*) AS count FROM ${table} t${where}`, params)
        ).count,
        page,
        limit,
      });
    res.json(items);
  }
  async function save(req, res) {
    const existing = req.params.id
      ? await get(`SELECT * FROM ${table} WHERE id = ?`, [id(req.params.id)])
      : null;
    if (req.params.id) assert(existing, "Record not found", 404);
    if (existing)
      assert(
        canManage(req.user, existing, config),
        "You can only manage your department’s content",
        403,
      );
    const data = await validate(table, { ...existing, ...req.body }, req.user);
    assert(
      canManage(req.user, data, config),
      "You can only manage your department’s content",
      403,
    );
    if (table === "syllabus" || table === "marking_criteria") {
      const keys = [
        "department_id",
        "session",
        "year",
        "semester",
        ...(table === "syllabus" ? ["course_code"] : []),
      ];
      assert(
        !(await get(
          `SELECT id FROM ${table} WHERE ${keys.map((key) => `COALESCE(${key},'') = ?`).join(" AND ")} AND id != ?`,
          [...keys.map((key) => data[key] ?? ""), existing?.id || 0],
        )),
        "A record already exists for this course or cohort",
        409,
      );
    }
    if (table === "routines" && data.end_time) {
      assert(
        !(await get(
          `SELECT id FROM routines WHERE id != ? AND type = ? AND department_id = ? AND session = ? AND year = ? AND semester = ? AND ${data.type === "class" ? "day" : "routine_date"} = ? AND start_time < ? AND end_time > ?`,
          [
            existing?.id || 0,
            data.type,
            data.department_id,
            data.session,
            data.year,
            data.semester,
            data.type === "class" ? data.day : data.routine_date,
            data.end_time,
            data.start_time,
          ],
        )),
        "This time overlaps another routine for this cohort",
        409,
      );
    }
    let resourceId = existing?.id;
    if (existing)
      await run(
        `UPDATE ${table} SET ${config.fields.map((key) => `${key} = ?`).join(",")} WHERE id = ?`,
        [...config.fields.map((key) => data[key]), existing.id],
      );
    else {
      const fields = [
        ...config.fields,
        ...(config.audience ? ["created_by"] : []),
      ];
      resourceId = (
        await run(
          `INSERT INTO ${table} (${fields.join(",")}) VALUES (${fields.map(() => "?").join(",")})`,
          [
            ...config.fields.map((key) => data[key]),
            ...(config.audience ? [req.user.id] : []),
          ],
        )
      ).id;
    }
    await audit(req.user, existing ? "update" : "create", table, resourceId);
    if (["notices", "routines"].includes(table))
      await notifyAudience(
        { ...data, id: resourceId },
        table,
        existing ? "update" : "create",
      );
    res
      .status(existing ? 200 : 201)
      .json({ message: "Saved successfully", id: resourceId });
  }
  async function remove(req, res) {
    const item = await get(`SELECT * FROM ${table} WHERE id = ?`, [
      id(req.params.id),
    ]);
    assert(item, "Record not found", 404);
    assert(
      canManage(req.user, item, config),
      "You can only manage your department’s content",
      403,
    );
    await run(`DELETE FROM ${table} WHERE id = ?`, [item.id]);
    if (["notices", "routines"].includes(table))
      await run("DELETE FROM saved_items WHERE kind = ? AND item_id = ?", [
        table === "notices" ? "notice" : "routine",
        item.id,
      ]);
    await audit(req.user, "delete", table, item.id);
    res.json({ message: "Deleted successfully" });
  }
  return { list, save, remove };
}
module.exports = { controller, visibleTo, configs };
