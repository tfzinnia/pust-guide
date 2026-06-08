const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { run, get } = require("../config/db");

function createToken(user) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
}

async function studentSignup(req, res) {
  try {
    const {
      name,
      email,
      roll,
      password,
      department_id,
      session,
      year,
      semester,
    } = req.body;

    if (!name || !email || !roll || !password || !department_id || !session || !year || !semester) {
      return res.status(400).json({
        message: "All student signup fields are required",
      });
    }

    const existing = await get(
      "SELECT id FROM users WHERE email = ? OR roll = ?",
      [email, roll]
    );

    if (existing) {
      return res.status(400).json({
        message: "Email or roll already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await run(
      `INSERT INTO users 
      (name, email, roll, password, role, department_id, session, year, semester)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        roll,
        hashedPassword,
        "student",
        department_id,
        session,
        year,
        semester,
      ]
    );

    res.status(201).json({
      message: "Student account created successfully",
      user_id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Student signup failed",
      error: error.message,
    });
  }
}

async function createTeacher(req, res) {
  try {
    const {
      teacher_id,
      name,
      email,
      password,
      department_id,
      designation,
    } = req.body;

    if (!teacher_id || !name || !email || !password || !department_id || !designation) {
      return res.status(400).json({
        message: "All teacher fields are required",
      });
    }

    const existing = await get(
      "SELECT id FROM users WHERE email = ? OR teacher_id = ?",
      [email, teacher_id]
    );

    if (existing) {
      return res.status(400).json({
        message: "Email or teacher ID already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await run(
      `INSERT INTO users
      (teacher_id, name, email, password, role, department_id, designation)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        teacher_id,
        name,
        email,
        hashedPassword,
        "teacher",
        department_id,
        designation,
      ]
    );

    res.status(201).json({
      message: "Teacher account created successfully",
      user_id: result.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Teacher creation failed",
      error: error.message,
    });
  }
}

async function login(req, res) {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required",
      });
    }

    const user = await get(
      `SELECT * FROM users 
       WHERE email = ? OR roll = ? OR teacher_id = ?`,
      [identifier, identifier, identifier]
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid login credentials",
      });
    }

    const token = createToken(user);

    delete user.password;

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
}

async function getMe(req, res) {
  res.json({
    user: req.user,
  });
}

module.exports = {
  studentSignup,
  createTeacher,
  login,
  getMe,
};