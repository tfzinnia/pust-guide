// Isolated browser fixture. This never opens the project's database.
process.env.DB_PATH = ":memory:";
process.env.JWT_SECRET = "browser-test-secret-at-least-thirty-two-characters";
process.env.ADMIN_EMAIL = "browser-admin@example.test";
process.env.ADMIN_PASSWORD = "BrowserAdminPassword123!";
process.env.MAIL_WEBHOOK_URL = "";
process.env.OPENAI_API_KEY = "";
process.env.APP_URL = "http://127.0.0.1:5011";
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const uploadDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "pust-browser-test-"),
);
process.env.UPLOAD_DIR = uploadDirectory;
const { app, ready } = require("../src/server");
const { run, get, db } = require("../src/config/db");
const bcrypt = require("bcryptjs");
(async () => {
  await ready;
  const dept = (await get("SELECT id FROM departments WHERE short_name='CSE'"))
    .id;
  const student = (
    await run(
      "INSERT INTO users (name,email,password,role,roll,department_id,session,year,semester) VALUES (?,?,?,'student','B101',?,'2026-2027','1st Year','1st Semester')",
      [
        "Browser Student",
        "browser-student@example.test",
        await bcrypt.hash("BrowserStudentPassword123!", 10),
        dept,
      ],
    )
  ).id;
  await run(
    "INSERT INTO notices (title,description,category,department_id,session,year,semester,is_urgent) VALUES ('Campus welcome','Your published campus notice.','Academic',?,'2026-2027','1st Year','1st Semester',1)",
    [dept],
  );
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    weekday: "long",
  }).format(new Date());
  await run(
    "INSERT INTO routines (type,department_id,session,year,semester,course_code,course_title,day,start_time,end_time,room) VALUES ('class',?,'2026-2027','1st Year','1st Semester','CSE101','Introduction to computing',?,'09:00','10:00','101')",
    [dept, day],
  );
  await run(
    "INSERT INTO notifications (user_id,title,body,url) VALUES (?,'New campus notice','Campus welcome','/notices?notice=1')",
    [student],
  );
  await run(
    "INSERT INTO campus_locations (name,category,description,latitude,longitude) VALUES ('Campus library','Facility','Library building',24.01343,89.2791)",
  );
  const server = app.listen(5011, "127.0.0.1", () =>
    console.log("Browser fixture ready at http://127.0.0.1:5011"),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(() =>
        db.close(() => {
          if (
            path.dirname(path.resolve(uploadDirectory)) ===
              path.resolve(os.tmpdir()) &&
            path.basename(uploadDirectory).startsWith("pust-browser-test-")
          )
            fs.rmSync(uploadDirectory, { recursive: true, force: true });
          process.exit();
        }),
      ),
    );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
