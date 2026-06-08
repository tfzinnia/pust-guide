const bcrypt = require("bcryptjs");
const { run, get, all } = require("../config/db");

async function getUsers(req, res) {
  try {
    const { role, department_id } = req.query;

    let sql = `
      SELECT users.id, users.name, users.email, users.role, users.roll, users.teacher_id,
      users.department_id, users.session, users.year, users.semester, users.designation,
      users.created_at, departments.short_name AS department
      FROM users
      LEFT JOIN departments ON departments.id = users.department_id
      WHERE 1 = 1
    `;

    const params = [];

    if (role) {
      sql += " AND users.role = ?";
      params.push(role);
    }

    if (department_id) {
      sql += " AND users.department_id = ?";
      params.push(department_id);
    }

    sql += " ORDER BY users.created_at DESC";

    const users = await all(sql, params);

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load users",
      error: error.message,
    });
  }
}

async function updateUser(req, res) {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const {
      name,
      email,
      password,
      role,
      roll,
      teacher_id,
      department_id,
      session,
      year,
      semester,
      designation,
    } = req.body;

    let finalPassword = user.password;

    if (password) {
      finalPassword = await bcrypt.hash(password, 10);
    }

    await run(
      `UPDATE users
       SET name = ?, email = ?, password = ?, role = ?, roll = ?, teacher_id = ?,
       department_id = ?, session = ?, year = ?, semester = ?, designation = ?
       WHERE id = ?`,
      [
        name || user.name,
        email || user.email,
        finalPassword,
        role || user.role,
        roll === undefined ? user.roll : roll,
        teacher_id === undefined ? user.teacher_id : teacher_id,
        department_id === undefined ? user.department_id : department_id,
        session === undefined ? user.session : session,
        year === undefined ? user.year : year,
        semester === undefined ? user.semester : semester,
        designation === undefined ? user.designation : designation,
        req.params.id,
      ]
    );

    res.json({
      message: "User updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update user",
      error: error.message,
    });
  }
}

async function deleteUser(req, res) {
  try {
    const user = await get("SELECT * FROM users WHERE id = ?", [
      req.params.id,
    ]);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    if (user.role === "super_admin" && req.user.id === user.id) {
      return res.status(400).json({
        message: "You cannot delete your own super admin account",
      });
    }

    await run("DELETE FROM users WHERE id = ?", [req.params.id]);

    res.json({
      message: "User deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete user",
      error: error.message,
    });
  }
}

module.exports = {
  getUsers,
  updateUser,
  deleteUser,
};