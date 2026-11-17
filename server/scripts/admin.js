require("dotenv").config({ quiet: true });
const bcrypt = require("bcryptjs");
const { db, get, run } = require("../src/config/db");
const init = require("../src/database/initDb");
const { email, password } = require("../src/utils/http");
(async () => {
  const address = email(process.env.ADMIN_EMAIL),
    secret = password(process.env.ADMIN_PASSWORD);
  await init();
  const existing = await get("SELECT id,role FROM users WHERE email=?", [
    address,
  ]);
  if (existing && existing.role !== "super_admin")
    throw new Error("This email belongs to another account");
  if (existing)
    await run(
      "UPDATE users SET password=?,token_version=token_version+1 WHERE id=?",
      [await bcrypt.hash(secret, 12), existing.id],
    );
  else
    await run(
      "INSERT INTO users (name,email,password,role) VALUES (?,?,?,'super_admin')",
      ["Super Admin", address, await bcrypt.hash(secret, 12)],
    );
  console.log("Administrator credentials configured");
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => db.close());
