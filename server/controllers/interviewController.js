const Interview = require("../models/Interview");
const Resume = require("../models/Resume");
const questionBank = require("../data/questionBank");
const geminiService = require("../services/geminiService");

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

    // MULTI-LEVEL FALLBACK SYSTEM
    let selectedQuestions = [];
    let questionSource = "default";
    
    // Level 1: Try Gemini Personalized Questions
    try {
      const resume = await Resume.findOne({ userId: req.user._id });
      if (resume && resume.isAnalyzed && resume.parsedData) {
        selectedQuestions = await geminiService.generatePersonalizedQuestions(
          role, 
          experienceLevel, 
          numQuestions, 
          resume.parsedData
        );
        questionSource = "personalized";
      }
    } catch (geminiError) {
      console.error("Failed to generate personalized questions with Gemini:", geminiError.message);
      // Fallback will occur automatically
    }

    // Level 2 & 3: Fallback to Skill-Based or Default Question Bank
    if (!selectedQuestions || selectedQuestions.length === 0) {
      const questionsPool = questionBank[bankKey];
      selectedQuestions = getRandomQuestions(questionsPool, numQuestions);
      // Since our question bank is technically skill-based based on role
      questionSource = "skill-based"; 
    }

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
      questionSource,
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

    // Prevent re-submitting completed/evaluated interviews
    if (interview.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Interview is already completed or evaluated.",
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

// @desc    Evaluate a completed mock interview session using Gemini API
// @route   POST /api/interviews/:id/evaluate
// @access  Private
const evaluateInterview = async (req, res, next) => {
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
        message: "Not authorized to access this interview.",
      });
    }

    // Return stored evaluation early if already completed
    if (interview.evaluationStatus === "completed") {
      return res.status(200).json({
        success: true,
        message: "Stored evaluation retrieved successfully.",
        data: interview,
      });
    }

    // Interview must be completed
    if (interview.status !== "completed" && interview.status !== "evaluated") {
      return res.status(400).json({
        success: false,
        message: "Interview session must be completed before evaluation.",
      });
    }

    // Ensure answers are present
    if (!interview.answers || interview.answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No answers found in the interview session.",
      });
    }

    // Set status to pending while calling Gemini
    interview.evaluationStatus = "pending";
    await interview.save();

    try {
      const evaluation = await geminiService.evaluateInterview(
        interview.role,
        interview.experienceLevel,
        interview.questions,
        interview.answers
      );

      // Validate and clamp score between 1 and 10
      let numericScore = parseFloat(evaluation.score);
      if (isNaN(numericScore)) {
        numericScore = 1;
      }
      // Clamp between 1 and 10
      numericScore = Math.max(1, Math.min(10, Math.round(numericScore)));

      // Save evaluation fields
      interview.score = numericScore;
      interview.strengths = Array.isArray(evaluation.strengths) ? evaluation.strengths : [];
      interview.weaknesses = Array.isArray(evaluation.weaknesses) ? evaluation.weaknesses : [];
      interview.suggestions = Array.isArray(evaluation.suggestions) ? evaluation.suggestions : [];
      interview.hiringRecommendation = evaluation.hiringRecommendation || "No recommendation provided.";
      interview.evaluationStatus = "completed";
      interview.status = "evaluated";
      interview.evaluatedAt = new Date();

      const updatedInterview = await interview.save();

      res.status(200).json({
        success: true,
        message: "AI evaluation completed successfully.",
        data: updatedInterview,
      });
    } catch (evaluationError) {
      console.error("Gemini Evaluation Failed:", evaluationError.message);
      
      // Revert status to failed so user can try again
      interview.evaluationStatus = "failed";
      await interview.save();

      return res.status(500).json({
        success: false,
        message: "AI evaluation service failed. Please try again later.",
      });
    }
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
  evaluateInterview,
};
