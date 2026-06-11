const http = require("http");
const https = require("https");
const streamifier = require("streamifier");
const { cloudinary } = require("../config/cloudinary");
const Resume = require("../models/Resume");

// Upload buffer to Cloudinary
const uploadToCloudinary = (buffer, folder, originalName) => {
  return new Promise((resolve, reject) => {
    const safeName = originalName
      .replace(/\.pdf$/i, "")
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .substring(0, 80);

    const publicId = `${safeName}_${Date.now()}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        type: "authenticated",
        folder,
        public_id: publicId,
        overwrite: false,
        tags: ["resume"],
      },
      (error, result) => {
        if (error) return reject(error);

        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// Upload Resume
const uploadResume = async (req, res, next) => {
  let result = null;
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded.",
      });
    }

    // PDF Magic signature check (first 4 bytes must be "%PDF")
    const isPDFSignature = req.file.buffer.slice(0, 4).toString() === "%PDF";
    if (!isPDFSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid file content. The file is not a valid PDF document.",
      });
    }

    const folder = `ai-interview-coach/resumes/${req.user._id}`;

    // Upload new buffer to Cloudinary
    result = await uploadToCloudinary(
      req.file.buffer,
      folder,
      req.file.originalname,
    );

    const existingResume = await Resume.findOne({
      userId: req.user._id,
    });

    let oldPublicId = null;
    let oldType = "upload";
    let oldResourceType = "raw";
    let resume = null;

    if (existingResume) {
      // Keep track of the old file's Cloudinary ID to delete it later
      oldPublicId = existingResume.publicId;
      oldType = existingResume.fileUrl.includes("/authenticated/") ? "authenticated" : "upload";
      oldResourceType = existingResume.fileUrl.includes("/raw/") ? "raw" : "image";

      // Update the existing document instead of recreating it
      existingResume.fileUrl = result.secure_url;
      existingResume.publicId = result.public_id;
      existingResume.originalFileName = req.file.originalname;
      existingResume.fileSize = req.file.size;

      resume = await existingResume.save();
    } else {
      // Create new document
      resume = await Resume.create({
        userId: req.user._id,
        fileUrl: result.secure_url,
        publicId: result.public_id,
        originalFileName: req.file.originalname,
        fileSize: req.file.size,
      });
    }

    // If database transaction was successful, safe to clean up the old file on Cloudinary
    if (oldPublicId) {
      try {
        await cloudinary.uploader.destroy(oldPublicId, {
          resource_type: oldResourceType,
          type: oldType,
        });
        console.log(`✅ Old Cloudinary file cleaned up successfully (${oldResourceType}, ${oldType}):`, oldPublicId);
      } catch (err) {
        console.warn("⚠️ Old Cloudinary file cleanup skipped/failed:", err.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Resume uploaded successfully.",
      resume: {
        id: resume._id,
        fileUrl: resume.fileUrl,
        originalFileName: resume.originalFileName,
        fileSize: resume.fileSize,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    // Rollback: delete the newly uploaded file from Cloudinary since DB record wasn't updated/created
    if (result && result.public_id) {
      try {
        const resourceType = result.secure_url.includes("/raw/") ? "raw" : "image";
        await cloudinary.uploader.destroy(result.public_id, {
          resource_type: resourceType,
          type: "authenticated",
        });
        console.log(`🔄 Rollback: Deleted orphaned Cloudinary file (${resourceType}, authenticated):`, result.public_id);
      } catch (cleanupErr) {
        console.error("❌ Failed to rollback orphaned Cloudinary file:", cleanupErr.message);
      }
    }
    next(error);
  }
};

// Get Resume
const getResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "No resume found.",
      });
    }

    res.status(200).json({
      success: true,
      resume: {
        id: resume._id,
        fileUrl: resume.fileUrl,
        originalFileName: resume.originalFileName,
        fileSize: resume.fileSize,
        uploadedAt: resume.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Delete Resume
const deleteResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "No resume found.",
      });
    }

    try {
      const resourceType = resume.fileUrl.includes("/raw/") ? "raw" : "image";
      const type = resume.fileUrl.includes("/authenticated/") ? "authenticated" : "upload";
      await cloudinary.uploader.destroy(resume.publicId, {
        resource_type: resourceType,
        type: type,
      });
    } catch (err) {
      console.log("Cloudinary delete skipped");
    }

    await Resume.deleteOne({
      _id: resume._id,
    });

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

// View Resume (Proxy PDF from Cloudinary to Client)
const viewResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({
      userId: req.user._id,
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "No resume found.",
      });
    }

    const clientProtocol = resume.fileUrl.startsWith("https") ? https : http;

    clientProtocol.get(resume.fileUrl, (cloudinaryRes) => {
      if (cloudinaryRes.statusCode !== 200) {
        return res.status(cloudinaryRes.statusCode).json({
          success: false,
          message: "Failed to fetch resume from storage.",
        });
      }

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(resume.originalFileName)}"`
      );

      cloudinaryRes.pipe(res);
    }).on("error", (err) => {
      next(err);
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadResume,
  getResume,
  deleteResume,
  viewResume,
};
