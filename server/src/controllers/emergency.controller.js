const { run, get, all } = require("../config/db");

async function getEmergencyContacts(req, res) {
  try {
    const rows = await all(
      "SELECT * FROM emergency_contacts ORDER BY title ASC"
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load emergency contacts",
      error: error.message,
    });
  }
}

async function createEmergencyContact(req, res) {
  try {
    const { title, phone, description } = req.body;

    if (!title || !phone) {
      return res.status(400).json({
        message: "Title and phone are required",
      });
    }

    const result = await run(
      "INSERT INTO emergency_contacts (title, phone, description) VALUES (?, ?, ?)",
      [title, phone, description || ""]
    );

    res.status(201).json({
      message: "Emergency contact created",
      id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create emergency contact",
      error: error.message,
    });
  }
}

async function updateEmergencyContact(req, res) {
  try {
    const contact = await get("SELECT * FROM emergency_contacts WHERE id = ?", [
      req.params.id,
    ]);

    if (!contact) {
      return res.status(404).json({
        message: "Emergency contact not found",
      });
    }

    const { title, phone, description } = req.body;

    await run(
      `UPDATE emergency_contacts
       SET title = ?, phone = ?, description = ?
       WHERE id = ?`,
      [
        title || contact.title,
        phone || contact.phone,
        description === undefined ? contact.description : description,
        req.params.id,
      ]
    );

    res.json({
      message: "Emergency contact updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update emergency contact",
      error: error.message,
    });
  }
}

async function deleteEmergencyContact(req, res) {
  try {
    const contact = await get("SELECT * FROM emergency_contacts WHERE id = ?", [
      req.params.id,
    ]);

    if (!contact) {
      return res.status(404).json({
        message: "Emergency contact not found",
      });
    }

    await run("DELETE FROM emergency_contacts WHERE id = ?", [req.params.id]);

    res.json({
      message: "Emergency contact deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete emergency contact",
      error: error.message,
    });
  }
}

module.exports = {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
};