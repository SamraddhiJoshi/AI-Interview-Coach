import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { generateInterview } from "../api/interview";

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
          <span className="text-slate-400 text-sm font-body">Setup</span>
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
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm font-body transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10"
          >
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const InterviewSetup = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState("Frontend Developer");
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await generateInterview({
        role,
        experienceLevel,
        numberOfQuestions: parseInt(numberOfQuestions, 10),
      });
      navigate(`/interview/${res.data._id}`);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to generate interview. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen gradient-mesh noise">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <NavBar user={user} onLogout={handleLogout} />

      <main className="max-w-2xl mx-auto px-6 py-12 relative z-10">
        <div className="mb-8 animate-fade-up text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-4">
            <span className="text-brand-300 text-xs font-body font-medium">
              Step 3: Interview Simulator
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            Setup Mock Interview
          </h1>
          <p className="text-slate-400 font-body text-sm mt-2">
            Customize your mock interview session. Our simulator will generate relevant technical questions based on your setup.
          </p>
        </div>

        <div className="card-glass p-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role select */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-body font-medium">
                Target Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-body text-sm"
              >
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="MERN Stack Developer">MERN Stack Developer</option>
                <option value="Java Developer">Java Developer</option>
                <option value="Python Developer">Python Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
              </select>
            </div>

            {/* Experience level select */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-body font-medium">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value)}
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-body text-sm"
              >
                <option value="Fresher">Fresher (Entry Level)</option>
                <option value="0-1 Years">0-1 Years (Junior)</option>
                <option value="1-3 Years">1-3 Years (Intermediate)</option>
              </select>
            </div>

            {/* Number of Questions select */}
            <div className="space-y-2">
              <label className="block text-slate-300 text-sm font-body font-medium">
                Number of Questions
              </label>
              <select
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(e.target.value)}
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all font-body text-sm"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
              </select>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary mt-4">
              {loading ? (
                <>
                  <div className="spinner" />
                  Generating Questions...
                </>
              ) : (
                "Generate Mock Interview"
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default InterviewSetup;
