const express = require("express");
const {
  studentSignup,
  createTeacher,
  login,
  getMe,
} = require("../controllers/auth.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");
const account = require("../controllers/auth.controller");
const rateLimit = require("../middleware/rate.middleware");

const router = express.Router();

router.post("/student/signup", rateLimit(20), studentSignup);

router.post(
  "/teacher/create",
  protect,
  allowRoles("super_admin"),
  createTeacher,
);

router.post("/login", rateLimit(40), login);
router.post("/forgot-password", rateLimit(8), account.forgotPassword);
router.post("/reset-password", rateLimit(15), account.resetPassword);
router.patch("/profile", protect, account.updateProfile);
router.patch("/password", protect, account.changePassword);

router.get("/me", protect, getMe);

module.exports = router;
