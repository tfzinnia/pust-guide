const c = require("../services/content").controller("campus_locations");
module.exports = {
  getCampusLocations: c.list,
  createCampusLocation: c.save,
  updateCampusLocation: c.save,
  deleteCampusLocation: c.remove,
};
