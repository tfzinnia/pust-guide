const { run, get, all } = require("../config/db");

async function getCampusLocations(req, res) {
  try {
    const { category } = req.query;

    let sql = "SELECT * FROM campus_locations WHERE 1 = 1";
    const params = [];

    if (category) {
      sql += " AND category = ?";
      params.push(category);
    }

    sql += " ORDER BY name ASC";

    const rows = await all(sql, params);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load campus locations",
      error: error.message,
    });
  }
}

async function createCampusLocation(req, res) {
  try {
    const { name, category, description, latitude, longitude } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        message: "Name and category are required",
      });
    }

    const result = await run(
      `INSERT INTO campus_locations
       (name, category, description, latitude, longitude)
       VALUES (?, ?, ?, ?, ?)`,
      [
        name,
        category,
        description || "",
        latitude || null,
        longitude || null,
      ]
    );

    res.status(201).json({
      message: "Campus location created",
      id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create campus location",
      error: error.message,
    });
  }
}

async function updateCampusLocation(req, res) {
  try {
    const location = await get("SELECT * FROM campus_locations WHERE id = ?", [
      req.params.id,
    ]);

    if (!location) {
      return res.status(404).json({
        message: "Campus location not found",
      });
    }

    const { name, category, description, latitude, longitude } = req.body;

    await run(
      `UPDATE campus_locations
       SET name = ?, category = ?, description = ?, latitude = ?, longitude = ?
       WHERE id = ?`,
      [
        name || location.name,
        category || location.category,
        description === undefined ? location.description : description,
        latitude === undefined ? location.latitude : latitude,
        longitude === undefined ? location.longitude : longitude,
        req.params.id,
      ]
    );

    res.json({
      message: "Campus location updated",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update campus location",
      error: error.message,
    });
  }
}

async function deleteCampusLocation(req, res) {
  try {
    const location = await get("SELECT * FROM campus_locations WHERE id = ?", [
      req.params.id,
    ]);

    if (!location) {
      return res.status(404).json({
        message: "Campus location not found",
      });
    }

    await run("DELETE FROM campus_locations WHERE id = ?", [req.params.id]);

    res.json({
      message: "Campus location deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete campus location",
      error: error.message,
    });
  }
}

module.exports = {
  getCampusLocations,
  createCampusLocation,
  updateCampusLocation,
  deleteCampusLocation,
};