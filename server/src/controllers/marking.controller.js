const c = require("../services/content").controller("marking_criteria");
module.exports = {
  getMarkingCriteria: c.list,
  getMyMarkingCriteria: c.list,
  createMarkingCriteria: c.save,
  updateMarkingCriteria: c.save,
  deleteMarkingCriteria: c.remove,
};
