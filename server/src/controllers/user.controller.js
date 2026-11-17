const bcrypt = require("bcryptjs");
const { run, get, all } = require("../config/db");
const {
  assert,
  text,
  email,
  password,
  academic,
  id,
} = require("../utils/http");
const { audit, notifyUser } = require("../services/activity");
const { issueReset } = require("./auth.controller");
async function getUsers(req, res) {
  const params = [],
    clauses = [];
  for (const key of ["role", "department_id"])
    if (req.query[key]) {
      clauses.push(`u.${key} = ?`);
      params.push(req.query[key]);
    }
  if (req.query.q) {
    clauses.push(
      "(u.name LIKE ? OR u.email LIKE ? OR u.roll LIKE ? OR u.teacher_id LIKE ?)",
    );
    params.push(...Array(4).fill(`%${String(req.query.q).slice(0, 100)}%`));
  }
  const where = clauses.length ? ` WHERE ${clauses.join(" AND ")}` : "";
  const page = Math.max(1, Math.floor(Number(req.query.page) || 1)),
    limit = 20;
  const rows = await all(
    `SELECT u.id,u.name,u.email,u.role,u.roll,u.teacher_id,u.department_id,u.session,u.year,u.semester,u.designation,d.short_name AS department FROM users u LEFT JOIN departments d ON d.id=u.department_id${where} ORDER BY u.id DESC${req.query.page ? " LIMIT ? OFFSET ?" : ""}`,
    req.query.page ? [...params, limit, (page - 1) * limit] : params,
  );
  res.json(
    req.query.page
      ? {
          items: rows,
          total: (
            await get(`SELECT count(*) AS count FROM users u${where}`, params)
          ).count,
          page,
          limit,
        }
      : rows,
  );
}
async function updateUser(req, res) {
  const user = await get("SELECT * FROM users WHERE id = ?", [
    id(req.params.id),
  ]);
  assert(user, "User not found", 404);
  const body = { ...user, ...req.body };
  assert(body.role === user.role, "Use the existing account role");
  const data = {
    name: text(body.name, "Name", { required: true, max: 120 }),
    email: email(body.email),
    department_id: body.department_id ? id(body.department_id) : null,
    ...academic(body, user.role === "student"),
    roll: body.roll || null,
    teacher_id: body.teacher_id || null,
    designation: text(body.designation, "Designation", { max: 120 }),
  };
  if (req.body.password) {
    data.password = await bcrypt.hash(password(req.body.password), 12);
    data.token_version = user.token_version + 1;
  }
  await run(
    `UPDATE users SET ${Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(",")} WHERE id = ?`,
    [...Object.values(data), user.id],
  );
  await audit(req.user, "update", "users", user.id);
  res.json({ message: "User updated" });
}
async function deleteUser(req, res) {
  const user = await get("SELECT * FROM users WHERE id = ?", [
    id(req.params.id),
  ]);
  assert(user, "User not found", 404);
  assert(
    user.role !== "super_admin",
    "Administrator accounts cannot be deleted from this screen",
  );
  await run("DELETE FROM users WHERE id = ?", [user.id]);
  await audit(req.user, "delete", "users", user.id);
  res.json({ message: "User deleted" });
}
async function createAcademicRequest(req, res) {
  assert(req.user.role === "student", "Student access required", 403);
  const data = academic(req.body, true);
  assert(
    !(await get(
      "SELECT id FROM academic_requests WHERE user_id = ? AND status = 'pending'",
      [req.user.id],
    )),
    "You already have a pending academic change request",
    409,
  );
  await run(
    "INSERT INTO academic_requests (user_id,session,year,semester) VALUES (?,?,?,?)",
    [req.user.id, data.session, data.year, data.semester],
  );
  res.status(201).json({
    message: "Academic change requested. An administrator will review it.",
  });
}
async function reviewAcademicRequest(req, res) {
  assert(
    ["approved", "rejected"].includes(req.body.status),
    "Choose approved or rejected",
  );
  const request = await get(
    "SELECT * FROM academic_requests WHERE id = ? AND status = 'pending'",
    [id(req.params.id)],
  );
  assert(request, "Pending request not found", 404);
  const claimed = await run(
    "UPDATE academic_requests SET status = ? WHERE id = ? AND status = 'pending'",
    [req.body.status, request.id],
  );
  assert(claimed.changes === 1, "This request was already reviewed", 409);
  if (req.body.status === "approved")
    await run(
      "UPDATE users SET session = ?,year = ?,semester = ? WHERE id = ?",
      [request.session, request.year, request.semester, request.user_id],
    );
  await notifyUser(
    request.user_id,
    "Academic profile request",
    `Your request was ${req.body.status}.`,
    "/settings",
  );
  await audit(req.user, req.body.status, "academic_requests", request.id);
  res.json({ message: `Request ${req.body.status}` });
}
async function adminReset(req, res) {
  const user = await get("SELECT id FROM users WHERE id = ?", [
    id(req.params.id),
  ]);
  assert(user, "User not found", 404);
  const url = await issueReset(user.id);
  await audit(req.user, "password-reset", "users", user.id);
  res.json({
    url,
    message:
      "This link expires in 30 minutes. Share it privately with the account holder.",
  });
}
module.exports = {
  getUsers,
  updateUser,
  deleteUser,
  createAcademicRequest,
  reviewAcademicRequest,
  adminReset,
};
