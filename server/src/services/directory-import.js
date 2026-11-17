const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { run, get, exec } = require("../config/db");
const { assert } = require("../utils/http");
const bundledPath = path.join(__dirname, "../../data/pust-directory.json");
function officialURL(value, required = true) {
  if (!value && !required) return "";
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Directory source must be an official PUST URL");
  }
  assert(
    url.protocol === "https:" &&
      (url.hostname === "pust.ac.bd" || url.hostname.endsWith(".pust.ac.bd")),
    "Directory source must be an official PUST HTTPS URL",
  );
  return url.href;
}
function list(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}
function emails(value) {
  return [
    ...new Set(list(value).map((item) => String(item).trim().toLowerCase())),
  ].filter((item) => /^[^\s@]+@(?:[a-z0-9-]+\.)*pust\.ac\.bd$/.test(item));
}
function cleanText(value, max = 1000) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function validateSnapshot(snapshot) {
  assert(
    snapshot?.schema_version === 1 &&
      /^\d{4}-\d{2}-\d{2}$/.test(snapshot.checked_at),
    "Invalid university directory snapshot",
  );
  assert(
    Array.isArray(snapshot.departments) &&
      snapshot.departments.length > 0 &&
      Array.isArray(snapshot.offices),
    "Directory snapshot is incomplete",
  );
  for (const department of snapshot.departments) {
    assert(
      department.source_key &&
        department.name &&
        department.official_short_name,
      "Department identifiers are required",
    );
    officialURL(department.source_url);
    for (const person of [
      ...list(department.faculty_members),
      ...(department.chair ? [department.chair] : []),
    ])
      officialURL(person.source_url);
  }
  for (const office of snapshot.offices) {
    assert(office.source_key && office.name, "Office identifiers are required");
    officialURL(office.source_url);
    for (const person of list(office.people)) officialURL(person.source_url);
  }
  return snapshot;
}
async function upsert(table, sourceKey, data) {
  const keys = Object.keys(data);
  await run(
    `INSERT INTO ${table} (source_key,${keys.join(",")}) VALUES (?,${keys.map(() => "?").join(",")}) ON CONFLICT(source_key) DO UPDATE SET ${keys.map((key) => `${key}=excluded.${key}`).join(",")}`,
    [sourceKey, ...Object.values(data)],
  );
  return (await get(`SELECT id FROM ${table} WHERE source_key=?`, [sourceKey]))
    .id;
}
async function addPerson(
  person,
  {
    sourceKey,
    kind,
    departmentId = null,
    officeId = null,
    order = 0,
    date,
    notes = [],
  },
) {
  if (!cleanText(person.name)) return false;
  await upsert("directory_people", sourceKey, {
    name: cleanText(person.name, 200),
    designation: cleanText(person.designation || person.title, 300),
    kind,
    department_id: departmentId,
    office_id: officeId,
    emails_json: JSON.stringify(emails(person.emails)),
    phones_json: JSON.stringify(
      list(person.phones).map((phone) => cleanText(phone, 80)),
    ),
    is_head: person.is_head ? 1 : 0,
    is_active: 1,
    profile_url: officialURL(person.profile_url, false),
    source_url: officialURL(person.source_url),
    checked_at: person.checked_at || date,
    notes_json: JSON.stringify([...notes, ...list(person.notes)]),
    display_order: order,
  });
  return true;
}
async function importDirectory(input, { force = false } = {}) {
  const snapshot = validateSnapshot(input),
    hash = crypto
      .createHash("sha256")
      .update(JSON.stringify(snapshot))
      .digest("hex");
  await exec("BEGIN IMMEDIATE");
  try {
    const previous = await get(
      "SELECT summary_json FROM directory_imports WHERE snapshot_hash=? AND is_current=1",
      [hash],
    );
    if (previous && !force) {
      await exec("COMMIT");
      return { ...JSON.parse(previous.summary_json), skipped: true };
    }
    const result = {
      departments: 0,
      offices: 0,
      faculty: 0,
      chairs: 0,
      administrative_roles: 0,
      governance_roles: 0,
      checked_at: snapshot.checked_at,
    };
    await run("UPDATE directory_offices SET is_active=0");
    for (const department of snapshot.departments) {
      const aliases = [
        ...new Set(
          [department.official_short_name, ...list(department.aliases)].map(
            (value) => String(value).toUpperCase(),
          ),
        ),
      ];
      let existing = await get(
        `SELECT * FROM departments WHERE source_key=? OR UPPER(short_name) IN (${aliases.map(() => "?").join(",")}) OR LOWER(name)=LOWER(?) ORDER BY source_key IS NOT NULL DESC LIMIT 1`,
        [department.source_key, ...aliases, department.name],
      );
      if (!existing) {
        const inserted = await run(
          "INSERT INTO departments (name,short_name,description) VALUES (?,?,?)",
          [
            department.name,
            department.official_short_name,
            department.description ||
              `Department listed under ${department.faculty_name} at PUST.`,
          ],
        );
        existing = { id: inserted.id };
      }
      // Existing department IDs, local names/abbreviations and edited descriptions stay intact.
      const metadata = {
        source_key: department.source_key,
        official_name: department.name,
        official_code: department.official_code || "",
        official_short_name: department.official_short_name,
        faculty_name: department.faculty_name || "",
        source_url: officialURL(department.source_url),
        checked_at: department.checked_at || snapshot.checked_at,
        contact_emails_json: JSON.stringify(emails(department.emails)),
        contact_phones_json: JSON.stringify(list(department.phones)),
        programs_json: JSON.stringify(list(department.programs)),
        resources_json: JSON.stringify(list(department.resources)),
        source_notes_json: JSON.stringify(list(department.notes)),
      };
      await run(
        `UPDATE departments SET ${Object.keys(metadata)
          .map((key) => `${key}=?`)
          .join(",")} WHERE id=?`,
        [...Object.values(metadata), existing.id],
      );
      result.departments++;
      await run(
        "UPDATE directory_people SET is_active=0 WHERE department_id=?",
        [existing.id],
      );
      for (const [index, person] of list(department.faculty_members).entries())
        if (
          await addPerson(person, {
            sourceKey: `${department.source_key}:faculty:${person.profile_url || person.name}`,
            kind: "faculty",
            departmentId: existing.id,
            order: index,
            date: snapshot.checked_at,
          })
        )
          result.faculty++;
      if (
        department.chair &&
        (await addPerson(
          { ...department.chair, is_head: true },
          {
            sourceKey: `${department.source_key}:chair`,
            kind: "chair",
            departmentId: existing.id,
            date: snapshot.checked_at,
            notes: department.notes,
          },
        ))
      )
        result.chairs++;
    }
    for (const [index, office] of snapshot.offices.entries()) {
      const officeId = await upsert("directory_offices", office.source_key, {
        name: cleanText(office.name, 200),
        category: office.category || "administration",
        email: emails([office.email])[0] || "",
        phone: cleanText(office.phone, 80),
        location: cleanText(office.location, 200),
        description: cleanText(office.description),
        source_url: officialURL(office.source_url),
        contact_source_url: officialURL(
          office.contact_source_url || office.source_url,
        ),
        checked_at: office.checked_at || snapshot.checked_at,
        notes_json: JSON.stringify(list(office.notes)),
        unfilled_roles_json: JSON.stringify(list(office.unfilled_roles)),
        is_active: 1,
        display_order: index,
      });
      result.offices++;
      await run("UPDATE directory_people SET is_active=0 WHERE office_id=?", [
        officeId,
      ]);
      for (const [order, person] of list(office.people).entries()) {
        const kind =
          office.category === "governance" ? "governance" : "officer";
        const identity = `${office.source_key}:${person.source_key || `${person.name}:${person.designation || person.title}`}`;
        if (
          await addPerson(person, {
            sourceKey: identity,
            kind,
            officeId,
            order,
            date: snapshot.checked_at,
          })
        )
          result[
            kind === "governance" ? "governance_roles" : "administrative_roles"
          ]++;
      }
    }
    await run(
      "UPDATE directory_people SET is_active=0 WHERE office_id IN (SELECT id FROM directory_offices WHERE is_active=0)",
    );
    const info = {
      ...snapshot.university,
      checked_at: snapshot.checked_at,
      sources: snapshot.sources,
      resources: snapshot.resources,
      notes: snapshot.notes,
      coverage: snapshot.coverage,
    };
    await run(
      "INSERT INTO university_directory_info (id,data_json) VALUES (1,?) ON CONFLICT(id) DO UPDATE SET data_json=excluded.data_json",
      [JSON.stringify(info)],
    );
    await run("UPDATE directory_imports SET is_current=0");
    await run(
      "INSERT INTO directory_imports (snapshot_hash,checked_at,summary_json,is_current) VALUES (?,?,?,1) ON CONFLICT(snapshot_hash) DO UPDATE SET summary_json=excluded.summary_json,is_current=1,imported_at=CURRENT_TIMESTAMP",
      [hash, snapshot.checked_at, JSON.stringify(result)],
    );
    await exec("COMMIT");
    return result;
  } catch (error) {
    await exec("ROLLBACK");
    throw error;
  }
}
async function importBundledDirectory(options) {
  if (!fs.existsSync(bundledPath))
    return { skipped: true, reason: "No bundled directory snapshot" };
  return importDirectory(
    JSON.parse(fs.readFileSync(bundledPath, "utf8")),
    options,
  );
}
module.exports = {
  importDirectory,
  importBundledDirectory,
  validateSnapshot,
  officialURL,
  bundledPath,
};
