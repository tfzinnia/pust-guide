const { all, get } = require("../config/db");
const { text, id, assert } = require("../utils/http");
function parseJSON(value, fallback = []) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}
function departmentRecord(row) {
  return {
    ...row,
    name: row.official_name || row.name,
    display_short_name: row.official_short_name || row.short_name,
    contacts: {
      emails: parseJSON(row.contact_emails_json),
      phones: parseJSON(row.contact_phones_json),
    },
    programs: parseJSON(row.programs_json),
    resources: parseJSON(row.resources_json),
    source_notes: parseJSON(row.source_notes_json),
  };
}
function personRecord(row) {
  return {
    ...row,
    emails: parseJSON(row.emails_json),
    phones: parseJSON(row.phones_json),
    notes: parseJSON(row.notes_json),
  };
}
function officeRecord(row) {
  return {
    ...row,
    notes: parseJSON(row.notes_json),
    unfilled_roles: parseJSON(row.unfilled_roles_json),
  };
}
function searchWhere(query, fields) {
  const q = text(query, "Directory search", { max: 100 });
  const terms = [
    ...new Set(q.toLowerCase().match(/[\p{L}\p{N}@.-]+/gu) || []),
  ].slice(0, 8);
  return {
    sql: terms.length
      ? ` AND ${terms.map(() => `(${fields.map((field) => `LOWER(COALESCE(${field},'')) LIKE ?`).join(" OR ")})`).join(" AND ")}`
      : "",
    params: terms.flatMap((term) => fields.map(() => `%${term}%`)),
  };
}
const peopleSelect = `SELECT p.*,COALESCE(d.official_name,d.name) AS department_name,COALESCE(d.official_short_name,d.short_name) AS department,d.faculty_name,o.name AS office_name,o.category AS office_category FROM directory_people p LEFT JOIN departments d ON d.id=p.department_id LEFT JOIN directory_offices o ON o.id=p.office_id`;
async function people(query = {}) {
  const search = searchWhere(query.q, [
    "p.name",
    "p.designation",
    "p.emails_json",
    "d.name",
    "d.official_name",
    "d.short_name",
    "d.official_short_name",
    "o.name",
  ]);
  let where = " WHERE p.is_active=1" + search.sql;
  const params = [...search.params];
  if (query.department_id) {
    where += " AND p.department_id=?";
    params.push(id(query.department_id, "Department"));
  }
  if (query.office_id) {
    where += " AND p.office_id=?";
    params.push(id(query.office_id, "Office"));
  }
  if (query.kind) {
    assert(
      ["faculty", "chair", "officer", "governance"].includes(query.kind),
      "Invalid directory role type",
    );
    where += " AND p.kind=?";
    params.push(query.kind);
  }
  const page = Math.max(1, Math.floor(Number(query.page) || 1)),
    limit = Math.min(100, Math.max(1, Math.floor(Number(query.limit) || 24)));
  assert(Number.isFinite(page) && page <= 100000, "Invalid page");
  const items = await all(
    `${peopleSelect}${where} ORDER BY p.is_head DESC,p.display_order,p.name LIMIT ? OFFSET ?`,
    [...params, limit, (page - 1) * limit],
  );
  const total = (
    await get(
      `SELECT count(*) AS count FROM directory_people p LEFT JOIN departments d ON d.id=p.department_id LEFT JOIN directory_offices o ON o.id=p.office_id${where}`,
      params,
    )
  ).count;
  return { items: items.map(personRecord), page, limit, total };
}
async function offices(query = {}) {
  const search = searchWhere(query.q, ["o.name", "o.email", "o.description"]);
  const category = query.category
    ? text(query.category, "Office category", { max: 30 })
    : "";
  const rows = await all(
    `SELECT o.*,(SELECT count(*) FROM directory_people p WHERE p.office_id=o.id AND p.is_active=1) AS people_count,(SELECT GROUP_CONCAT(p.name,' · ') FROM directory_people p WHERE p.office_id=o.id AND p.is_head=1 AND p.is_active=1) AS head_names FROM directory_offices o WHERE o.is_active=1${search.sql}${category ? " AND o.category=?" : ""} ORDER BY o.display_order,o.name`,
    [...search.params, ...(category ? [category] : [])],
  );
  return rows.map(officeRecord);
}
async function officeDetails(officeId) {
  const office = await get(
    "SELECT * FROM directory_offices WHERE id=? AND is_active=1",
    [id(officeId)],
  );
  assert(office, "Office not found", 404);
  const staff = await all(
    `${peopleSelect} WHERE p.office_id=? AND p.is_active=1 ORDER BY p.is_head DESC,p.display_order,p.name`,
    [office.id],
  );
  return { ...officeRecord(office), people: staff.map(personRecord) };
}
async function metadata() {
  const stored = await get(
    "SELECT data_json FROM university_directory_info WHERE id=1",
  );
  const counts = await get(
    `SELECT (SELECT count(*) FROM departments WHERE source_key IS NOT NULL) AS departments,(SELECT count(DISTINCT faculty_name) FROM departments WHERE faculty_name IS NOT NULL AND faculty_name!='') AS faculties,(SELECT count(*) FROM directory_offices WHERE is_active=1) AS offices,(SELECT count(*) FROM directory_people WHERE is_active=1) AS roles,(SELECT count(*) FROM directory_people WHERE is_active=1 AND kind='faculty') AS faculty_members`,
  );
  return { ...parseJSON(stored?.data_json, {}), counts };
}
async function searchDirectory(q, limit = 15) {
  const officeRows = await offices({ q });
  const members = await people({ q, limit });
  return { offices: officeRows.slice(0, limit), people: members.items };
}
async function supportContacts(limit) {
  const local = await all(
    "SELECT * FROM emergency_contacts WHERE is_verified=1 ORDER BY is_urgent DESC,id DESC",
  );
  const published = await all(
    "SELECT id,name AS title,phone,contact_source_url AS source_url,checked_at FROM directory_offices WHERE is_active=1 AND phone!='' AND source_key IN ('office:medical-section','office:proctor-office','office:student-advisor-office','office:security-section') ORDER BY display_order",
  );
  const seen = new Set(local.map((row) => row.phone.replace(/[^\d]/g, "")));
  const contacts = [...local];
  for (const row of published)
    if (!seen.has(row.phone.replace(/[^\d]/g, ""))) {
      seen.add(row.phone.replace(/[^\d]/g, ""));
      contacts.push({
        ...row,
        id: `official-${row.id}`,
        description:
          "Office contact published by PUST. Confirm current availability using the source.",
        is_verified: 1,
        is_urgent: 0,
      });
    }
  return limit ? contacts.slice(0, limit) : contacts;
}
module.exports = {
  people,
  offices,
  officeDetails,
  metadata,
  searchDirectory,
  departmentRecord,
  personRecord,
  parseJSON,
  supportContacts,
};
