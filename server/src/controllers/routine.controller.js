const { run, get, all } = require("../config/db");

function canManageDepartment(user, departmentId) {
  return (
    user.role === "super_admin" ||
    (user.role === "teacher" &&
      Number(user.department_id) === Number(departmentId))
  );
}

async function createRoutine(req, res) {
  try {
    const {
      type,
      department_id,
      session,
      year,
      semester,
      course_code,
      course_title,
      routine_date,
      day,
      start_time,
      end_time,
      room,
      teacher_name,
    } = req.body;

    if (!["class", "exam"].includes(type)) {
      return res.status(400).json({ message: "Routine type must be class or exam" });
    }

    if (!department_id || !session || !year || !semester || !course_title || !start_time) {
      return res.status(400).json({
        message: "Department, session, year, semester, course title, and start time are required",
      });
    }

    if (!canManageDepartment(req.user, department_id)) {
      return res.status(403).json({ message: "You can only manage your own department routine" });
    }

    const result = await run(
      `INSERT INTO routines
      (type, department_id, session, year, semester, course_code, course_title, routine_date, day, start_time, end_time, room, teacher_name, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        type,
        department_id,
        session,
        year,
        semester,
        course_code || "",
        course_title,
        routine_date || "",
        day || "",
        start_time,
        end_time || "",
        room || "",
        teacher_name || "",
        req.user.id,
      ]
    );

    res.status(201).json({ message: `${type} routine added`, id: result.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to add routine", error: error.message });
  }
}

async function getRoutines(req, res) {
  try {
    const { type, department_id, session, year, semester } = req.query;

    let sql = `
      SELECT routines.*, departments.short_name AS department
      FROM routines
      JOIN departments ON departments.id = routines.department_id
      WHERE 1 = 1
    `;
    const params = [];

    if (type) {
      sql += " AND routines.type = ?";
      params.push(type);
    }

    if (department_id) {
      sql += " AND routines.department_id = ?";
      params.push(department_id);
    }

    if (session) {
      sql += " AND routines.session = ?";
      params.push(session);
    }

    if (year) {
      sql += " AND routines.year = ?";
      params.push(year);
    }

    if (semester) {
      sql += " AND routines.semester = ?";
      params.push(semester);
    }

    sql += " ORDER BY routines.routine_date ASC, routines.day ASC, routines.start_time ASC";

    const rows = await all(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load routines", error: error.message });
  }
}

async function getMyRoutines(req, res) {
  try {
    const { type } = req.query;

    let sql = `
      SELECT routines.*, departments.short_name AS department
      FROM routines
      JOIN departments ON departments.id = routines.department_id
      WHERE routines.department_id = ?
      AND routines.session = ?
      AND routines.year = ?
      AND routines.semester = ?
    `;

    const params = [req.user.department_id, req.user.session, req.user.year, req.user.semester];

    if (type) {
      sql += " AND routines.type = ?";
      params.push(type);
    }

    sql += " ORDER BY routines.routine_date ASC, routines.day ASC, routines.start_time ASC";

    const rows = await all(sql, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load your routines", error: error.message });
  }
}

async function updateRoutine(req, res) {
  try {
    const routine = await get("SELECT * FROM routines WHERE id = ?", [req.params.id]);

    if (!routine) return res.status(404).json({ message: "Routine not found" });

    if (!canManageDepartment(req.user, routine.department_id)) {
      return res.status(403).json({ message: "You can only update your own department routine" });
    }

    const {
      type,
      department_id,
      session,
      year,
      semester,
      course_code,
      course_title,
      routine_date,
      day,
      start_time,
      end_time,
      room,
      teacher_name,
    } = req.body;

    if (department_id && !canManageDepartment(req.user, department_id)) {
      return res.status(403).json({ message: "You cannot move routine to another department" });
    }

    await run(
      `UPDATE routines
       SET type = ?, department_id = ?, session = ?, year = ?, semester = ?, course_code = ?, course_title = ?, routine_date = ?, day = ?, start_time = ?, end_time = ?, room = ?, teacher_name = ?
       WHERE id = ?`,
      [
        type || routine.type,
        department_id || routine.department_id,
        session === undefined ? routine.session : session,
        year || routine.year,
        semester || routine.semester,
        course_code === undefined ? routine.course_code : course_code,
        course_title || routine.course_title,
        routine_date === undefined ? routine.routine_date : routine_date,
        day === undefined ? routine.day : day,
        start_time || routine.start_time,
        end_time === undefined ? routine.end_time : end_time,
        room === undefined ? routine.room : room,
        teacher_name === undefined ? routine.teacher_name : teacher_name,
        req.params.id,
      ]
    );

    res.json({ message: "Routine updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update routine", error: error.message });
  }
}

async function deleteRoutine(req, res) {
  try {
    const routine = await get("SELECT * FROM routines WHERE id = ?", [req.params.id]);

    if (!routine) return res.status(404).json({ message: "Routine not found" });

    if (!canManageDepartment(req.user, routine.department_id)) {
      return res.status(403).json({ message: "You can only delete your own department routine" });
    }

    await run("DELETE FROM routines WHERE id = ?", [req.params.id]);
    res.json({ message: "Routine deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete routine", error: error.message });
  }
}

module.exports = {
  createRoutine,
  getRoutines,
  getMyRoutines,
  updateRoutine,
  deleteRoutine,
};