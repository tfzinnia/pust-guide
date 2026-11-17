const router = require("express").Router();
const multer = require("multer");
const crypto = require("node:crypto");
const path = require("node:path");
const fs = require("node:fs/promises");
const protect = require("../middleware/auth.middleware");
const { assert } = require("../utils/http");
const { run, get } = require("../config/db");
const { loadComplaint } = require("../controllers/complaint.controller");
const directory = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads"),
);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 5 },
});
router.post("/", protect, upload.single("file"), async (req, res) => {
  const file = req.file,
    purpose = req.body.purpose;
  assert(file, "Select a file");
  assert(
    purpose === "syllabus"
      ? ["teacher", "super_admin"].includes(req.user.role)
      : purpose === "evidence" && req.user.role === "student",
    "You cannot upload this type of attachment",
    403,
  );
  const b = file.buffer;
  const mime =
    b.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
        ? "image/png"
        : b[0] === 255 && b[1] === 216 && b[2] === 255
          ? "image/jpeg"
          : b.subarray(0, 4).toString() === "RIFF" &&
              b.subarray(8, 12).toString() === "WEBP"
            ? "image/webp"
            : null;
  assert(
    mime && (purpose !== "syllabus" || mime === "application/pdf"),
    "Upload a PDF, PNG, JPEG, or WebP file. Syllabus files must be PDFs.",
  );
  const fileId = crypto.randomUUID(),
    filename = fileId;
  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(path.join(directory, filename), b, { flag: "wx" });
  const original =
    path
      .basename(file.originalname)
      .replace(/[\x00-\x1f\x7f]/g, "")
      .slice(0, 180) || "attachment";
  try {
    await run(
      "INSERT INTO uploaded_files (id,filename,original_name,mime_type,size,owner_id,department_id,purpose) VALUES (?,?,?,?,?,?,?,?)",
      [
        fileId,
        filename,
        original,
        mime,
        b.length,
        req.user.id,
        req.user.department_id,
        purpose,
      ],
    );
  } catch (error) {
    await fs.unlink(path.join(directory, filename));
    throw error;
  }
  res
    .status(201)
    .json({ url: `/api/files/${fileId}`, name: original, size: b.length });
});
router.get("/:id", async (req, res) => {
  const file = await get("SELECT * FROM uploaded_files WHERE id=?", [
    req.params.id,
  ]);
  assert(file, "File not found", 404);
  if (file.purpose === "evidence") {
    assert(req.user, "Sign in to access this attachment", 401);
    if (file.owner_id !== req.user.id) {
      const complaint = await get(
        "SELECT id FROM complaints WHERE image_url=?",
        [`/api/files/${file.id}`],
      );
      assert(complaint, "You cannot access this attachment", 403);
      await loadComplaint(complaint.id, req.user);
    }
  }
  res.set(
    "Cache-Control",
    file.purpose === "evidence" ? "private, no-store" : "public, max-age=3600",
  );
  res.type(file.mime_type);
  res.download(
    path.join(directory, file.filename),
    file.original_name,
    (error) => {
      if (error && !res.headersSent)
        res
          .status(404)
          .json({ message: "The attachment is no longer available" });
    },
  );
});
module.exports = router;
