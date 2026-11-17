const router = require("express").Router();
const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const { run, get, all } = require("../config/db");
const { assert, text, id } = require("../utils/http");
const { visibleTo } = require("../services/content");
const { searchDirectory } = require("../services/directory");
router.get("/search", async (req, res) => {
  const q = text(req.query.q, "Search", { max: 100 });
  if (q.length < 2)
    return res.json({
      departments: [],
      notices: [],
      courses: [],
      locations: [],
      offices: [],
      people: [],
    });
  const term = `%${q}%`;
  const user = req.user;
  const noticeScope =
    user?.role === "student"
      ? " AND (department_id IS NULL OR department_id=?) AND (COALESCE(session,'')='' OR session=?) AND (COALESCE(year,'')='' OR year=?) AND (COALESCE(semester,'')='' OR semester=?)"
      : "";
  const audience =
    user?.role === "student"
      ? [user.department_id, user.session, user.year, user.semester]
      : [];
  const [departments, notices, courses, locations] = await Promise.all([
    all(
      "SELECT id,COALESCE(official_name,name) AS name,COALESCE(official_short_name,short_name) AS short_name,faculty_name FROM departments WHERE name LIKE ? OR official_name LIKE ? OR short_name LIKE ? OR official_short_name LIKE ? OR faculty_name LIKE ? LIMIT 21",
      [term, term, term, term, term],
    ),
    all(
      `SELECT id,title,description,department_id FROM notices WHERE (title LIKE ? OR description LIKE ?)${noticeScope} ORDER BY is_urgent DESC,id DESC LIMIT 15`,
      [term, term, ...audience],
    ),
    all(
      "SELECT id,course_code,course_title,department_id FROM syllabus WHERE course_code LIKE ? OR course_title LIKE ? LIMIT 15",
      [term, term],
    ),
    all(
      "SELECT id,name,category,description FROM campus_locations WHERE name LIKE ? OR description LIKE ? OR category LIKE ? LIMIT 15",
      [term, term, term],
    ),
  ]);
  const directory = await searchDirectory(q);
  res.json({ departments, notices, courses, locations, ...directory });
});
router.use(protect);
router.get("/dashboard", async (req, res) => {
  const user = req.user;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type) => parts.find((p) => p.type === type).value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
  }).format(new Date());
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  if (user.role !== "student")
    return res.json({ today, classes: [], nextExam: null, notices: [] });
  const scope = [user.department_id, user.session, user.year, user.semester];
  const [classes, nextExam, notices] = await Promise.all([
    all(
      "SELECT * FROM routines WHERE type='class' AND department_id=? AND session=? AND year=? AND semester=? AND day=? ORDER BY start_time",
      [...scope, day],
    ),
    get(
      "SELECT * FROM routines WHERE type='exam' AND department_id=? AND session=? AND year=? AND semester=? AND (routine_date > ? OR (routine_date = ? AND start_time >= ?)) ORDER BY routine_date,start_time LIMIT 1",
      [...scope, today, today, time],
    ),
    all(
      "SELECT * FROM notices WHERE (department_id IS NULL OR department_id=?) AND (COALESCE(session,'')='' OR session=?) AND (COALESCE(year,'')='' OR year=?) AND (COALESCE(semester,'')='' OR semester=?) ORDER BY is_urgent DESC,id DESC LIMIT 5",
      scope,
    ),
  ]);
  res.json({ today, classes, nextExam: nextExam || null, notices });
});
router.get("/notifications", async (req, res) =>
  res.json({
    items: await all(
      "SELECT * FROM notifications WHERE user_id=? ORDER BY id DESC LIMIT 100",
      [req.user.id],
    ),
    unread: (
      await get(
        "SELECT count(*) AS count FROM notifications WHERE user_id=? AND read_at IS NULL",
        [req.user.id],
      )
    ).count,
  }),
);
router.patch("/notifications/read", async (req, res) => {
  if (req.body.id)
    await run(
      "UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND id=?",
      [req.user.id, id(req.body.id)],
    );
  else
    await run(
      "UPDATE notifications SET read_at=CURRENT_TIMESTAMP WHERE user_id=? AND read_at IS NULL",
      [req.user.id],
    );
  res.json({ message: "Notifications marked as read" });
});
router.get("/saved", async (req, res) => {
  const items = await all(
    "SELECT kind,item_id,created_at AS saved_at FROM saved_items WHERE user_id=? ORDER BY created_at DESC",
    [req.user.id],
  );
  const results = [];
  for (const item of items) {
    const row = await get(
      `SELECT * FROM ${item.kind === "notice" ? "notices" : "routines"} WHERE id=?`,
      [item.item_id],
    );
    if (row && (req.user.role !== "student" || visibleTo(row, req.user)))
      results.push({ ...row, kind: item.kind, saved_at: item.saved_at });
  }
  res.json(results);
});
router.put("/saved/:kind/:id", async (req, res) => {
  assert(
    ["notice", "routine"].includes(req.params.kind),
    "Invalid saved item type",
  );
  const item = await get(
    `SELECT * FROM ${req.params.kind === "notice" ? "notices" : "routines"} WHERE id=?`,
    [id(req.params.id)],
  );
  assert(item, "Item not found", 404);
  assert(
    req.user.role !== "student" || visibleTo(item, req.user),
    "This item is outside your academic profile",
    403,
  );
  await run(
    "INSERT OR IGNORE INTO saved_items (user_id,kind,item_id) VALUES (?,?,?)",
    [req.user.id, req.params.kind, item.id],
  );
  res.json({ message: "Saved" });
});
router.delete("/saved/:kind/:id", async (req, res) => {
  await run(
    "DELETE FROM saved_items WHERE user_id=? AND kind=? AND item_id=?",
    [req.user.id, req.params.kind, id(req.params.id)],
  );
  res.json({ message: "Removed from saved items" });
});
router.get("/stats", allowRoles("teacher", "super_admin"), async (req, res) => {
  const teacher = req.user.role === "teacher",
    scope = teacher ? [req.user.department_id] : [];
  const [students, teachers, complaints, departments] = await Promise.all([
    get(
      `SELECT count(*) AS count FROM users WHERE role='student'${teacher ? " AND department_id=?" : ""}`,
      scope,
    ),
    get(
      `SELECT count(*) AS count FROM users WHERE role='teacher'${teacher ? " AND department_id=?" : ""}`,
      scope,
    ),
    get(
      `SELECT count(*) AS count FROM complaints c JOIN users u ON u.id=c.student_id WHERE c.status!='resolved'${teacher ? " AND u.department_id=?" : ""}`,
      scope,
    ),
    get("SELECT count(*) AS count FROM departments"),
  ]);
  res.json({
    students: students.count,
    teachers: teachers.count,
    complaints: complaints.count,
    departments: departments.count,
  });
});
router.get("/audit", allowRoles("super_admin"), async (req, res) =>
  res.json(
    await all(
      "SELECT a.*,u.name AS actor_name FROM audit_log a LEFT JOIN users u ON u.id=a.actor_id ORDER BY a.id DESC LIMIT 200",
    ),
  ),
);
module.exports = router;
