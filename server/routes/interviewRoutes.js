const express = require("express");
const rateLimit = require("express-rate-limit");
const {
  generateInterview,
  getInterview,
  submitInterview,
  getInterviewHistory,
  saveProgress,
  evaluateInterview,
} = require("../controllers/interviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Rate limiter for AI evaluation — 5 requests per 15 minutes per IP
const evaluateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many evaluation requests. Please try again after 15 minutes.",
  },
});

// All interview routes require authentication
router.use(protect);

router.post("/generate", generateInterview);
router.get("/history", getInterviewHistory);
router.put("/:id/progress", saveProgress);
router.post("/:id/evaluate", evaluateLimiter, evaluateInterview);
router.get("/:id", getInterview);
router.put("/:id/submit", submitInterview);

module.exports = router;
