const express = require("express");
const {
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", protect, allowRoles("super_admin"), getUsers);

router.patch("/:id", protect, allowRoles("super_admin"), updateUser);

router.delete("/:id", protect, allowRoles("super_admin"), deleteUser);

module.exports = router;