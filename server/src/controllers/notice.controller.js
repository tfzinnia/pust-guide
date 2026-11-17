const c = require("../services/content").controller("notices");
module.exports = {
  getNotices: c.list,
  getMyNotices: c.list,
  createNotice: c.save,
  updateNotice: c.save,
  deleteNotice: c.remove,
};
