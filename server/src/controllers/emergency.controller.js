const c = require("../services/content").controller("emergency_contacts");
const { supportContacts } = require("../services/directory");
module.exports = {
  getEmergencyContacts: async (req, res) =>
    req.user?.role === "super_admin" && req.query.page !== undefined
      ? c.list(req, res)
      : res.json(await supportContacts()),
  createEmergencyContact: c.save,
  updateEmergencyContact: c.save,
  deleteEmergencyContact: c.remove,
};
