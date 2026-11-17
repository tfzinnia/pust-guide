const c = require("../services/content").controller("guidelines");
module.exports = {
  getGuidelines: c.list,
  createGuideline: c.save,
  updateGuideline: c.save,
  deleteGuideline: c.remove,
};
