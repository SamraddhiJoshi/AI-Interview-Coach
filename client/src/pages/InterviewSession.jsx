import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInterview, submitInterview, saveInterviewProgress } from "../api/interview";

const NavBar = ({ user, onLogout }) => {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <nav className="border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="white"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
            </div>
            <span className="font-display font-bold text-white tracking-tight">
              InterviewAI
            </span>
          </Link>
          <span className="text-white/20 text-lg">/</span>
          <span className="text-slate-400 text-sm font-body">Session</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white text-sm font-body transition-colors"
            onClick={(e) => {
              if (!window.confirm("Leave interview? Your progress in this session will not be saved until you submit.")) {
                e.preventDefault();
              }
            }}
          >
            ← Exit
          </Link>
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center">
            <span className="text-white text-xs font-display font-bold">
              {initials}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

const InterviewSession = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved, error

  const saveTimeoutRef = useRef(null);

  // Cleanup save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await getInterview(id);
        const data = res.data;

        // If interview is already completed, redirect directly to results
        if (data.status === "completed" || data.status === "evaluated") {
          navigate(`/interview/results/${id}`, { replace: true });
          return;
        }

        setInterview(data);
        setQuestions(data.questions);

        // Prepopulate answers with existing state from DB or defaults
        if (data.answers && data.answers.length === data.questions.length) {
          setAnswers(data.answers);
        } else {
          setAnswers(Array(data.questions.length).fill(""));
        }

        // Restore currentQuestionIndex
        if (data.currentQuestionIndex !== undefined && data.currentQuestionIndex >= 0 && data.currentQuestionIndex < data.questions.length) {
          setCurrentIndex(data.currentQuestionIndex);
        }
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load interview session."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, navigate]);

  const triggerSaveProgress = async (index, currentAnswers) => {
    setSaveStatus("saving");
    try {
      await saveInterviewProgress(id, index, currentAnswers);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Autosave failed:", err);
      setSaveStatus("error");
    }
  };

  const queueSaveProgress = (index, currentAnswers, immediate = false) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (immediate) {
      triggerSaveProgress(index, currentAnswers);
    } else {
      setSaveStatus("saving");
      saveTimeoutRef.current = setTimeout(() => {
        triggerSaveProgress(index, currentAnswers);
      }, 1500);
    }
  };

  const handleAnswerChange = (e) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = e.target.value;
    setAnswers(newAnswers);
    queueSaveProgress(currentIndex, newAnswers, false);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      queueSaveProgress(newIndex, answers, true);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      queueSaveProgress(newIndex, answers, true);
    }
  };

  const handleFinish = async () => {
    if (!window.confirm("Are you sure you want to finish and submit your interview?")) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSubmitting(true);
    setError("");

    try {
      await submitInterview(id, answers);
      navigate(`/interview/results/${id}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit answers. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh noise flex flex-col justify-center items-center gap-3">
        <div className="w-9 h-9 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-body">Loading interview session...</p>
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="min-h-screen gradient-mesh noise flex flex-col justify-center items-center px-6 text-center">
        <div className="card-glass p-8 max-w-md space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 font-bold text-xl">
            !
          </div>
          <h2 className="font-display text-lg font-bold text-white">Error Occurred</h2>
          <p className="text-slate-400 text-sm font-body">{error}</p>
          <Link to="/dashboard" className="btn-primary inline-flex mt-2">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="min-h-screen gradient-mesh noise">
      {submitting && (
        <div className="fixed inset-0 bg-surface-900/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fade-in">
          <div className="spinner mb-4 w-10 h-10 border-4 border-brand-500/30 border-t-brand-500" />
          <h2 className="font-display font-bold text-xl text-white mb-2">Evaluating your answers...</h2>
          <p className="text-slate-400 font-body text-sm max-w-md text-center">
            Our AI coach is reviewing your responses. This might take a few moments.
          </p>
        </div>
      )}

      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <NavBar user={user} onLogout={handleLogout} />

      <main className="max-w-3xl mx-auto px-6 py-10 relative z-10">
        {/* Header summary */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-body font-medium">
                {interview?.role}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-300 text-xs font-body font-medium">
                {interview?.experienceLevel}
              </span>
              {saveStatus === "saving" && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-body font-medium flex items-center gap-1.5 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  Saved to cloud
                </span>
              )}
              {saveStatus === "error" && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-body font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Save failed
                </span>
              )}
            </div>
            <h1 className="font-display text-xl font-bold text-white">
              Mock Interview Simulator
            </h1>
          </div>
          <span className="text-slate-400 font-display font-semibold text-sm self-start sm:self-center">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6 bg-white/5 rounded-full h-2 overflow-hidden animate-fade-up">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-body animate-fade-up">
            {error}
          </div>
        )}

        {/* Main session card */}
        <div className="card-glass p-8 space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {/* Question Text */}
          <div className="space-y-2">
            <span className="text-xs font-display font-bold uppercase tracking-wider text-slate-500">
              Question #{currentIndex + 1}
            </span>
            <p className="font-display text-lg font-semibold text-white leading-relaxed">
              {currentQuestion}
            </p>
          </div>

          {/* Answer Textarea */}
          <div className="space-y-2">
            <label className="block text-slate-400 text-xs font-display font-bold uppercase tracking-wider">
              Your Answer
            </label>
            <textarea
              value={answers[currentIndex] || ""}
              onChange={handleAnswerChange}
              placeholder="Type your detailed answer here. Use bullet points or code snippets if relevant..."
              className="w-full min-h-[200px] bg-surface-900 border border-white/10 rounded-2xl p-5 text-white placeholder-slate-500 font-body text-sm leading-relaxed focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all resize-none"
              disabled={submitting}
            />
          </div>

          {/* Nav buttons */}
          <div className="pt-4 border-t border-white/[0.06] flex items-center justify-between gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0 || submitting}
              className="px-5 py-2.5 rounded-xl border border-white/10 text-slate-300 font-display font-semibold text-sm hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              ← Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                onClick={handleFinish}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-display font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="spinner" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Finish Interview
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={submitting}
                className="bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold py-2.5 px-6 rounded-xl transition-all flex items-center gap-1.5"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default InterviewSession;
