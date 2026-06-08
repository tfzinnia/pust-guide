const { run, all, get } = require("../config/db");

async function createComplaint(req, res) {
  try {
    const { category, description, image_url, is_anonymous } = req.body;

    if (!category || !description) {
      return res.status(400).json({ message: "Complaint category and description are required" });
    }

    const result = await run(
      `INSERT INTO complaints
      (student_id, category, description, image_url, is_anonymous)
      VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, category, description, image_url || "", is_anonymous ? 1 : 0]
    );

    res.status(201).json({ message: "Complaint submitted successfully", id: result.id });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit complaint", error: error.message });
  }
}

async function getMyComplaints(req, res) {
  try {
    const rows = await all(
      "SELECT * FROM complaints WHERE student_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load complaints", error: error.message });
  }
}

async function getAllComplaints(req, res) {
  try {
    const rows = await all(
      `SELECT complaints.*, users.name AS student_name, users.roll, users.department_id,
       departments.short_name AS department
       FROM complaints
       JOIN users ON users.id = complaints.student_id
       LEFT JOIN departments ON departments.id = users.department_id
       ORDER BY complaints.created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load all complaints", error: error.message });
  }
}

async function getDepartmentComplaints(req, res) {
  try {
    const rows = await all(
      `SELECT complaints.*, users.name AS student_name, users.roll, users.department_id,
       departments.short_name AS department
       FROM complaints
       JOIN users ON users.id = complaints.student_id
       LEFT JOIN departments ON departments.id = users.department_id
       WHERE users.department_id = ?
       ORDER BY complaints.created_at DESC`,
      [req.user.department_id]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to load department complaints", error: error.message });
  }
}

async function updateComplaintStatus(req, res) {
  try {
    const { status, admin_note } = req.body;

    const complaint = await get("SELECT id FROM complaints WHERE id = ?", [req.params.id]);

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    await run(
      `UPDATE complaints 
       SET status = ?, admin_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, admin_note || "", req.params.id]
    );

    res.json({ message: "Complaint status updated" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update complaint", error: error.message });
  }
}

module.exports = {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getDepartmentComplaints,
  updateComplaintStatus,
};