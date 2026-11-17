const { run } = require("../config/db");
async function audit(user, action, resource, resourceId) {
  await run(
    "INSERT INTO audit_log (actor_id, action, resource, resource_id) VALUES (?, ?, ?, ?)",
    [user.id, action, resource, resourceId],
  );
}
async function notifyUser(userId, title, body, url) {
  await run(
    "INSERT INTO notifications (user_id, title, body, url) VALUES (?, ?, ?, ?)",
    [userId, title, body || "", url],
  );
}
async function notifyAudience(item, kind, action) {
  await run(
    `INSERT INTO notifications (user_id, title, body, url)
    SELECT id, ?, ?, ? FROM users WHERE role = 'student'
    AND (? IS NULL OR department_id = ?)
    AND (? = '' OR session = ?) AND (? = '' OR year = ?) AND (? = '' OR semester = ?)`,
    [
      `${action === "create" ? "New" : "Updated"} ${kind === "notices" ? "notice" : "routine"}`,
      item.title || item.course_title,
      kind === "notices"
        ? `/notices?notice=${item.id}`
        : `/departments/${item.department_id}?tab=${item.type === "exam" ? "Exam" : "Class"}&routine=${item.id}`,
      item.department_id || null,
      item.department_id || null,
      item.session || "",
      item.session || "",
      item.year || "",
      item.year || "",
      item.semester || "",
      item.semester || "",
    ],
  );
}
module.exports = { audit, notifyUser, notifyAudience };
