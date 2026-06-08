const { run, get, all } = require("../config/db");

function canManageDepartment(user, departmentId) {
  return (
    user.role === "super_admin" ||
    (user.role === "teacher" &&
      Number(user.department_id) === Number(departmentId))
  );
}

async function createNotice(req, res) {
  try {
    const {
      title,
      description,
      category,
      department_id,
      session,
      year,
      semester,
      is_urgent,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    if (department_id && !canManageDepartment(req.user, department_id)) {
      return res.status(403).json({ message: "You can only manage your own department notices" });
    }

    const result = await run(
      `INSERT INTO notices
      (title, description, category, department_id, session, year, semester, is_urgent, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        category || "General",
        department_id || null,
        session || "",
        year || "",
        semester || "",
        is_urgent ? 1 : 0,
        req.user.id,
      ]
    );

    res.status(201).json({ message: "Notice created", id: result.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to create notice", error: error.message });
  }
}

async function getNotices(req, res) {
  try {
    const { department_id, session, year, semester, category } = req.query;

    let sql = `
      SELECT notices.*, departments.short_name AS department
      FROM notices
      LEFT JOIN departments ON departments.id = notices.department_id
      WHERE 1 = 1
    `;
    const params = [];

    if (department_id) {
      sql += " AND notices.department_id = ?";
      params.push(department_id);
    }

    if (session) {
      sql += " AND notices.session = ?";
      params.push(session);
    }

    if (year) {
      sql += " AND notices.year = ?";
      params.push(year);
    }

    if (semester) {
      sql += " AND notices.semester = ?";
      params.push(semester);
    }

    if (category && category !== "All") {
      sql += " AND LOWER(notices.category) = LOWER(?)";
      params.push(category);
    }

    sql += " ORDER BY notices.is_urgent DESC, notices.created_at DESC";

    const rows = await all(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load notices", error: error.message });
  }
}

async function getMyNotices(req, res) {
  try {
    const rows = await all(
      `SELECT notices.*, departments.short_name AS department
       FROM notices
       LEFT JOIN departments ON departments.id = notices.department_id
       WHERE 
       notices.department_id IS NULL
       OR (
        notices.department_id = ?
        AND (notices.session = ? OR notices.session = '' OR notices.session IS NULL)
        AND (notices.year = ? OR notices.year = '' OR notices.year IS NULL)
        AND (notices.semester = ? OR notices.semester = '' OR notices.semester IS NULL)
       )
       ORDER BY notices.is_urgent DESC, notices.created_at DESC`,
      [req.user.department_id, req.user.session, req.user.year, req.user.semester]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load your notices", error: error.message });
  }
}

async function updateNotice(req, res) {
  try {
    const notice = await get("SELECT * FROM notices WHERE id = ?", [req.params.id]);

    if (!notice) return res.status(404).json({ message: "Notice not found" });

    if (notice.department_id && !canManageDepartment(req.user, notice.department_id)) {
      return res.status(403).json({ message: "You can only update your own department notice" });
    }

    const {
      title,
      description,
      category,
      department_id,
      session,
      year,
      semester,
      is_urgent,
    } = req.body;

    if (department_id && !canManageDepartment(req.user, department_id)) {
      return res.status(403).json({ message: "You cannot move notice to another department" });
    }

    await run(
      `UPDATE notices
       SET title = ?, description = ?, category = ?, department_id = ?, session = ?, year = ?, semester = ?, is_urgent = ?
       WHERE id = ?`,
      [
        title || notice.title,
        description || notice.description,
        category || notice.category,
        department_id === undefined ? notice.department_id : department_id,
        session === undefined ? notice.session : session,
        year === undefined ? notice.year : year,
        semester === undefined ? notice.semester : semester,
        is_urgent === undefined ? notice.is_urgent : is_urgent ? 1 : 0,
        req.params.id,
      ]
    );

    res.json({ message: "Notice updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notice", error: error.message });
  }
}

async function deleteNotice(req, res) {
  try {
    const notice = await get("SELECT * FROM notices WHERE id = ?", [req.params.id]);

    if (!notice) return res.status(404).json({ message: "Notice not found" });

    if (notice.department_id && !canManageDepartment(req.user, notice.department_id)) {
      return res.status(403).json({ message: "You can only delete your own department notice" });
    }

    await run("DELETE FROM notices WHERE id = ?", [req.params.id]);
    res.json({ message: "Notice deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete notice", error: error.message });
  }
}

module.exports = {
  createNotice,
  getNotices,
  getMyNotices,
  updateNotice,
  deleteNotice,
};