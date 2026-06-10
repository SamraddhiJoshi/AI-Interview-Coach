const Interview = require("../models/Interview");
const questionBank = require("../data/questionBank");

// Role mapping from UI role to questionBank keys
const roleMap = {
  "Frontend Developer": "frontend",
  "Backend Developer": "backend",
  "MERN Stack Developer": "mern",
  "Java Developer": "java",
  "Python Developer": "python",
  "Full Stack Developer": "fullstack",
};

// Helper function to pick N unique random elements from an array
const getRandomQuestions = (arr, num) => {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num);
};

// @desc    Generate a new mock interview
// @route   POST /api/interviews/generate
// @access  Private
const generateInterview = async (req, res, next) => {
  try {
    const { role, experienceLevel, numberOfQuestions } = req.body;

    // Validate inputs
    if (!role || !experienceLevel || !numberOfQuestions) {
      return res.status(400).json({
        success: false,
        message: "Please provide role, experienceLevel, and numberOfQuestions.",
      });
    }

    const bankKey = roleMap[role];
    if (!bankKey || !questionBank[bankKey]) {
      return res.status(400).json({
        success: false,
        message: "Invalid role selected.",
      });
    }

    const allowedLevels = ["Fresher", "0-1 Years", "1-3 Years"];
    if (!allowedLevels.includes(experienceLevel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid experience level.",
      });
    }

    const numQuestions = parseInt(numberOfQuestions, 10);
    const allowedCounts = [5, 10, 15];
    if (!allowedCounts.includes(numQuestions)) {
      return res.status(400).json({
        success: false,
        message: "Number of questions must be 5, 10, or 15.",
      });
    }

    // Pick random questions from question bank
    const questionsPool = questionBank[bankKey];
    const selectedQuestions = getRandomQuestions(questionsPool, numQuestions);

    // Create interview record
    const interview = await Interview.create({
      userId: req.user._id,
      role,
      experienceLevel,
      numberOfQuestions: numQuestions,
      questions: selectedQuestions,
      answers: Array(numQuestions).fill(""), // Initialize empty answers array
      status: "pending",
      score: null,
      feedback: null,
    });

    res.status(201).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get complete interview details
// @route   GET /api/interviews/:id
// @access  Private
const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    // Validate ownership
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this interview.",
      });
    }

    res.status(200).json({
      success: true,
      data: interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit interview answers
// @route   PUT /api/interviews/:id/submit
// @access  Private
const submitInterview = async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Please provide answers as an array.",
      });
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    // Validate ownership
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this interview.",
      });
    }

    // Ensure answers array size matches questions array size
    if (answers.length !== interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: `Answers array size (${answers.length}) must match questions array size (${interview.questions.length}).`,
      });
    }

    // Save answers and mark as completed
    interview.answers = answers;
    interview.status = "completed";

    const updatedInterview = await interview.save();

    res.status(200).json({
      success: true,
      data: updatedInterview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's interview history
// @route   GET /api/interviews/history
// @access  Private
const getInterviewHistory = async (req, res, next) => {
  try {
    const history = await Interview.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Save interview progress (question index and draft answers)
// @route   PUT /api/interviews/:id/progress
// @access  Private
const saveProgress = async (req, res, next) => {
  try {
    const { currentQuestionIndex, answers } = req.body;

    if (currentQuestionIndex === undefined || !answers || !Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Please provide currentQuestionIndex and answers array.",
      });
    }

    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Interview session not found.",
      });
    }

    // Validate ownership
    if (interview.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to modify this interview.",
      });
    }

    // Prevent updating completed interviews
    if (interview.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot update progress of a completed or evaluated interview.",
      });
    }

    // Validate currentQuestionIndex bounds
    const qIndex = parseInt(currentQuestionIndex, 10);
    if (isNaN(qIndex) || qIndex < 0 || qIndex >= interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: `currentQuestionIndex must be a valid number between 0 and ${interview.questions.length - 1}.`,
      });
    }

    // Ensure answers array size matches questions array size
    if (answers.length !== interview.questions.length) {
      return res.status(400).json({
        success: false,
        message: `Answers array size (${answers.length}) must match questions array size (${interview.questions.length}).`,
      });
    }

    interview.currentQuestionIndex = qIndex;
    interview.answers = answers;

    const updatedInterview = await interview.save();

    res.status(200).json({
      success: true,
      data: updatedInterview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateInterview,
  getInterview,
  submitInterview,
  getInterviewHistory,
  saveProgress,
};
