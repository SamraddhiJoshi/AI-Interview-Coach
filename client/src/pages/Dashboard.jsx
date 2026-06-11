import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboard } from "../api/auth";
import { getInterviewHistory } from "../api/interview";

const StatCard = ({ icon, label, value, color }) => (
  <div className="card-glass p-5 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-slate-400 text-xs font-body uppercase tracking-wider">{label}</p>
      <p className="text-white font-display font-bold text-2xl mt-0.5">{value}</p>
    </div>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await getDashboard();
        setStats(data.data.stats);
      } catch (err) {
        if (err.response?.status !== 401) setError(true);
      } finally {
        setLoading(false);
      }
    };
    const fetchHistory = async () => {
      try {
        const res = await getInterviewHistory();
        setHistory(res.data);
      } catch (err) {
        if (err.response?.status !== 401) setError(true);
      }
    };
    fetchDashboard();
    fetchHistory();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "—";

  const evaluatedInterviews = history.filter((h) => h.evaluationStatus === "completed");
  const latestScore = evaluatedInterviews.length > 0 ? evaluatedInterviews[0].score : null;

  return (
    <div className="min-h-screen gradient-mesh noise">
      <div className="fixed top-[-5%] right-[-5%] w-96 h-96 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Navbar */}
      <nav className="border-b border-white/[0.06] backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            </div>
            <span className="font-display font-bold text-white tracking-tight">InterviewAI</span>
          </div>

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-brand-400 hover:text-brand-300 text-sm font-body font-semibold transition-colors">
              Dashboard
            </Link>
            <Link to="/analytics" className="text-slate-400 hover:text-white text-sm font-body transition-colors">
              Analytics
            </Link>
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-display font-bold">{initials}</span>
            </div>
            <span className="text-slate-300 text-sm font-body hidden md:block truncate max-w-[120px]">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-red-400 text-sm font-body transition-colors px-3 py-1.5 rounded-lg hover:bg-red-500/10 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-10 animate-fade-up">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">👋</span>
            <h1 className="font-display text-2xl font-bold text-white">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
          </div>
          <p className="text-slate-400 font-body text-sm ml-10">
            Member since {memberSince} · {user?.email}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-10 text-center animate-fade-up">
            <h2 className="text-red-400 font-display font-bold text-lg mb-2">Unable to load dashboard</h2>
            <p className="text-red-400/80 font-body text-sm">We couldn't connect to our servers. Please check your connection and try refreshing the page.</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <StatCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Interviews Done"
            value={loading ? "—" : stats?.interviewsCompleted ?? 0}
            color="bg-emerald-500/20"
          />
          <StatCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
            label="Average Score"
            value={loading ? "—" : `${stats?.averageScore ?? 0}/10`}
            color="bg-brand-500/20"
          />
          <StatCard
            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="white" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            label="Practice Hours"
            value={loading ? "—" : `${stats?.practiceHours ?? 0}h`}
            color="bg-amber-500/20"
          />
        </div>

        {/* CTA and Analytics Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 animate-fade-up" style={{ animationDelay: "0.2s" }}>
          {/* Practice CTA */}
          <div className="card-glass p-8 flex flex-col justify-between items-center text-center">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-4 text-brand-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                </svg>
              </div>
              <h2 className="font-display text-lg font-bold text-white mb-2">Ready to practice?</h2>
              <p className="text-slate-400 font-body text-xs mb-6 max-w-sm">
                Start an AI-powered mock interview session and get real-time feedback to sharpen your skills.
              </p>
            </div>
            <button
              onClick={() => navigate("/interview/setup")}
              className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-display font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 text-sm"
            >
              Start Interview Session
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* Analytics Summary Card */}
          <div className="card-glass p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-white">Performance Insights</h2>
                <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                  </svg>
                </div>
              </div>
              <p className="text-slate-400 font-body text-xs mb-6">
                Track your scores, streaks, classifications, and view key actionable feedback from Gemini AI.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5">
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-500 block mb-1">Average Score</span>
                  <span className="font-display font-bold text-white text-xl">
                    {stats?.averageScore ? `${stats.averageScore}/10` : "—"}
                  </span>
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3.5">
                  <span className="text-[10px] font-display font-bold uppercase tracking-wider text-slate-500 block mb-1">Latest Score</span>
                  <span className="font-display font-bold text-white text-xl">
                    {latestScore !== null ? `${latestScore}/10` : "—"}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => navigate("/analytics")}
              className="w-full inline-flex items-center justify-center gap-2 border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white font-display font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 text-sm"
            >
              View Full Analytics
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Previous Interviews History */}
        <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.25s" }}>
          <h2 className="font-display text-lg font-bold text-white mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-brand-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            Previous Interviews
          </h2>

          {history.length === 0 ? (
            <div className="card-glass p-8 text-center">
              <p className="text-slate-400 font-body text-sm">No mock interviews started yet. Click "Start Interview Session" above to begin!</p>
            </div>
          ) : (
            <div className="card-glass overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] bg-white/[0.01]">
                      <th className="px-6 py-4 text-xs font-display font-bold text-slate-400 uppercase tracking-wider">Role & Level</th>
                      <th className="px-6 py-4 text-xs font-display font-bold text-slate-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-xs font-display font-bold text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-display font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {history.map((item) => (
                      <tr key={item._id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-white font-body font-semibold text-sm">{item.role}</p>
                          <p className="text-slate-400 text-xs font-body mt-0.5">{item.experienceLevel}</p>
                        </td>
                        <td className="px-6 py-4 text-slate-300 font-body text-sm">
                          {new Date(item.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          {item.status === "completed" || item.status === "evaluated" ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body font-medium">
                              <span className="w-1 h-1 rounded-full bg-emerald-400" />
                              Completed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-body font-medium">
                              <span className="w-1 h-1 rounded-full bg-amber-400" />
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === "completed" || item.status === "evaluated" ? (
                            <button
                              onClick={() => navigate(`/interview/results/${item._id}`)}
                              className="px-4 py-2 rounded-xl bg-brand-600/20 border border-brand-500/30 text-brand-300 hover:bg-brand-600/30 hover:border-brand-500/50 text-xs font-display font-semibold transition-all"
                            >
                              View Result
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/interview/${item._id}`)}
                              className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 hover:border-amber-500/50 text-xs font-display font-semibold transition-all"
                            >
                              Resume
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default Dashboard;
