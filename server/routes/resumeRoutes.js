const express = require("express");
const { uploadResume, getResume, deleteResume, viewResume } = require("../controllers/resumeController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

const router = express.Router();

// Multer error handler wrapper
const handleUpload = (req, res, next) => {
  const multerUpload = upload.single("resume");
  multerUpload(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File too large. Maximum size is 5MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error.",
      });
    }
    next();
  });
};

router.post("/upload", protect, handleUpload, uploadResume);
router.get("/view", protect, viewResume);
router.get("/", protect, getResume);
router.delete("/", protect, deleteResume);

module.exports = router;
