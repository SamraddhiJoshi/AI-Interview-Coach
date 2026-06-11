const express = require("express");
const { getAnalyticsOverview } = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// All analytics routes require authentication
router.get("/overview", protect, getAnalyticsOverview);

module.exports = router;
