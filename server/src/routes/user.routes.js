const express = require("express");
const {
  getUsers,
  updateUser,
  deleteUser,
} = require("../controllers/user.controller");

const protect = require("../middleware/auth.middleware");
const allowRoles = require("../middleware/role.middleware");

const router = express.Router();
const user = require("../controllers/user.controller");
const { all } = require("../config/db");
router.post(
  "/academic-requests",
  protect,
  allowRoles("student"),
  user.createAcademicRequest,
);
router.get("/academic-requests/my", protect, async (req, res) =>
  res.json(
    await all(
      "SELECT * FROM academic_requests WHERE user_id = ? ORDER BY id DESC",
      [req.user.id],
    ),
  ),
);
router.get(
  "/academic-requests",
  protect,
  allowRoles("super_admin"),
  async (req, res) =>
    res.json(
      await all(
        "SELECT r.*,u.name,u.roll FROM academic_requests r JOIN users u ON u.id=r.user_id ORDER BY r.id DESC",
      ),
    ),
);
router.patch(
  "/academic-requests/:id",
  protect,
  allowRoles("super_admin"),
  user.reviewAcademicRequest,
);
router.post(
  "/:id/reset-password",
  protect,
  allowRoles("super_admin"),
  user.adminReset,
);

router.get("/", protect, allowRoles("super_admin"), getUsers);

router.patch("/:id", protect, allowRoles("super_admin"), updateUser);

router.delete("/:id", protect, allowRoles("super_admin"), deleteUser);

module.exports = router;
