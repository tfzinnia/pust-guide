const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("node:crypto");
const { run, get } = require("../config/db");
const {
  assert,
  text,
  email,
  password,
  academic,
  id,
} = require("../utils/http");
const { audit } = require("../services/activity");
const publicColumns =
  "u.id,u.name,u.email,u.role,u.roll,u.teacher_id,u.department_id,u.session,u.year,u.semester,u.designation,d.name AS department_name,d.short_name AS department";
async function publicUser(userId) {
  return get(
    `SELECT ${publicColumns} FROM users u LEFT JOIN departments d ON d.id = u.department_id WHERE u.id = ?`,
    [userId],
  );
}
function createToken(user) {
  return jwt.sign(
    { id: user.id, version: user.token_version || 0 },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}
async function createAccount(req, res, role) {
  const body = req.body;
  const data = {
    name: text(body.name, "Name", { required: true, max: 120 }),
    email: email(body.email),
    password: await bcrypt.hash(password(body.password), 12),
    department_id: id(body.department_id, "Department"),
  };
  assert(
    await get("SELECT id FROM departments WHERE id = ?", [data.department_id]),
    "Department does not exist",
  );
  if (role === "student")
    Object.assign(data, academic(body, true), {
      roll: text(body.roll, "Roll", { required: true, max: 40 }),
    });
  else
    Object.assign(data, {
      teacher_id: text(body.teacher_id, "Teacher ID", {
        required: true,
        max: 40,
      }),
      designation: text(body.designation, "Designation", {
        required: true,
        max: 120,
      }),
    });
  const keys = Object.keys(data);
  const result = await run(
    `INSERT INTO users (${keys.join(",")},role) VALUES (${keys.map(() => "?").join(",")},?)`,
    [...Object.values(data), role],
  );
  if (req.user) await audit(req.user, "create", "users", result.id);
  res
    .status(201)
    .json({ message: "Account created successfully", user_id: result.id });
}
async function login(req, res) {
  const identifier = text(req.body.identifier, "Email or ID", {
    required: true,
    max: 254,
  });
  assert(
    typeof req.body.password === "string" && req.body.password.length <= 200,
    "Password is required",
  );
  const user = await get(
    "SELECT * FROM users WHERE lower(email) = lower(?) OR roll = ? OR teacher_id = ?",
    [identifier, identifier, identifier],
  );
  assert(
    user && (await bcrypt.compare(req.body.password, user.password)),
    "Invalid login credentials",
    401,
  );
  assert(
    !(user.role === "super_admin" && req.body.password === "admin123"),
    "The old default administrator password is disabled. Run the admin reset command.",
    403,
  );
  assert(
    !req.body.role || req.body.role === user.role,
    "Select the correct login type",
    403,
  );
  res.json({ token: createToken(user), user: await publicUser(user.id) });
}
async function updateProfile(req, res) {
  const name = text(req.body.name, "Name", { required: true, max: 120 }),
    newEmail = email(req.body.email);
  if (newEmail !== req.user.email) {
    const row = await get("SELECT password FROM users WHERE id = ?", [
      req.user.id,
    ]);
    assert(
      typeof req.body.current_password === "string" &&
        (await bcrypt.compare(req.body.current_password, row.password)),
      "Current password is required to change email",
      403,
    );
  }
  await run("UPDATE users SET name = ?,email = ? WHERE id = ?", [
    name,
    newEmail,
    req.user.id,
  ]);
  res.json({ message: "Profile updated", user: await publicUser(req.user.id) });
}
async function changePassword(req, res) {
  const user = await get("SELECT * FROM users WHERE id = ?", [req.user.id]);
  assert(
    typeof req.body.current_password === "string" &&
      (await bcrypt.compare(req.body.current_password, user.password)),
    "Current password is incorrect",
    403,
  );
  const hashed = await bcrypt.hash(password(req.body.new_password), 12);
  await run(
    "UPDATE users SET password = ?,token_version = token_version + 1 WHERE id = ?",
    [hashed, user.id],
  );
  await run("DELETE FROM password_resets WHERE user_id = ?", [user.id]);
  const updated = await get("SELECT * FROM users WHERE id = ?", [user.id]);
  res.json({
    message: "Password changed. Other sessions have been signed out.",
    token: createToken(updated),
  });
}
async function issueReset(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await run("DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?", [
    userId,
    Date.now(),
  ]);
  await run(
    "INSERT INTO password_resets (token_hash,user_id,expires_at) VALUES (?,?,?)",
    [
      crypto.createHash("sha256").update(token).digest("hex"),
      userId,
      Date.now() + 30 * 60 * 1000,
    ],
  );
  const origin = new URL(
    process.env.APP_URL ||
      process.env.CLIENT_ORIGIN?.split(",")[0] ||
      "http://localhost:5173",
  );
  return `${origin.origin}/reset-password#token=${token}`;
}
async function forgotPassword(req, res) {
  const address = email(req.body.email);
  const user = await get("SELECT id,email FROM users WHERE lower(email) = ?", [
    address,
  ]);
  if (user && process.env.MAIL_WEBHOOK_URL) {
    const url = await issueReset(user.id);
    try {
      const response = await fetch(process.env.MAIL_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.MAIL_WEBHOOK_TOKEN
            ? { Authorization: `Bearer ${process.env.MAIL_WEBHOOK_TOKEN}` }
            : {}),
        },
        body: JSON.stringify({
          to: user.email,
          subject: "Reset your PUST Guide password",
          text: `Open this link within 30 minutes to reset your password: ${url}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error("Mail delivery failed");
    } catch {
      console.error(
        "Password recovery delivery failed; check mail integration configuration.",
      );
    }
  }
  res.json({
    message:
      "If this address has an account and email delivery is configured, a reset link will arrive shortly. Otherwise, contact your administrator.",
  });
}
async function resetPassword(req, res) {
  const token = text(req.body.token, "Reset token", {
    required: true,
    max: 128,
  });
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const reset = await get(
    "SELECT * FROM password_resets WHERE token_hash = ? AND expires_at > ?",
    [hash, Date.now()],
  );
  assert(reset, "This reset link is invalid or expired");
  const hashed = await bcrypt.hash(password(req.body.password), 12);
  const claimed = await run(
    "DELETE FROM password_resets WHERE token_hash = ? AND expires_at > ?",
    [hash, Date.now()],
  );
  assert(claimed.changes === 1, "This reset link has already been used");
  await run(
    "UPDATE users SET password = ?,token_version = token_version + 1 WHERE id = ?",
    [hashed, reset.user_id],
  );
  res.json({ message: "Password reset. You can now sign in." });
}
module.exports = {
  studentSignup: (req, res) => createAccount(req, res, "student"),
  createTeacher: (req, res) => createAccount(req, res, "teacher"),
  login,
  getMe: (req, res) => res.json({ user: req.user }),
  publicUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  issueReset,
};
