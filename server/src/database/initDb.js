const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { db, run, get } = require("../config/db");

async function initDb() {
  try {
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    db.exec(schema, async (err) => {
      if (err) {
        console.error("Schema creation failed:", err.message);
        return;
      }

      console.log("Database tables ready");

      await runMigrations();
      await seedDepartments();
      await seedSuperAdmin();
      await seedPublicData();
    });
  } catch (error) {
    console.error("Database initialization error:", error.message);
  }
}

function addColumnIfMissing(table, column, definition) {
  return new Promise((resolve) => {
    db.all(`PRAGMA table_info(${table})`, [], async (err, rows) => {
      if (err) return resolve();

      const exists = rows.some((row) => row.name === column);

      if (!exists) {
        db.run(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, () => {
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

async function runMigrations() {
  await addColumnIfMissing("notices", "session", "TEXT");
  await addColumnIfMissing("syllabus", "session", "TEXT");
  await addColumnIfMissing("routines", "session", "TEXT");
  await addColumnIfMissing("marking_criteria", "session", "TEXT");
  await addColumnIfMissing("emergency_contacts", "is_urgent", "INTEGER DEFAULT 0");

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
      [dept[1]]
    );

    if (!existing) {
      await run(
        "INSERT INTO departments (name, short_name) VALUES (?, ?)",
        dept
      );
    }
  }

  console.log("Departments seeded");
}

async function seedSuperAdmin() {
  const existingAdmin = await get(
    "SELECT id FROM users WHERE role = 'super_admin'"
  );

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin123", 10);

    await run(
      `INSERT INTO users 
      (name, email, password, role)
      VALUES (?, ?, ?, ?)`,
      ["Super Admin", "admin@pustguide.com", hashedPassword, "super_admin"]
    );

    console.log("Default super admin created");
    console.log("Email: admin@pustguide.com");
    console.log("Password: admin123");
  }
}

async function seedPublicData() {
  const emergency = await get("SELECT id FROM emergency_contacts LIMIT 1");

  if (!emergency) {
    const contacts = [
      ["Anti-Ragging Cell", "+880-1234-567890", "Report ragging incidents", 1],
      ["Proctor Office", "+880-1234-567891", "Student discipline & welfare", 0],
      ["Campus Security", "+880-1234-567892", "Emergency security assistance", 1],
      ["Medical Center", "+880-1234-567893", "Medical emergencies", 1],
      ["Ambulance", "999", "Emergency ambulance service", 1],
      ["Police", "999", "Emergency police support", 1],
    ];

    for (const item of contacts) {
      await run(
        "INSERT INTO emergency_contacts (title, phone, description, is_urgent) VALUES (?, ?, ?, ?)",
        item
      );
    }
  }

  const locations = await get("SELECT id FROM campus_locations LIMIT 1");

  if (!locations) {
    const campus = [
      ["CSE Department", "Academic", "Engineering Building"],
      ["EEE Department", "Academic", "Engineering Building"],
      ["Central Library", "Facility", "Library Building"],
      ["Admin Building", "Office", "Administrative work"],
      ["Cafeteria", "Food", "Campus food area"],
      ["Medical Center", "Facility", "Medical support"],
      ["Mosque", "Facility", "Prayer area"],
      ["Boys Hall", "Hall", "Student hall"],
      ["Girls Hall", "Hall", "Student hall"],
    ];

    for (const item of campus) {
      await run(
        "INSERT INTO campus_locations (name, category, description) VALUES (?, ?, ?)",
        item
      );
    }
  }

  const guidelines = await get("SELECT id FROM guidelines LIMIT 1");

  if (!guidelines) {
    await run(
      "INSERT INTO guidelines (title, description, category) VALUES (?, ?, ?)",
      [
        "Academic Guidelines",
        "Attend all classes regularly. Submit assignments on time. Participate actively in class discussions. Maintain academic integrity. Consult teachers during office hours.",
        "Academic Guidelines",
      ]
    );

    await run(
      "INSERT INTO guidelines (title, description, category) VALUES (?, ?, ?)",
      [
        "Campus Conduct",
        "Wear student ID card at all times. Maintain discipline and respect university property. No smoking, alcohol, or drugs allowed on campus. Follow traffic rules inside campus. Keep the campus clean.",
        "Campus Conduct",
      ]
    );
  }
}

module.exports = initDb;