const { run, get, all } = require("../config/db");
const { assert, text, id } = require("../utils/http");
const { audit, notifyUser } = require("../services/activity");
const categories = [
  "ragging",
  "harassment",
  "hall",
  "transport",
  "classroom",
  "academic",
  "others",
];
async function loadComplaint(complaintId, user) {
  const row = await get(
    `SELECT c.*,u.name AS student_name,u.roll,u.department_id,d.short_name AS department,a.name AS assigned_name FROM complaints c JOIN users u ON u.id=c.student_id LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN users a ON a.id=c.assigned_to WHERE c.id = ?`,
    [id(complaintId)],
  );
  assert(row, "Complaint not found", 404);
  assert(
    user.role === "super_admin" ||
      (user.role === "student" && row.student_id === user.id) ||
      (user.role === "teacher" && row.department_id === user.department_id),
    "You cannot access this complaint",
    403,
  );
  return row;
}
function redact(row, user) {
  const result = { ...row };
  if (row.is_anonymous && user.role !== "student") {
    delete result.student_id;
    delete result.student_name;
    delete result.roll;
  }
  return result;
}
async function createComplaint(req, res) {
  const category = text(req.body.category, "Category", { required: true });
  assert(categories.includes(category), "Invalid complaint category");
  const description = text(req.body.description, "Description", {
    required: true,
    max: 10000,
  });
  const image = text(req.body.image_url, "Evidence link", { max: 500 });
  if (image) {
    assert(
      /^\/api\/files\/[a-f0-9-]+$/.test(image),
      "Upload evidence using the attachment button",
    );
    const file = await get("SELECT * FROM uploaded_files WHERE id = ?", [
      image.split("/").pop(),
    ]);
    assert(
      file?.owner_id === req.user.id && file.purpose === "evidence",
      "Choose your own evidence attachment",
    );
    assert(
      !(await get("SELECT id FROM complaints WHERE image_url = ?", [image])),
      "This evidence is already attached",
    );
  }
  assert(
    [undefined, true, false, 0, 1].includes(req.body.is_anonymous),
    "Invalid anonymity setting",
  );
  const result = await run(
    "INSERT INTO complaints (student_id,category,description,image_url,is_anonymous) VALUES (?,?,?,?,?)",
    [req.user.id, category, description, image, req.body.is_anonymous ? 1 : 0],
  );
  await run(
    "INSERT INTO complaint_updates (complaint_id,actor_id,actor_role,message,status) VALUES (?,?,?,?,?)",
    [result.id, req.user.id, "student", "Complaint submitted", "submitted"],
  );
  res.status(201).json({ message: "Complaint submitted", id: result.id });
}
async function list(req, res) {
  const params = [],
    conditions = [];
  if (req.user.role === "student") {
    conditions.push("c.student_id = ?");
    params.push(req.user.id);
  }
  if (req.user.role === "teacher") {
    conditions.push("u.department_id = ?");
    params.push(req.user.department_id);
  }
  if (req.query.status) {
    conditions.push("c.status = ?");
    params.push(req.query.status);
  }
  const rows = await all(
    `SELECT c.*,u.name AS student_name,u.roll,u.department_id,d.short_name AS department,a.name AS assigned_name FROM complaints c JOIN users u ON u.id=c.student_id LEFT JOIN departments d ON d.id=u.department_id LEFT JOIN users a ON a.id=c.assigned_to${conditions.length ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY c.created_at DESC,c.id DESC`,
    params,
  );
  res.json(rows.map((row) => redact(row, req.user)));
}
async function details(req, res) {
  const row = await loadComplaint(req.params.id, req.user);
  const updates = await all(
    "SELECT id,actor_role,message,status,created_at FROM complaint_updates WHERE complaint_id = ? ORDER BY id",
    [row.id],
  );
  const assignees =
    req.user.role === "student"
      ? []
      : await all(
          "SELECT id,name FROM users WHERE role='teacher' AND department_id = ?",
          [row.department_id],
        );
  res.json({ ...redact(row, req.user), updates, assignees });
}
async function updateComplaintStatus(req, res) {
  const row = await loadComplaint(req.params.id, req.user);
  const status = req.body.status || row.status;
  assert(
    ["submitted", "under_review", "resolved"].includes(status),
    "Invalid complaint status",
  );
  const transitions = {
    submitted: ["submitted", "under_review", "resolved"],
    under_review: ["under_review", "resolved"],
    resolved: ["resolved", "under_review"],
  };
  assert(transitions[row.status].includes(status), "Invalid status transition");
  let assigned = row.assigned_to;
  if (req.body.assigned_to !== undefined) {
    assigned = req.body.assigned_to ? id(req.body.assigned_to) : null;
    if (assigned)
      assert(
        await get(
          "SELECT id FROM users WHERE id = ? AND role = 'teacher' AND department_id = ?",
          [assigned, row.department_id],
        ),
        "Assign a teacher from this department",
      );
  }
  const note = text(req.body.admin_note, "Note", { max: 5000 });
  await run(
    "UPDATE complaints SET status = ?,admin_note = ?,assigned_to = ?,updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [status, note || row.admin_note, assigned, row.id],
  );
  await run(
    "INSERT INTO complaint_updates (complaint_id,actor_id,actor_role,message,status) VALUES (?,?,?,?,?)",
    [
      row.id,
      req.user.id,
      req.user.role,
      note ||
        (assigned !== row.assigned_to
          ? "Assignment updated"
          : "Status updated"),
      status,
    ],
  );
  await notifyUser(
    row.student_id,
    `Complaint #${row.id} updated`,
    status.replace("_", " "),
    `/complaints/${row.id}`,
  );
  if (assigned && assigned !== row.assigned_to)
    await notifyUser(
      assigned,
      "Complaint assigned",
      `Complaint #${row.id} requires your review.`,
      `/complaints/${row.id}`,
    );
  await audit(req.user, "status-update", "complaints", row.id);
  res.json({ message: "Complaint updated" });
}
async function reply(req, res) {
  const row = await loadComplaint(req.params.id, req.user);
  const message = text(req.body.message, "Reply", {
    required: true,
    max: 5000,
  });
  await run(
    "INSERT INTO complaint_updates (complaint_id,actor_id,actor_role,message) VALUES (?,?,?,?)",
    [row.id, req.user.id, req.user.role, message],
  );
  if (req.user.role !== "student")
    await notifyUser(
      row.student_id,
      `New reply on complaint #${row.id}`,
      "Open your complaint to read the reply.",
      `/complaints/${row.id}`,
    );
  else if (row.assigned_to)
    await notifyUser(
      row.assigned_to,
      `New reply on complaint #${row.id}`,
      "The student added a reply.",
      `/complaints/${row.id}`,
    );
  res.status(201).json({ message: "Reply added" });
}
module.exports = {
  createComplaint,
  getMyComplaints: list,
  getAllComplaints: list,
  getDepartmentComplaints: list,
  updateComplaintStatus,
  details,
  reply,
  loadComplaint,
};
