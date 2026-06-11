import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInterview, evaluateInterviewSession } from "../api/interview";

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
          <span className="text-slate-400 text-sm font-body">Results</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white text-sm font-body transition-colors"
          >
            ← Dashboard
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

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const InterviewResults = () => {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [evalError, setEvalError] = useState("");

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await getInterview(id);
        const data = res.data;

        // If the interview is still pending, redirect back to the session so they can finish it
        if (data.status === "pending") {
          navigate(`/interview/${id}`, { replace: true });
          return;
        }

        setInterview(data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to load interview results."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInterview();
  }, [id, navigate]);

  const handleGenerateFeedback = async () => {
    setEvaluating(true);
    setEvalError("");
    try {
      const res = await evaluateInterviewSession(id);
      setInterview(res.data);
    } catch (err) {
      setEvalError(
        err.response?.data?.message || "Failed to generate AI evaluation. Please try again."
      );
    } finally {
      setEvaluating(false);
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
        <p className="text-slate-400 text-sm font-body">Loading results...</p>
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

  return (
    <div className="min-h-screen gradient-mesh noise">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <NavBar user={user} onLogout={handleLogout} />

      <main className="max-w-4xl mx-auto px-6 py-10 relative z-10">
        {/* Results Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 animate-fade-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-3">
              <span className="text-brand-300 text-xs font-body font-medium">
                Simulation Complete
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white">
              Interview Results
            </h1>
            <p className="text-slate-400 font-body text-sm mt-1.5">
              Review the questions generated during your simulator session and the answers you submitted.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold text-sm transition-all self-start md:self-center flex items-center gap-2"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Interview Metadata Info Card */}
        <div className="card-glass p-6 grid grid-cols-2 md:grid-cols-4 gap-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div>
            <span className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">
              Role
            </span>
            <p className="text-white font-body font-semibold text-base mt-1">
              {interview?.role}
            </p>
          </div>
          <div>
            <span className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">
              Experience Level
            </span>
            <p className="text-white font-body font-semibold text-base mt-1">
              {interview?.experienceLevel}
            </p>
          </div>
          <div>
            <span className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">
              Date Completed
            </span>
            <p className="text-slate-300 font-body text-sm mt-1">
              {formatDate(interview?.updatedAt)}
            </p>
          </div>
          <div>
            <span className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">
              Status
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Completed
              </span>
            </div>
          </div>
        </div>

        {/* AI Evaluation Section */}
        <div className="mt-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          {interview?.status === "evaluated" && interview?.evaluationStatus === "completed" ? (
            <div className="card-glass p-8 border-brand-500/20 bg-brand-500/5 space-y-6">
              {/* Header with Score and Timestamp */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/[0.06] pb-5 gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex flex-col items-center justify-center">
                    <span className="text-2xl font-display font-bold text-brand-300">
                      {interview.score}
                    </span>
                    <span className="text-[10px] uppercase font-display font-semibold text-slate-500 tracking-wider">
                      / 10
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-white text-lg">
                      AI Performance Assessment
                    </h3>
                    <p className="text-slate-400 font-body text-xs mt-0.5">
                      Evaluated on {formatDate(interview.evaluatedAt)}
                    </p>
                  </div>
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5">
                  <span className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider block">
                    Hiring Recommendation
                  </span>
                  <span className="text-brand-300 font-body font-semibold text-sm mt-0.5 block">
                    {interview.hiringRecommendation}
                  </span>
                </div>
              </div>

              {/* Strengths, Weaknesses, Suggestions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Strengths */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-300">Key Strengths</h4>
                  </div>
                  <ul className="space-y-2">
                    {interview.strengths && interview.strengths.length > 0 ? (
                      interview.strengths.map((str, idx) => (
                        <li key={idx} className="text-slate-400 font-body text-xs leading-relaxed flex items-start gap-2">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          <span>{str}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-slate-500 italic text-xs">No key strengths noted.</p>
                    )}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-300">Areas to Improve</h4>
                  </div>
                  <ul className="space-y-2">
                    {interview.weaknesses && interview.weaknesses.length > 0 ? (
                      interview.weaknesses.map((weak, idx) => (
                        <li key={idx} className="text-slate-400 font-body text-xs leading-relaxed flex items-start gap-2">
                          <span className="text-red-500 mt-0.5">•</span>
                          <span>{weak}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-slate-500 italic text-xs">No significant weaknesses noted.</p>
                    )}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-brand-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                    </svg>
                    <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-300">Actionable Advice</h4>
                  </div>
                  <ul className="space-y-2">
                    {interview.suggestions && interview.suggestions.length > 0 ? (
                      interview.suggestions.map((sug, idx) => (
                        <li key={idx} className="text-slate-400 font-body text-xs leading-relaxed flex items-start gap-2">
                          <span className="text-brand-500 mt-0.5">•</span>
                          <span>{sug}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-slate-500 italic text-xs">No specific suggestions provided.</p>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-glass p-8 text-center space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-brand-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.43c.24-.12.392-.37.392-.644V15.75M3 10.5h18M3 14.25h18M3 6.75h18" />
                </svg>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="font-display font-bold text-white text-lg">
                  AI Assessment Pending
                </h3>
                <p className="text-slate-400 font-body text-sm leading-relaxed">
                  Your mock interview has been submitted successfully! Generate real-time performance feedback, strengths, suggestions, and grading powered by Google Gemini AI.
                </p>
              </div>

              {/* Error indicator */}
              {(evalError || interview?.evaluationStatus === "failed") && (
                <div className="max-w-md mx-auto px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-body animate-fade-up">
                  {evalError || "API key misconfigured or Google Gemini service quota exceeded. Please contact administrator."}
                </div>
              )}

              {evaluating || (interview?.status === "evaluated" && interview?.evaluationStatus === "pending") ? (
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="w-7 h-7 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                  <p className="text-slate-400 text-xs font-body animate-pulse">Gemini AI is evaluating your interview... This may take up to 30 seconds.</p>
                </div>
              ) : (
                <button
                  onClick={handleGenerateFeedback}
                  className="btn-primary max-w-xs mx-auto"
                >
                  Generate AI Feedback
                </button>
              )}
            </div>
          )}
        </div>

        {/* Questions and Answers List */}
        <div className="mt-8 space-y-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          <h2 className="font-display text-lg font-bold text-white mb-2">
            Questions & Submissions ({interview?.questions?.length})
          </h2>

          {interview?.questions?.map((question, index) => (
            <div key={index} className="card-glass overflow-hidden">
              {/* Question Header */}
              <div className="bg-white/[0.02] px-6 py-4 border-b border-white/[0.04] flex justify-between items-center">
                <span className="text-xs font-display font-bold text-brand-400 uppercase tracking-wider">
                  Question #{index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Question */}
                <div>
                  <p className="font-display text-white font-medium text-base leading-relaxed">
                    {question}
                  </p>
                </div>

                {/* Answer */}
                <div className="pt-4 border-t border-white/[0.04] space-y-2">
                  <span className="text-xs font-display font-semibold text-slate-500 uppercase tracking-wider">
                    Your Response
                  </span>
                  <div className="bg-white/[0.01] border border-white/5 rounded-xl p-4 min-h-[100px]">
                    {interview.answers[index] ? (
                      <p className="text-slate-300 font-body text-sm whitespace-pre-wrap leading-relaxed">
                        {interview.answers[index]}
                      </p>
                    ) : (
                      <p className="text-slate-500 font-body text-sm italic">
                        No answer was submitted for this question.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default InterviewResults;
