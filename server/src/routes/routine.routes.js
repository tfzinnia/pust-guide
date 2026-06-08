const express = require("express");
const {
  createRoutine,
  getRoutines,
  getMyRoutines,
  updateRoutine,
  deleteRoutine,
} = require("../controllers/routine.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getRoutines);

router.get("/my", protect, allowRoles("student"), getMyRoutines);

router.post("/", protect, allowRoles("teacher", "super_admin"), createRoutine);

router.patch(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  updateRoutine
);

router.delete(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  deleteRoutine
);

module.exports = router;