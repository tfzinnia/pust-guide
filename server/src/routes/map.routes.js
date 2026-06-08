const express = require("express");
const {
  getCampusLocations,
  createCampusLocation,
  updateCampusLocation,
  deleteCampusLocation,
} = require("../controllers/map.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getCampusLocations);

router.post("/", protect, allowRoles("super_admin"), createCampusLocation);

router.patch("/:id", protect, allowRoles("super_admin"), updateCampusLocation);

router.delete("/:id", protect, allowRoles("super_admin"), deleteCampusLocation);

module.exports = router;