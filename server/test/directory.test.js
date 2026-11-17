const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
process.env.DB_PATH = ":memory:";
process.env.SKIP_DIRECTORY_IMPORT = "1";
process.env.ADMIN_EMAIL = "";
process.env.ADMIN_PASSWORD = "";
process.env.OPENAI_API_KEY = "";
const initDb = require("../src/database/initDb");
const { db, get, all, run } = require("../src/config/db");
const {
  importDirectory,
  validateSnapshot,
} = require("../src/services/directory-import");
const directory = require("../src/services/directory");
const { answerChat } = require("../src/services/student-assistant");
const snapshot = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/pust-directory.json"), "utf8"),
);
let businessId, accountsBefore;
before(async () => {
  await initDb();
  businessId = (await get("SELECT id FROM departments WHERE short_name='BBA'"))
    .id;
  await run(
    "UPDATE departments SET name='Local business name',description='Locally edited description' WHERE id=?",
    [businessId],
  );
  const student = (
    await run(
      "INSERT INTO users (name,email,password,role,roll,department_id) VALUES ('Private local student','private@example.test','preserved-password-hash','student','LOCAL-1',?)",
      [businessId],
    )
  ).id;
  await run(
    "INSERT INTO complaints (student_id,category,description) VALUES (?,'academic','Existing private complaint')",
    [student],
  );
  await run(
    "INSERT INTO notices (title,description,department_id) VALUES ('Existing notice','Preserve local content',?)",
    [businessId],
  );
  accountsBefore = await all("SELECT * FROM users ORDER BY id");
});
after(async () => new Promise((resolve) => db.close(resolve)));
test("official snapshot contains all researched departments, faculty and office/governance roles", () => {
  validateSnapshot(snapshot);
  assert.equal(snapshot.departments.length, 21);
  assert.equal(
    new Set(snapshot.departments.map((d) => d.faculty_name)).size,
    5,
  );
  assert.equal(
    snapshot.departments.reduce((sum, d) => sum + d.faculty_members.length, 0),
    212,
  );
  assert.equal(
    snapshot.offices.filter((o) => o.category !== "governance").length,
    38,
  );
  assert.equal(
    snapshot.offices.filter((o) => o.category === "governance").length,
    3,
  );
  for (const unit of [...snapshot.departments, ...snapshot.offices])
    assert.ok(unit.source_url.startsWith("https://pust.ac.bd/"));
});
test("import fills the catalog while retaining existing IDs, edits, users and private reports", async () => {
  const result = await importDirectory(snapshot);
  assert.equal(result.departments, 21);
  assert.equal(result.faculty, 212);
  assert.equal(result.chairs, 21);
  assert.equal(result.administrative_roles, 178);
  assert.equal(result.governance_roles, 53);
  assert.equal(
    (await get("SELECT count(*) AS count FROM departments")).count,
    21,
  );
  const business = await get("SELECT * FROM departments WHERE id=?", [
    businessId,
  ]);
  assert.equal(business.short_name, "BBA");
  assert.equal(business.official_short_name, "BA");
  assert.equal(business.name, "Local business name");
  assert.equal(business.description, "Locally edited description");
  assert.deepEqual(
    await all("SELECT * FROM users ORDER BY id"),
    accountsBefore,
  );
  assert.equal(
    (await get("SELECT description FROM complaints")).description,
    "Existing private complaint",
  );
  assert.equal(
    (await get("SELECT department_id FROM notices")).department_id,
    businessId,
  );
  const meta = await directory.metadata();
  assert.equal(meta.counts.faculties, 5);
  assert.equal(meta.counts.roles, 464);
  assert.equal(meta.checked_at, "2026-11-17");
});
test("reimporting is idempotent and public search finds the registrar with official provenance", async () => {
  const before = await all(
    "SELECT id,source_key FROM directory_people ORDER BY id",
  );
  assert.equal((await importDirectory(snapshot)).skipped, true);
  assert.deepEqual(
    await all("SELECT id,source_key FROM directory_people ORDER BY id"),
    before,
  );
  const result = await directory.searchDirectory("registrar");
  assert.ok(result.offices.some((o) => o.name === "Registrar Office"));
  assert.ok(result.people.some((person) => person.is_head));
  const registrar = result.offices.find((o) => o.name === "Registrar Office");
  const details = await directory.officeDetails(registrar.id);
  assert.ok(
    details.people.every(
      (person) =>
        person.source_url && person.checked_at && Array.isArray(person.emails),
    ),
  );
  assert.ok(
    details.people
      .flatMap((person) => person.emails)
      .every((email) => email.endsWith("@pust.ac.bd")),
  );
});
test("department chair roles remain independent of regular faculty membership", async () => {
  const pharmacy = snapshot.departments.find(
    (d) => d.official_short_name === "PHARM" || /Pharmacy/.test(d.name),
  );
  const department = await get(
    "SELECT id FROM departments WHERE source_key=?",
    [pharmacy.source_key],
  );
  const chair = await get(
    "SELECT * FROM directory_people WHERE department_id=? AND kind='chair' AND is_active=1",
    [department.id],
  );
  assert.equal(chair.name, pharmacy.chair.name);
  const faculty = await directory.people({
    department_id: department.id,
    kind: "faculty",
    limit: 100,
  });
  assert.equal(faculty.total, pharmacy.faculty_members.length);
});
test("new snapshots retire removed role listings and a previously seen snapshot can be restored", async () => {
  const updated = structuredClone(snapshot),
    removed = updated.departments[0].faculty_members.pop();
  await importDirectory(updated);
  assert.equal((await directory.metadata()).counts.faculty_members, 211);
  const restored = await importDirectory(snapshot);
  assert.equal(restored.skipped, undefined);
  assert.equal((await directory.metadata()).counts.faculty_members, 212);
  assert.ok(
    (
      await directory.people({ q: removed.name, kind: "faculty", limit: 100 })
    ).items.some((person) => person.name === removed.name),
  );
});
test("assistant can answer directory questions from the imported public sources", async () => {
  const reply = await answerChat(
    { message: "Who is the registrar?" },
    undefined,
  );
  const registrar = snapshot.offices.find(
    (o) => o.source_key === "office:registrar-office",
  );
  const head = registrar.people.find((person) => person.is_head);
  assert.ok(reply.answer.includes(head.name));
  assert.ok(reply.actions.some((action) => action.path === "/administration"));
  assert.ok(reply.sources.length > 0);
  assert.ok(!JSON.stringify(reply).includes("Existing private complaint"));
});
test("untrusted sources fail validation before changing imported data", async () => {
  const bad = structuredClone(snapshot);
  bad.offices[0].source_url = "https://untrusted.example/directory";
  const before = (await directory.metadata()).counts.roles;
  await assert.rejects(importDirectory(bad));
  assert.equal((await directory.metadata()).counts.roles, before);
});

test("support contacts use published institutional office lines without modifying local contact rows", async () => {
  const before = await all("SELECT * FROM emergency_contacts");
  const contacts = await directory.supportContacts();
  assert.equal(contacts.length, 4);
  assert.ok(
    contacts.some(
      (row) =>
        row.title === "Proctor Office" &&
        row.source_url === "https://pust.ac.bd/administration/Proctor-Office",
    ),
  );
  assert.ok(
    contacts.every(
      (row) =>
        row.is_verified && !row.is_urgent && row.checked_at === "2026-11-17",
    ),
  );
  assert.deepEqual(await all("SELECT * FROM emergency_contacts"), before);
});
