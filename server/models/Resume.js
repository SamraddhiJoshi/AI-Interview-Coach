const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      unique: true,
    },
    fileUrl: {
      type: String,
      required: [true, "File URL is required"],
    },
    publicId: {
      type: String,
      required: [true, "Cloudinary public ID is required"],
    },
    originalFileName: {
      type: String,
      required: [true, "Original file name is required"],
      trim: true,
    },
    fileSize: {
      type: Number, // in bytes
      required: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    parsedData: {
      skills: [String],
      technologies: [String],
      programmingLanguages: [String],
      projects: [{
        name: String,
        description: String
      }],
      experience: [{
        title: String,
        company: String,
        duration: String
      }],
      education: [{
        degree: String,
        institution: String
      }],
      certifications: [String]
    },
    resumeText: String,
    fileHash: String,
    isAnalyzed: {
      type: Boolean,
      default: false
    },
    analyzedAt: Date
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", resumeSchema);
