const express = require("express");
const {
  createSyllabus,
  getSyllabus,
  getMySyllabus,
  updateSyllabus,
  deleteSyllabus,
} = require("../controllers/syllabus.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getSyllabus);

router.get("/my", protect, allowRoles("student"), getMySyllabus);

router.post("/", protect, allowRoles("teacher", "super_admin"), createSyllabus);

router.patch(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  updateSyllabus,
);

router.delete(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  deleteSyllabus,
);

module.exports = router;
