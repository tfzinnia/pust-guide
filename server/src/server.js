const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const initDb = require("./database/initDb");

const authRoutes = require("./routes/auth.routes");
const departmentRoutes = require("./routes/department.routes");
const noticeRoutes = require("./routes/notice.routes");
const syllabusRoutes = require("./routes/syllabus.routes");
const routineRoutes = require("./routes/routine.routes");
const complaintRoutes = require("./routes/complaint.routes");
const markingRoutes = require("./routes/marking.routes");
const emergencyRoutes = require("./routes/emergency.routes");
const mapRoutes = require("./routes/map.routes");
const guidelineRoutes = require("./routes/guideline.routes");
const userRoutes = require("./routes/user.routes");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

initDb();

app.get("/", (req, res) => {
  res.json({
    message: "PUST Guide API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notices", noticeRoutes);
app.use("/api/syllabus", syllabusRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/marking", markingRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/guidelines", guidelineRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});