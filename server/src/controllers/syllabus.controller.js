const c = require("../services/content").controller("syllabus");
module.exports = {
  getSyllabus: c.list,
  getMySyllabus: c.list,
  createSyllabus: c.save,
  updateSyllabus: c.save,
  deleteSyllabus: c.remove,
};
