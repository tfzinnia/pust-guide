const express = require("express");
const {
  studentSignup,
  createTeacher,
  login,
  getMe,
} = require("../controllers/auth.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.post("/student/signup", studentSignup);

router.post(
  "/teacher/create",
  protect,
  allowRoles("super_admin"),
  createTeacher
);

router.post("/login", login);

router.get("/me", protect, getMe);

module.exports = router;