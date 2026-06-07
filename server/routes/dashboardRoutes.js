const express = require("express");
const { protect } = require("../middleware/auth");

const router = express.Router();

// @desc    Get dashboard data (protected example)
// @route   GET /api/dashboard
// @access  Private
router.get("/", protect, (req, res) => {
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
        interviewsCompleted: 0,
        averageScore: 0,
        practiceHours: 0,
      },
    },
  });
});

module.exports = router;
