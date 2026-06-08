const { run, get, all } = require("../config/db");

async function getGuidelines(req, res) {
  try {
    const { category } = req.query;

    let sql = "SELECT * FROM guidelines WHERE 1 = 1";
    const params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY created_at DESC";

    const rows = await all(sql, params);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load guidelines",
      error: error.message,
    });
  }
}

async function createGuideline(req, res) {
  try {
    const { title, description, category } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Title and description are required",
      });
    }

    const result = await run(
      "INSERT INTO guidelines (title, description, category) VALUES (?, ?, ?)",
      [title, description, category || "general"]
    );

    res.status(201).json({
      message: "Guideline created",
      id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create guideline",
      error: error.message,
    });
  }
}

async function updateGuideline(req, res) {
  try {
    const guideline = await get("SELECT * FROM guidelines WHERE id = ?", [
      req.params.id,
    ]);

    if (!guideline) {
      return res.status(404).json({
        message: "Guideline not found",
      });
    }

    const { title, description, category } = req.body;

    await run(
      `UPDATE guidelines
       SET title = ?, description = ?, category = ?
       WHERE id = ?`,
      [
        title || guideline.title,
        description || guideline.description,
        category || guideline.category,
        req.params.id,
      ]
    );

    res.json({
      message: "Guideline updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update guideline",
      error: error.message,
    });
  }
}

async function deleteGuideline(req, res) {
  try {
    const guideline = await get("SELECT * FROM guidelines WHERE id = ?", [
      req.params.id,
    ]);

    if (!guideline) {
      return res.status(404).json({
        message: "Guideline not found",
      });
    }

    await run("DELETE FROM guidelines WHERE id = ?", [req.params.id]);

    res.json({
      message: "Guideline deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete guideline",
      error: error.message,
    });
  }
}

module.exports = {
  getGuidelines,
  createGuideline,
  updateGuideline,
  deleteGuideline,
};