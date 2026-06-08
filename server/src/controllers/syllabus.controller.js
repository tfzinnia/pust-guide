const { run, get, all } = require("../config/db");

function canManageDepartment(user, departmentId) {
  return (
    user.role === "super_admin" ||
    (user.role === "teacher" &&
      Number(user.department_id) === Number(departmentId))
  );
}

async function createSyllabus(req, res) {
  try {
    const {
      department_id,
      session,
      year,
      semester,
      course_code,
      course_title,
      credits,
      pdf_url,
    } = req.body;

    if (!department_id || !session || !year || !semester || !course_code || !course_title) {
      return res.status(400).json({
        message: "Department, session, year, semester, course code and course title are required",
      });
    }

    if (!canManageDepartment(req.user, department_id)) {
      return res.status(403).json({ message: "You can only manage your own department syllabus" });
    }

    const result = await run(
      `INSERT INTO syllabus
      (department_id, session, year, semester, course_code, course_title, credits, pdf_url, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        department_id,
        session,
        year,
        semester,
        course_code,
        course_title,
        credits || 0,
        pdf_url || "",
        req.user.id,
      ]
    );

    res.status(201).json({ message: "Syllabus added", id: result.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to add syllabus", error: error.message });
  }
}

async function getSyllabus(req, res) {
  try {
    const { department_id, session, year, semester } = req.query;

    let sql = `
      SELECT syllabus.*, departments.short_name AS department
      FROM syllabus
      JOIN departments ON departments.id = syllabus.department_id
      WHERE 1 = 1
    `;
    const params = [];

    if (department_id) {
      sql += " AND syllabus.department_id = ?";
      params.push(department_id);
    }

    if (session) {
      sql += " AND syllabus.session = ?";
      params.push(session);
    }

    if (year) {
      sql += " AND syllabus.year = ?";
      params.push(year);
    }

    if (semester) {
      sql += " AND syllabus.semester = ?";
      params.push(semester);
    }

    sql += " ORDER BY syllabus.year ASC, syllabus.semester ASC, syllabus.course_code ASC";

    const rows = await all(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load syllabus", error: error.message });
  }
}

async function getMySyllabus(req, res) {
  try {
    const rows = await all(
      `SELECT syllabus.*, departments.short_name AS department
       FROM syllabus
       JOIN departments ON departments.id = syllabus.department_id
       WHERE syllabus.department_id = ?
       AND syllabus.session = ?
       AND syllabus.year = ?
       AND syllabus.semester = ?
       ORDER BY syllabus.course_code ASC`,
      [req.user.department_id, req.user.session, req.user.year, req.user.semester]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load your syllabus", error: error.message });
  }
}

async function updateSyllabus(req, res) {
  try {
    const item = await get("SELECT * FROM syllabus WHERE id = ?", [req.params.id]);

    if (!item) return res.status(404).json({ message: "Syllabus item not found" });

    if (!canManageDepartment(req.user, item.department_id)) {
      return res.status(403).json({ message: "You can only update your own department syllabus" });
    }

    const {
      department_id,
      session,
      year,
      semester,
      course_code,
      course_title,
      credits,
      pdf_url,
    } = req.body;

    if (department_id && !canManageDepartment(req.user, department_id)) {
      return res.status(403).json({ message: "You cannot move syllabus to another department" });
    }

    await run(
      `UPDATE syllabus
       SET department_id = ?, session = ?, year = ?, semester = ?, course_code = ?, course_title = ?, credits = ?, pdf_url = ?
       WHERE id = ?`,
      [
        department_id || item.department_id,
        session === undefined ? item.session : session,
        year || item.year,
        semester || item.semester,
        course_code || item.course_code,
        course_title || item.course_title,
        credits === undefined ? item.credits : credits,
        pdf_url === undefined ? item.pdf_url : pdf_url,
        req.params.id,
      ]
    );

    res.json({ message: "Syllabus updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update syllabus", error: error.message });
  }
}

async function deleteSyllabus(req, res) {
  try {
    const item = await get("SELECT * FROM syllabus WHERE id = ?", [req.params.id]);

    if (!item) return res.status(404).json({ message: "Syllabus item not found" });

    if (!canManageDepartment(req.user, item.department_id)) {
      return res.status(403).json({ message: "You can only delete your own department syllabus" });
    }

    await run("DELETE FROM syllabus WHERE id = ?", [req.params.id]);
    res.json({ message: "Syllabus deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete syllabus", error: error.message });
  }
}

module.exports = {
  createSyllabus,
  getSyllabus,
  getMySyllabus,
  updateSyllabus,
  deleteSyllabus,
};