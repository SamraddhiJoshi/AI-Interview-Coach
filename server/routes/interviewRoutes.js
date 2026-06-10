const express = require("express");
const {
  generateInterview,
  getInterview,
  submitInterview,
  getInterviewHistory,
  saveProgress,
} = require("../controllers/interviewController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All interview routes require authentication
router.use(protect);

router.post("/generate", generateInterview);
router.get("/history", getInterviewHistory);
router.put("/:id/progress", saveProgress);
router.get("/:id", getInterview);
router.put("/:id/submit", submitInterview);

module.exports = router;
