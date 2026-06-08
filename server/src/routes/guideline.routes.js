const express = require("express");
const {
  getGuidelines,
  createGuideline,
  updateGuideline,
  deleteGuideline,
} = require("../controllers/guideline.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getGuidelines);

router.post("/", protect, allowRoles("super_admin"), createGuideline);

router.patch("/:id", protect, allowRoles("super_admin"), updateGuideline);

router.delete("/:id", protect, allowRoles("super_admin"), deleteGuideline);

module.exports = router;