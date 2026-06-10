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
      status: "completed",
    });

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
          averageScore: 0,
          practiceHours: 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
