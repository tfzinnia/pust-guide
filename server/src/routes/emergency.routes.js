const express = require("express");
const {
  getEmergencyContacts,
  createEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
} = require("../controllers/emergency.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getEmergencyContacts);

router.post("/", protect, allowRoles("super_admin"), createEmergencyContact);

router.patch(
  "/:id",
  protect,
  allowRoles("super_admin"),
  updateEmergencyContact,
);

router.delete(
  "/:id",
  protect,
  allowRoles("super_admin"),
  deleteEmergencyContact,
);

module.exports = router;
