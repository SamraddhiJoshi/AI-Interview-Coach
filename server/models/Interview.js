const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: [
        "Frontend Developer",
        "Backend Developer",
        "MERN Stack Developer",
        "Java Developer",
        "Python Developer",
        "Full Stack Developer",
      ],
    },
    experienceLevel: {
      type: String,
      required: [true, "Experience level is required"],
      enum: ["Fresher", "0-1 Years", "1-3 Years"],
    },
    numberOfQuestions: {
      type: Number,
      required: [true, "Number of questions is required"],
      enum: [5, 10, 15],
    },
    questions: {
      type: [String],
      required: [true, "Questions array is required"],
    },
    answers: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "completed", "evaluated"],
      default: "pending",
    },
    score: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: null,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    hiringRecommendation: {
      type: String,
      default: null,
    },
    evaluationStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    evaluatedAt: {
      type: Date,
      default: null,
    },
    questionSource: {
      type: String,
      enum: ["personalized", "skill-based", "default"],
      default: "default",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Interview", interviewSchema);
