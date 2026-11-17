// Run as a separate maintenance process so the snapshot import is atomic.
process.env.SKIP_DIRECTORY_IMPORT = "1";
require("dotenv").config({ quiet: true });
const initDb = require("../src/database/initDb");
const { db } = require("../src/config/db");
const { importBundledDirectory } = require("../src/services/directory-import");
(async () => {
  await initDb();
  console.log(
    JSON.stringify(
      await importBundledDirectory({ force: process.argv.includes("--force") }),
      null,
      2,
    ),
  );
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
