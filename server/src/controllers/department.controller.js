const { run, get, all } = require("../config/db");

async function getDepartments(req, res) {
  try {
    const departments = await all("SELECT * FROM departments ORDER BY name ASC");
    res.json(departments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load departments",
      error: error.message,
    });
  }
}

async function getDepartmentById(req, res) {
  try {
    const department = await get("SELECT * FROM departments WHERE id = ?", [
      req.params.id,
    ]);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    const teachers = await all(
      `SELECT id, teacher_id, name, email, designation 
       FROM users 
       WHERE role = 'teacher' AND department_id = ?`,
      [req.params.id]
    );

    res.json({
      ...department,
      teachers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to load department",
      error: error.message,
    });
  }
}

async function createDepartment(req, res) {
  try {
    const { name, short_name, description } = req.body;

    if (!name || !short_name) {
      return res.status(400).json({
        message: "Department name and short name are required",
      });
    }

    const result = await run(
      "INSERT INTO departments (name, short_name, description) VALUES (?, ?, ?)",
      [name, short_name, description || ""]
    );

    res.status(201).json({
      message: "Department created",
      id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create department",
      error: error.message,
    });
  }
}

async function updateDepartment(req, res) {
  try {
    const department = await get("SELECT * FROM departments WHERE id = ?", [
      req.params.id,
    ]);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    const { name, short_name, description } = req.body;

    await run(
      `UPDATE departments 
       SET name = ?, short_name = ?, description = ?
       WHERE id = ?`,
      [
        name || department.name,
        short_name || department.short_name,
        description === undefined ? department.description : description,
        req.params.id,
      ]
    );

    res.json({
      message: "Department updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update department",
      error: error.message,
    });
  }
}

async function deleteDepartment(req, res) {
  try {
    const department = await get("SELECT * FROM departments WHERE id = ?", [
      req.params.id,
    ]);

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    await run("DELETE FROM departments WHERE id = ?", [req.params.id]);

    res.json({
      message: "Department deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete department",
      error: error.message,
    });
  }
}

module.exports = {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};