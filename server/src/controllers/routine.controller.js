const c = require("../services/content").controller("routines");
module.exports = {
  getRoutines: c.list,
  getMyRoutines: c.list,
  createRoutine: c.save,
  updateRoutine: c.save,
  deleteRoutine: c.remove,
};
