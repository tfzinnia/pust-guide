const jwt = require("jsonwebtoken");
const { get } = require("../config/db");

async function protect(req, res, next) {
  if (req.user) return next();
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Not authorized, token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await get(
      `SELECT u.id,u.token_version,u.name,u.email,u.role,u.roll,u.teacher_id,u.department_id,u.session,u.year,u.semester,u.designation,
       d.name AS department_name,d.short_name AS department FROM users u LEFT JOIN departments d ON d.id=u.department_id WHERE u.id = ?`,
      [decoded.id],
    );

    if (!user || (decoded.version || 0) !== user.token_version) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    delete user.token_version;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, invalid token",
    });
  }
}

module.exports = protect;
module.exports.optional = (req, res, next) =>
  req.headers.authorization ? protect(req, res, next) : next();
