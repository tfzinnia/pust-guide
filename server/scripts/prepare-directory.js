// Compile reviewed, sanitized official-source research into the runtime snapshot.
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../data");
const read = (name) =>
  JSON.parse(
    fs.readFileSync(path.join(root, "research", `${name}.json`), "utf8"),
  );
const academic = read("departments"),
  administration = read("administration"),
  governance = read("governance");
if (
  new Set([
    academic.checked_at,
    administration.checked_at,
    governance.checked_at,
  ]).size !== 1
)
  throw new Error(
    "Research check dates differ; review the source bundles before compiling",
  );
const strings = (value) =>
  (Array.isArray(value) ? value : [])
    .filter(Boolean)
    .map((item) =>
      typeof item === "string" ? item : item.note || JSON.stringify(item),
    );
const unique = (value) => [...new Set(value.filter(Boolean))];
function person(row) {
  return {
    source_key: row.id || "",
    name: row.name,
    designation: row.designation,
    emails: unique([
      ...(row.official_emails || []),
      row.email,
      ...(row.additional_emails || []),
    ]),
    phones: unique([
      ...(row.office_phones || []),
      row.office_phone,
      ...(row.additional_office_phones || []),
    ]),
    is_head: row.is_head === true,
    profile_url: row.profile_url || "",
    source_url: row.source_url,
    checked_at: row.checked_at,
    notes: strings(row.notes),
  };
}
function category(unit) {
  if (unit.faculty || unit.id.startsWith("dean-")) return "deans";
  if (
    /^(vice-chancellor|pro-vice-chancellor|treasurer|registrar)-office$/.test(
      unit.id,
    )
  )
    return "leadership";
  if (/hall|dormitory/.test(unit.id)) return "residences";
  if (/medical|security|proctor|student-advisor/.test(unit.id))
    return "student-support";
  return "administration";
}
const offices = administration.offices.map((unit) => ({
  source_key: `office:${unit.id}`,
  name: unit.name,
  category: category(unit),
  email: unit.office_email || "",
  phone: unit.office_phone || "",
  location: unit.location || "",
  description: unit.description || "",
  source_url: unit.source_url,
  contact_source_url: unit.contact_source_url || unit.source_url,
  checked_at: unit.checked_at,
  people: unit.people.map(person),
  unfilled_roles: (unit.unfilled_roles || []).map(person),
  notes: strings(unit.notes),
}));
for (const body of governance.bodies)
  offices.push({
    source_key: `governance:${body.id}`,
    name: body.name,
    category: "governance",
    email: "",
    phone: "",
    location: "",
    description: "Published membership of the university governance body.",
    source_url: body.source_url,
    contact_source_url: body.source_url,
    checked_at: body.checked_at,
    people: body.people.map(person),
    unfilled_roles: (body.unfilled_roles || body.unnamed_roles || []).map(
      person,
    ),
    notes: strings(body.notes),
  });
const sourceURLs = new Set(
  (academic.sources || []).map((source) => source.url),
);
for (const url of administration.source_urls || []) sourceURLs.add(url);
for (const unit of offices) {
  sourceURLs.add(unit.source_url);
  sourceURLs.add(unit.contact_source_url);
  for (const row of unit.people) sourceURLs.add(row.source_url);
}
for (const resource of governance.resources)
  sourceURLs.add(resource.source_url);
sourceURLs.add(governance.university.source_url);
sourceURLs.add(governance.university.history_source_url);
const snapshot = {
  schema_version: 1,
  checked_at: academic.checked_at,
  university: governance.university,
  departments: academic.departments.map((department) => ({
    source_key: `department:${department.official_code}`,
    name: department.name,
    official_code: department.official_code,
    official_short_name: department.official_short_name,
    aliases: unique([
      ...(department.aliases || []),
      ...(department.official_short_name === "BA" ? ["BBA"] : []),
    ]),
    faculty_name: department.faculty_name,
    source_url: department.url,
    checked_at: department.checked_at,
    emails: department.contact.official_emails,
    phones: department.contact.office_phones,
    programs: department.programs,
    resources: department.resource_links,
    notes: strings(department.notes),
    chair: department.chair ? person(department.chair) : null,
    faculty_members: department.faculty_members.map(person),
  })),
  offices,
  resources: governance.resources,
  sources: [...sourceURLs].filter(Boolean).sort(),
  notes: [
    "Official website listings checked on the stated date; appointments and contact details can change.",
    "Missing contact fields remain unpublished; no personal contact details or login accounts were imported.",
    "The same person can have multiple published roles in different departments, offices or governance bodies.",
    "Live official pages were used where cached search extracts showed older officeholder names.",
    ...strings(academic.coverage_notes),
    ...strings(governance.university.notes),
  ],
  coverage: {
    academic: academic.summary,
    administration: administration.coverage,
    governance: governance.coverage,
  },
};
const { validateSnapshot } = require("../src/services/directory-import");
validateSnapshot(snapshot);
const destination = path.join(root, "pust-directory.json");
fs.writeFileSync(destination, JSON.stringify(snapshot, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      file: destination,
      departments: snapshot.departments.length,
      faculty: snapshot.departments.reduce(
        (n, d) => n + d.faculty_members.length,
        0,
      ),
      chairs: snapshot.departments.filter((d) => d.chair).length,
      units: offices.length,
      office_roles: offices
        .filter((o) => o.category !== "governance")
        .reduce((n, o) => n + o.people.length, 0),
      governance_roles: offices
        .filter((o) => o.category === "governance")
        .reduce((n, o) => n + o.people.length, 0),
      sources: snapshot.sources.length,
    },
    null,
    2,
  ),
);
// The validator shares the database module; close the unused connection opened by that import.
require("../src/config/db").db.close();
