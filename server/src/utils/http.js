class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
function assert(condition, message, status = 400) {
  if (!condition) throw new HttpError(status, message);
}
function text(value, label, { required = false, max = 5000 } = {}) {
  assert(value == null || typeof value === "string", `${label} must be text`);
  const result = (value || "").trim();
  assert(!required || result.length > 0, `${label} is required`);
  assert(result.length <= max, `${label} must be ${max} characters or fewer`);
  return result;
}
function id(value, label = "ID") {
  assert(
    Number.isSafeInteger(Number(value)) && Number(value) > 0,
    `${label} must be a positive integer`,
  );
  return Number(value);
}
function email(value) {
  const result = text(value, "Email", {
    required: true,
    max: 254,
  }).toLowerCase();
  assert(
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result),
    "Enter a valid email address",
  );
  return result;
}
function password(value) {
  assert(
    typeof value === "string" &&
      value.length >= 10 &&
      Buffer.byteLength(value) <= 72,
    "Password must contain at least 10 characters and at most 72 bytes",
  );
  return value;
}
function academic(data, required = false) {
  const result = {};
  for (const key of ["session", "year", "semester"])
    result[key] = text(data[key], key, { required, max: 30 });
  assert(
    !result.session ||
      (/^\d{4}-\d{4}$/.test(result.session) &&
        Number(result.session.slice(5)) ===
          Number(result.session.slice(0, 4)) + 1),
    "Session must be consecutive years, e.g. 2026-2027",
  );
  assert(
    !result.year ||
      ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"].includes(
        result.year,
      ),
    "Invalid academic year",
  );
  assert(
    !result.semester ||
      ["1st Semester", "2nd Semester"].includes(result.semester),
    "Invalid semester",
  );
  return result;
}
module.exports = { HttpError, assert, text, id, email, password, academic };
