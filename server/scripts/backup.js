require("dotenv").config({ quiet: true });
const path = require("node:path");
const fs = require("node:fs");
const { db } = require("../src/config/db");
const directory = path.resolve(process.env.BACKUP_DIR || "backups");
fs.mkdirSync(directory, { recursive: true });
const destination = path.join(
  directory,
  `pust-guide-${new Date().toISOString().replace(/[:.]/g, "-")}.db`,
);
db.run("VACUUM INTO ?", [destination], (error) => {
  if (error) {
    console.error(error.message);
    process.exitCode = 1;
  } else console.log(`Backup created: ${destination}`);
  db.close();
});
