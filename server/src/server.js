const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const crypto = require("node:crypto");
dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== "production") {
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  console.warn(
    "Using an ephemeral development signing secret. Configure JWT_SECRET for persistent sessions.",
  );
}
if (
  !process.env.JWT_SECRET ||
  (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32)
)
  throw new Error("Configure a JWT_SECRET of at least 32 characters");

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

app.disable("x-powered-by");
if (process.env.TRUST_PROXY)
  app.set("trust proxy", Number(process.env.TRUST_PROXY));
const origins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((value) => value.trim());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: false, limit: "100kb" }));
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "same-origin");
  next();
});

const ready = initDb();
app.use(async (req, res, next) => {
  await ready;
  next();
});
app.use(
  "/api",
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
  require("./middleware/auth.middleware").optional,
);

app.get("/api/health", (req, res) => {
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
app.use("/api/portal", require("./routes/portal.routes"));
app.use("/api/files", require("./routes/file.routes"));
app.use("/api/assistant", require("./routes/assistant.routes"));
app.use("/api/directory", require("./routes/directory.routes"));
app.use("/api", (req, res) =>
  res.status(404).json({ message: "API endpoint not found" }),
);
const clientDirectory = path.resolve(__dirname, "../../client/dist");
app.use(express.static(clientDirectory));
app.get("/{*path}", (req, res, next) =>
  res.sendFile(path.join(clientDirectory, "index.html"), (error) =>
    error ? next() : undefined,
  ),
);
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const conflict = error.code?.startsWith("SQLITE_CONSTRAINT");
  const status =
    error.status ||
    (error.code === "LIMIT_FILE_SIZE"
      ? 413
      : error.name === "MulterError"
        ? 400
        : conflict
          ? 409
          : 500);
  const message =
    error.code === "LIMIT_FILE_SIZE"
      ? "Attachments must be 10 MB or smaller"
      : conflict
        ? "This record already exists or is referenced by other records. Update or archive related records first."
        : status < 500
          ? error.message
          : "The server could not complete the request";
  if (status >= 500) console.error(error);
  res.status(status).json({ message });
});

const PORT = process.env.PORT || 5000;

if (require.main === module)
  ready
    .then(() =>
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`)),
    )
    .catch((error) => {
      console.error("Database initialization failed:", error.message);
      process.exit(1);
    });
module.exports = { app, ready };
