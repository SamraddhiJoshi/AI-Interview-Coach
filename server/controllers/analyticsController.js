const Interview = require("../models/Interview");

// Common technical topics to analyze in AI insights
const technicalKeywords = [
  "React", "Virtual DOM", "State", "Props", "Hooks", "useState", "useEffect", "Redux", "Context API",
  "HTML", "CSS", "Flexbox", "Grid", "JavaScript", "Closure", "Hoisting", "Promises", "Event Loop",
  "Node.js", "Express", "Middleware", "JWT", "Authentication", "CORS", "REST", "API", "SQL", "NoSQL",
  "MongoDB", "Mongoose", "Database Indexing", "OOP", "Garbage Collection", "Multithreading", "Hibernate",
  "Spring Boot", "Django", "Flask", "GIL", "Generators", "Docker", "CI/CD", "WebSockets", "Git"
];

// Helper to calculate streaks (current and longest)
const calculateStrengthsAndStreaks = (interviews) => {
  // Extract unique completion dates in YYYY-MM-DD format
  const dates = interviews
    .filter((i) => i.status === "completed" || i.status === "evaluated")
    .map((i) => new Date(i.updatedAt || i.createdAt).toISOString().split("T")[0]);

  const uniqueDates = [...new Set(dates)].sort();

  if (uniqueDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const parseDateString = (str) => {
    const [y, m, d] = str.split("-").map(Number);
    return new Date(y, m - 1, d); // local timezone safe
  };

  // Calculate Longest Streak
  let longestStreak = 1;
  let tempStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = parseDateString(uniqueDates[i - 1]);
    const currDate = parseDateString(uniqueDates[i]);
    const diffTime = Math.abs(currDate - prevDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      tempStreak++;
    } else if (diffDays > 1) {
      tempStreak = 1;
    }
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  // Calculate Current Streak
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const lastDateStr = uniqueDates[uniqueDates.length - 1];
  let currentStreak = 0;

  if (lastDateStr === todayStr || lastDateStr === yesterdayStr) {
    currentStreak = 1;
    let idx = uniqueDates.length - 1;
    while (idx > 0) {
      const curr = parseDateString(uniqueDates[idx]);
      const prev = parseDateString(uniqueDates[idx - 1]);
      const diffTime = Math.abs(curr - prev);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
        idx--;
      } else {
        break;
      }
    }
  }

  return { currentStreak, longestStreak };
};

// Helper to aggregate topic frequencies in AI feedback text
const aggregateTopicFrequencies = (evaluatedInterviews) => {
  const strengthCounts = {};
  const weaknessCounts = {};

  technicalKeywords.forEach((kw) => {
    strengthCounts[kw] = 0;
    weaknessCounts[kw] = 0;
  });

  evaluatedInterviews.forEach((interview) => {
    const strengthsText = (interview.strengths || []).join(" ").toLowerCase();
    const weaknessesText = (interview.weaknesses || []).join(" ").toLowerCase();

    technicalKeywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw.replace(".", "\\.")}\\b`, "i");
      if (regex.test(strengthsText)) {
        strengthCounts[kw]++;
      }
      if (regex.test(weaknessesText)) {
        weaknessCounts[kw]++;
      }
    });
  });

  const getSortedTopics = (counts) => {
    return Object.keys(counts)
      .map((key) => ({ topic: key, count: counts[key] }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => item.topic);
  };

  return {
    commonStrengths: getSortedTopics(strengthCounts),
    commonWeaknesses: getSortedTopics(weaknessCounts),
  };
};

// @desc    Get user's analytics overview
// @route   GET /api/analytics/overview
// @access  Private
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const interviews = await Interview.find({ userId: req.user._id }).sort({
      createdAt: 1, // Ascending chronological order
    });

    const totalCount = interviews.length;
    const completedList = interviews.filter(
      (i) => i.status === "completed" || i.status === "evaluated"
    );
    const completedCount = completedList.length;

    const evaluatedList = interviews.filter(
      (i) => i.evaluationStatus === "completed"
    );
    const evaluatedCount = evaluatedList.length;

    // Streaks
    const { currentStreak, longestStreak } = calculateStrengthsAndStreaks(interviews);

    // Score calculations
    let averageScore = 0;
    let highestScore = null;
    let lowestScore = null;

    if (evaluatedCount > 0) {
      const scores = evaluatedList.map((i) => i.score);
      const sum = scores.reduce((acc, score) => acc + score, 0);
      averageScore = Math.round((sum / evaluatedCount) * 10) / 10;
      highestScore = Math.max(...scores);
      lowestScore = Math.min(...scores);
    }

    // Score category classifications
    let beginnerCount = 0;
    let intermediateCount = 0;
    let advancedCount = 0;

    evaluatedList.forEach((i) => {
      if (i.score <= 4) beginnerCount++;
      else if (i.score <= 7) intermediateCount++;
      else advancedCount++;
    });

    // Score Trend (chronological list of scores)
    const scoreTrend = evaluatedList.map((i) => ({
      interviewId: i._id,
      role: i.role,
      score: i.score,
      date: i.evaluatedAt || i.updatedAt,
    }));

    // Role Distribution counts
    const roleDistribution = {};
    interviews.forEach((i) => {
      roleDistribution[i.role] = (roleDistribution[i.role] || 0) + 1;
    });

    // AI Insights Topic Analysis
    const { commonStrengths, commonWeaknesses } = aggregateTopicFrequencies(evaluatedList);

    // Suggestions accumulation
    const suggestions = [];
    evaluatedList.forEach((i) => {
      if (Array.isArray(i.suggestions)) {
        suggestions.push(...i.suggestions);
      }
    });
    // Deduplicate suggestions and keep top 5
    const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

    // Recent Evaluations (Latest 5 evaluated sessions, sorted latest first)
    const recentEvaluations = [...evaluatedList]
      .reverse()
      .slice(0, 5)
      .map((i) => ({
        interviewId: i._id,
        role: i.role,
        score: i.score,
        evaluatedAt: i.evaluatedAt,
      }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalInterviews: totalCount,
          completedInterviews: completedCount,
          evaluatedInterviews: evaluatedCount,
          averageScore,
          highestScore,
          lowestScore,
          currentStreak,
          longestStreak,
        },
        classifications: {
          beginner: beginnerCount,
          intermediate: intermediateCount,
          advanced: advancedCount,
        },
        scoreTrend,
        roleDistribution,
        insights: {
          commonStrengths,
          commonWeaknesses,
          suggestions: uniqueSuggestions,
        },
        recentEvaluations,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalyticsOverview,
};
