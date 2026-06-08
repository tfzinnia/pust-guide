const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

const dbPath = process.env.DB_PATH || "./src/database/pust_guide.db";
const fullPath = path.resolve(dbPath);

const db = new sqlite3.Database(fullPath, (err) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("SQLite database connected");
  }
});

db.run("PRAGMA foreign_keys = ON");

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function (err, row) {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function (err, rows) {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all,
};