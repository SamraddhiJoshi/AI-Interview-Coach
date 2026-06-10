import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getInterview } from "../api/interview";

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

        {/* Warning banner indicating AI evaluation is step 4 */}
        <div className="mt-6 card-glass p-5 border-amber-500/20 bg-amber-500/5 flex items-start gap-4 animate-fade-up" style={{ animationDelay: "0.15s" }}>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 21l8.904-4.43c.24-.12.392-.37.392-.644V15.75M3 10.5h18M3 14.25h18M3 6.75h18"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-bold text-amber-300 text-sm">
              AI Assessment Pending
            </h3>
            <p className="text-slate-400 font-body text-xs mt-1 leading-relaxed">
              Your answers have been stored. AI-powered evaluations, scoring, and critical feedback modules will be integrated in Step 4. Currently, you can review your raw answers below.
            </p>
          </div>
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
