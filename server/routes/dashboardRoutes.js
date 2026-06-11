const express = require("express");
const { protect } = require("../middleware/auth");
const Interview = require("../models/Interview");

const router = express.Router();

// @desc    Get dashboard data (protected example)
// @route   GET /api/dashboard
// @access  Private
router.get("/", protect, async (req, res, next) => {
  try {
    const completedCount = await Interview.countDocuments({
      userId: req.user._id,
      status: { $in: ["completed", "evaluated"] },
    });

    const evaluatedInterviews = await Interview.find({
      userId: req.user._id,
      status: "evaluated",
    });

    let averageScore = 0;
    if (evaluatedInterviews.length > 0) {
      const sum = evaluatedInterviews.reduce((acc, curr) => acc + (curr.score || 0), 0);
      averageScore = Math.round((sum / evaluatedInterviews.length) * 10) / 10;
    }

    res.status(200).json({
      success: true,
      message: `Welcome to your dashboard, ${req.user.name}!`,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
        },
        stats: {
          interviewsCompleted: completedCount,
          averageScore,
          practiceHours: 0, // Placeholder, can be updated later if tracking time
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
