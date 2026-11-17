const express = require("express");
const {
  createNotice,
  getNotices,
  getMyNotices,
  updateNotice,
  deleteNotice,
} = require("../controllers/notice.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();

router.get("/", getNotices);

router.get("/my", protect, allowRoles("student"), getMyNotices);

router.post("/", protect, allowRoles("teacher", "super_admin"), createNotice);

router.patch(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  updateNotice,
);

router.delete(
  "/:id",
  protect,
  allowRoles("teacher", "super_admin"),
  deleteNotice,
);

module.exports = router;
