const { get, all } = require("../config/db");
const { assert, id } = require("../utils/http");
const c = require("../services/content").controller("departments");
const { departmentRecord, personRecord } = require("../services/directory");
async function getDepartmentById(req, res) {
  const department = await get("SELECT * FROM departments WHERE id = ?", [
    id(req.params.id),
  ]);
  assert(department, "Department not found", 404);
  const teachers = await all(
    "SELECT id,name,email,designation FROM users WHERE role = 'teacher' AND department_id = ?",
    [department.id],
  );
  const faculty = await all(
    "SELECT * FROM directory_people WHERE department_id=? AND kind='faculty' AND is_active=1 ORDER BY is_head DESC,display_order,name",
    [department.id],
  );
  const chair = await get(
    "SELECT * FROM directory_people WHERE department_id=? AND kind='chair' AND is_active=1 LIMIT 1",
    [department.id],
  );
  res.json({
    ...departmentRecord(department),
    teachers,
    faculty_members: faculty.map(personRecord),
    chair: chair ? personRecord(chair) : null,
  });
}
module.exports = {
  getDepartments: c.list,
  getDepartmentById,
  createDepartment: c.save,
  updateDepartment: c.save,
  deleteDepartment: c.remove,
};
