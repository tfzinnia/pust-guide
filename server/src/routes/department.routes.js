const express = require("express");
const {
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/department.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getDepartments);
router.get("/:id", getDepartmentById);

router.post("/", protect, allowRoles("super_admin"), createDepartment);

router.patch("/:id", protect, allowRoles("super_admin"), updateDepartment);

router.delete("/:id", protect, allowRoles("super_admin"), deleteDepartment);

module.exports = router;