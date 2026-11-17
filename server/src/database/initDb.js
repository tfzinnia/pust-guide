const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { run, get, all, exec } = require("../config/db");

async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  // Existing databases may predate the audience columns used by indexes.
  await exec(
    schema.replace(
      /^CREATE INDEX IF NOT EXISTS idx_(?:notices|routines)_audience.*$/gm,
      "",
    ),
  );
  await runMigrations();
  await exec(
    "CREATE INDEX IF NOT EXISTS idx_notices_audience ON notices(department_id,session,year,semester); CREATE INDEX IF NOT EXISTS idx_routines_audience ON routines(department_id,session,year,semester);",
  );
  await seedDepartments();
  await seedSuperAdmin();
  if (process.env.SKIP_DIRECTORY_IMPORT !== "1") {
    const { importBundledDirectory } = require("../services/directory-import");
    await importBundledDirectory();
  }
}

async function addColumnIfMissing(table, column, definition) {
  const rows = await all(`PRAGMA table_info(${table})`);
  if (!rows.some((row) => row.name === column))
    await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

async function runMigrations() {
  await addColumnIfMissing(
    "directory_imports",
    "is_current",
    "INTEGER NOT NULL DEFAULT 0",
  );
  await addColumnIfMissing(
    "directory_offices",
    "is_active",
    "INTEGER NOT NULL DEFAULT 1",
  );
  await addColumnIfMissing(
    "directory_people",
    "is_active",
    "INTEGER NOT NULL DEFAULT 1",
  );
  const departmentColumns = {
    source_key: "TEXT",
    official_name: "TEXT",
    official_code: "TEXT",
    official_short_name: "TEXT",
    faculty_name: "TEXT",
    source_url: "TEXT",
    checked_at: "TEXT",
    contact_emails_json: "TEXT DEFAULT '[]'",
    contact_phones_json: "TEXT DEFAULT '[]'",
    programs_json: "TEXT DEFAULT '[]'",
    resources_json: "TEXT DEFAULT '[]'",
    source_notes_json: "TEXT DEFAULT '[]'",
  };
  for (const [column, definition] of Object.entries(departmentColumns))
    await addColumnIfMissing("departments", column, definition);
  await run(
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_source ON departments(source_key) WHERE source_key IS NOT NULL",
  );
  await addColumnIfMissing("notices", "session", "TEXT");
  await addColumnIfMissing("syllabus", "session", "TEXT");
  await addColumnIfMissing("routines", "session", "TEXT");
  await addColumnIfMissing("marking_criteria", "session", "TEXT");
  await addColumnIfMissing(
    "emergency_contacts",
    "is_urgent",
    "INTEGER DEFAULT 0",
  );
  await addColumnIfMissing(
    "emergency_contacts",
    "is_verified",
    "INTEGER DEFAULT 0",
  );
  await addColumnIfMissing(
    "complaints",
    "assigned_to",
    "INTEGER REFERENCES users(id)",
  );
  await addColumnIfMissing(
    "users",
    "token_version",
    "INTEGER NOT NULL DEFAULT 0",
  );

  console.log("Migrations checked");
}

async function seedDepartments() {
  const departments = [
    ["Computer Science and Engineering", "CSE"],
    ["Electrical and Electronic Engineering", "EEE"],
    ["Civil Engineering", "CE"],
    ["Business Administration", "BBA"],
    ["English", "ENG"],
    ["Mathematics", "MATH"],
    ["Physics", "PHY"],
    ["Chemistry", "CHEM"],
  ];

  for (const dept of departments) {
    const existing = await get(
      "SELECT id FROM departments WHERE short_name = ?",
      [dept[1]],
    );

    if (!existing) {
      await run(
        "INSERT INTO departments (name, short_name) VALUES (?, ?)",
        dept,
      );
    }
  }

  console.log("Departments seeded");
}

async function seedSuperAdmin() {
  const existingAdmin = await get(
    "SELECT id FROM users WHERE role = 'super_admin'",
  );
  if (!existingAdmin && process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    const { email, password } = require("../utils/http");
    await run("INSERT INTO users (name,email,password,role) VALUES (?,?,?,?)", [
      "Super Admin",
      email(process.env.ADMIN_EMAIL),
      await bcrypt.hash(password(process.env.ADMIN_PASSWORD), 12),
      "super_admin",
    ]);
    console.log("Configured administrator created");
  }
}

module.exports = initDb;
