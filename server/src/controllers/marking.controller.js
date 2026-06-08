const { run, get, all } = require("../config/db");

function canManageDepartment(user, departmentId) {
  return (
    user.role === "super_admin" ||
    (user.role === "teacher" &&
      Number(user.department_id) === Number(departmentId))
  );
}

async function createMarkingCriteria(req, res) {
  try {
    const {
      department_id,
      year,
      semester,
      ct_total,
      best_ct_counted,
      ct_marks,
      attendance_marks,
      internal_total,
      theory_marks,
      total_marks,
    } = req.body;

    if (!department_id) {
      return res.status(400).json({
        message: "Department is required",
      });
    }

    if (!canManageDepartment(req.user, department_id)) {
      return res.status(403).json({
        message: "You can only manage your own department marking criteria",
      });
    }

    const result = await run(
      `INSERT INTO marking_criteria
      (department_id, year, semester, ct_total, best_ct_counted, ct_marks, attendance_marks, internal_total, theory_marks, total_marks, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        department_id,
        year || "",
        semester || "",
        ct_total || 3,
        best_ct_counted || 2,
        ct_marks || 20,
        attendance_marks || 10,
        internal_total || 30,
        theory_marks || 70,
        total_marks || 100,
        req.user.id,
      ]
    );

    res.status(201).json({
      message: "Marking criteria created",
      id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create marking criteria",
      error: error.message,
    });
  }
}

async function getMarkingCriteria(req, res) {
  try {
    const { department_id, year, semester } = req.query;

    let sql = `
      SELECT marking_criteria.*, departments.short_name AS department
      FROM marking_criteria
      JOIN departments ON departments.id = marking_criteria.department_id
      WHERE 1 = 1
    `;

    const params = [];

    if (department_id) {
      sql += " AND marking_criteria.department_id = ?";
      params.push(department_id);
    }

    if (year) {
      sql += " AND marking_criteria.year = ?";
      params.push(year);
    }

    if (semester) {
      sql += " AND marking_criteria.semester = ?";
      params.push(semester);
    }

    sql += " ORDER BY marking_criteria.created_at DESC";

    const rows = await all(sql, params);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load marking criteria",
      error: error.message,
    });
  }
}

async function getMyMarkingCriteria(req, res) {
  try {
    const rows = await all(
      `SELECT marking_criteria.*, departments.short_name AS department
       FROM marking_criteria
       JOIN departments ON departments.id = marking_criteria.department_id
       WHERE marking_criteria.department_id = ?
       AND (marking_criteria.year = ? OR marking_criteria.year = '')
       AND (marking_criteria.semester = ? OR marking_criteria.semester = '')
       ORDER BY marking_criteria.created_at DESC`,
      [req.user.department_id, req.user.year, req.user.semester]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load your marking criteria",
      error: error.message,
    });
  }
}

async function updateMarkingCriteria(req, res) {
  try {
    const item = await get("SELECT * FROM marking_criteria WHERE id = ?", [
      req.params.id,
    ]);

    if (!item) {
      return res.status(404).json({
        message: "Marking criteria not found",
      });
    }

    if (!canManageDepartment(req.user, item.department_id)) {
      return res.status(403).json({
        message: "You can only update your own department marking criteria",
      });
    }

    const {
      department_id,
      year,
      semester,
      ct_total,
      best_ct_counted,
      ct_marks,
      attendance_marks,
      internal_total,
      theory_marks,
      total_marks,
    } = req.body;

    if (department_id && !canManageDepartment(req.user, department_id)) {
      return res.status(403).json({
        message: "You cannot move marking criteria to another department",
      });
    }

    await run(
      `UPDATE marking_criteria
       SET department_id = ?, year = ?, semester = ?, ct_total = ?, best_ct_counted = ?, ct_marks = ?, attendance_marks = ?, internal_total = ?, theory_marks = ?, total_marks = ?
       WHERE id = ?`,
      [
        department_id || item.department_id,
        year === undefined ? item.year : year,
        semester === undefined ? item.semester : semester,
        ct_total === undefined ? item.ct_total : ct_total,
        best_ct_counted === undefined
          ? item.best_ct_counted
          : best_ct_counted,
        ct_marks === undefined ? item.ct_marks : ct_marks,
        attendance_marks === undefined
          ? item.attendance_marks
          : attendance_marks,
        internal_total === undefined ? item.internal_total : internal_total,
        theory_marks === undefined ? item.theory_marks : theory_marks,
        total_marks === undefined ? item.total_marks : total_marks,
        req.params.id,
      ]
    );

    res.json({
      message: "Marking criteria updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update marking criteria",
      error: error.message,
    });
  }
}

async function deleteMarkingCriteria(req, res) {
  try {
    const item = await get("SELECT * FROM marking_criteria WHERE id = ?", [
      req.params.id,
    ]);

    if (!item) {
      return res.status(404).json({
        message: "Marking criteria not found",
      });
    }

    if (!canManageDepartment(req.user, item.department_id)) {
      return res.status(403).json({
        message: "You can only delete your own department marking criteria",
      });
    }

    await run("DELETE FROM marking_criteria WHERE id = ?", [req.params.id]);

    res.json({
      message: "Marking criteria deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete marking criteria",
      error: error.message,
    });
  }
}

module.exports = {
  createMarkingCriteria,
  getMarkingCriteria,
  getMyMarkingCriteria,
  updateMarkingCriteria,
  deleteMarkingCriteria,
};