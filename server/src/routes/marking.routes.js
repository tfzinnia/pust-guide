const express = require("express");
const {
  createMarkingCriteria,
  getMarkingCriteria,
  getMyMarkingCriteria,
  updateMarkingCriteria,
  deleteMarkingCriteria,
} = require("../controllers/marking.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getMarkingCriteria);

router.get("/my", protect, allowRoles("student"), getMyMarkingCriteria);

router.post(
  "/",
  protect,
  allowRoles("teacher", "super_admin"),
  createMarkingCriteria,
);

router.patch(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  updateMarkingCriteria,
);

router.delete(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  deleteMarkingCriteria,
);

module.exports = router;
