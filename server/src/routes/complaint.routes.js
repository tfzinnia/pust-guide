const express = require("express");
const {
  createComplaint,
  getMyComplaints,
  getAllComplaints,
  getDepartmentComplaints,
  updateComplaintStatus,
} = require("../controllers/complaint.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();
const complaint = require("../controllers/complaint.controller");

router.post("/", protect, allowRoles("student"), createComplaint);

router.get("/my", protect, allowRoles("student"), getMyComplaints);

router.get(
  "/department",
  protect,
  allowRoles("teacher"),
  getDepartmentComplaints,
);

router.get("/", protect, allowRoles("super_admin"), getAllComplaints);
router.get("/:id", protect, complaint.details);
router.post("/:id/replies", protect, complaint.reply);

router.patch(
  "/:id/status",
  protect,
  allowRoles("teacher", "super_admin"),
  updateComplaintStatus,
);

module.exports = router;
