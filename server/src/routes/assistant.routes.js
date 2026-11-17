const router = require("express").Router();
const rateLimit = require("../middleware/rate.middleware");
const { answerChat } = require("../services/student-assistant");
router.get("/status", (req, res) =>
  res.json({ mode: process.env.OPENAI_API_KEY?.trim() ? "ai" : "guide" }),
);
router.post(
  "/chat",
  rateLimit(40, (req) =>
    req.user ? `assistant-user:${req.user.id}` : `assistant-ip:${req.ip}`,
  ),
  async (req, res) => res.json(await answerChat(req.body, req.user)),
);
module.exports = router;
