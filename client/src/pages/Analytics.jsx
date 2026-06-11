import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAnalytics } from "../api/analytics";

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
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
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
          <span className="text-slate-400 text-sm font-body">Analytics</span>
        </div>

        <div className="flex items-center gap-6">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white text-sm font-body transition-colors"
          >
            Dashboard
          </Link>
          <Link
            to="/analytics"
            className="text-brand-400 hover:text-brand-300 text-sm font-body font-semibold transition-colors"
          >
            Analytics
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
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const StatCard = ({ title, value, icon, color, description }) => (
  <div className="card-glass p-6 space-y-3">
    <div className="flex items-center justify-between">
      <span className="text-slate-400 text-xs font-display font-bold uppercase tracking-wider">
        {title}
      </span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-white font-display font-bold text-3xl">{value}</p>
      {description && <p className="text-slate-500 text-[11px] font-body">{description}</p>}
    </div>
  </div>
);

const ScoreTrendChart = ({ scoreTrend }) => {
  const width = 600;
  const height = 250;
  const paddingX = 50;
  const paddingY = 40;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  if (!scoreTrend || scoreTrend.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-slate-500 font-body text-sm italic border border-white/5 bg-white/[0.01] rounded-2xl">
        Not enough evaluation data to plot scores.
      </div>
    );
  }

  const stepX = scoreTrend.length > 1 ? chartWidth / (scoreTrend.length - 1) : chartWidth;
  const getY = (score) => height - paddingY - ((score - 1) / 9) * chartHeight;

  const points = scoreTrend.map((d, i) => ({
    x: paddingX + i * stepX,
    y: getY(d.score),
    score: d.score,
    role: d.role,
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  }));

  const pathD = points.length > 1
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ")
    : `M ${paddingX} ${points[0].y} L ${width - paddingX} ${points[0].y}`;

  const fillD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : `${pathD} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="chart-stroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {/* Grid Lines */}
      {[1, 4, 7, 10].map((level) => (
        <g key={level}>
          <line
            x1={paddingX}
            y1={getY(level)}
            x2={width - paddingX}
            y2={getY(level)}
            className="stroke-white/[0.04]"
            strokeDasharray="4 4"
          />
          <text
            x={paddingX - 10}
            y={getY(level) + 4}
            className="fill-slate-500 font-display font-semibold text-[10px] text-right"
            textAnchor="end"
          >
            {level}
          </text>
        </g>
      ))}

      {/* Area Fill */}
      <path d={fillD} fill="url(#chart-fill)" />

      {/* Stroke Line */}
      <path d={pathD} fill="none" stroke="url(#chart-stroke)" strokeWidth="3" strokeLinecap="round" />

      {/* Node Dots */}
      {points.map((p, idx) => (
        <g key={idx} className="group cursor-pointer">
          <circle
            cx={p.x}
            cy={p.y}
            r="5"
            className="fill-brand-500 stroke-surface-950 stroke-[3px] group-hover:r-7 transition-all duration-200"
          />
          {/* Label Tooltip on hover */}
          <rect
            x={p.x - 30}
            y={p.y - 32}
            width="60"
            height="20"
            rx="4"
            className="fill-surface-900 stroke-white/10 stroke opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          />
          <text
            x={p.x}
            y={p.y - 18}
            className="fill-white font-display text-[9px] font-bold text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            textAnchor="middle"
          >
            {p.score}/10
          </text>
          {/* X Axis Labels */}
          <text
            x={p.x}
            y={height - 15}
            className="fill-slate-500 font-body text-[9px]"
            textAnchor="middle"
          >
            {p.date}
          </text>
        </g>
      ))}
    </svg>
  );
};

const Analytics = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await getAnalytics();
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen gradient-mesh noise flex flex-col justify-center items-center gap-3">
        <div className="w-9 h-9 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
        <p className="text-slate-400 text-sm font-body">Generating analytics dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen gradient-mesh noise flex flex-col justify-center items-center px-6 text-center">
        <div className="card-glass p-8 max-w-md space-y-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 font-bold text-xl">
            !
          </div>
          <h2 className="font-display text-lg font-bold text-white">Failed to Load Analytics</h2>
          <p className="text-slate-400 text-sm font-body">{error}</p>
          <Link to="/dashboard" className="btn-primary inline-flex mt-2">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { stats, classifications, scoreTrend, roleDistribution, insights, recentEvaluations } = data || {};
  const hasHistory = stats?.totalInterviews > 0;

  // Progress Growth Calculation
  let progressGrowth = 0;
  if (scoreTrend && scoreTrend.length > 1) {
    const initial = scoreTrend[0].score;
    const current = scoreTrend[scoreTrend.length - 1].score;
    progressGrowth = Math.round(((current - initial) / 10) * 100);
  }

  // Calculate maximum role interview count for distribution progress bar width scaling
  const maxRoleCount = roleDistribution ? Math.max(...Object.values(roleDistribution), 1) : 1;

  return (
    <div className="min-h-screen gradient-mesh noise">
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-700/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-900/5 rounded-full blur-3xl pointer-events-none" />

      <NavBar user={user} onLogout={handleLogout} />

      <main className="max-w-6xl mx-auto px-6 py-10 relative z-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-3">
              <span className="text-brand-300 text-xs font-body font-medium">
                AI Performance Center
              </span>
            </div>
            <h1 className="font-display text-3xl font-bold text-white tracking-tight">
              Analytics Overview
            </h1>
            <p className="text-slate-400 font-body text-sm mt-1">
              Gain visual insights into your interview performance, skill distribution, and AI diagnostics.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 font-display font-semibold text-sm transition-all self-start md:self-center"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {!hasHistory ? (
          /* Empty State */
          <div className="card-glass p-12 text-center max-w-xl mx-auto space-y-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="w-16 h-16 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center mx-auto text-brand-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m.5 1.5L9 21" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="font-display font-bold text-white text-xl">No Analytics Data Available</h3>
              <p className="text-slate-400 font-body text-sm leading-relaxed">
                You haven't completed any mock interviews yet. Start your first session, submit your responses, and let Gemini AI grade your skills to unlock detailed analytics.
              </p>
            </div>
            <button
              onClick={() => navigate("/interview/setup")}
              className="btn-primary max-w-xs mx-auto inline-flex"
            >
              Start First Interview
            </button>
          </div>
        ) : (
          /* Full Analytics Grid */
          <div className="space-y-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Interviews"
                value={stats.totalInterviews}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>}
                color="bg-brand-500/10 text-brand-400"
                description={`${stats.completedInterviews} completed sessions`}
              />
              <StatCard
                title="Average Score"
                value={stats.averageScore > 0 ? `${stats.averageScore}/10` : "—"}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>}
                color="bg-emerald-500/10 text-emerald-400"
                description={stats.highestScore ? `Highest score: ${stats.highestScore}/10` : "No grading yet"}
              />
              <StatCard
                title="Current Streak"
                value={`${stats.currentStreak} Days`}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg>}
                color="bg-amber-500/10 text-amber-400"
                description={`Longest streak: ${stats.longestStreak} days`}
              />
              <StatCard
                title="Evaluated Count"
                value={stats.evaluatedInterviews}
                icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                color="bg-blue-500/10 text-blue-400"
                description="With Gemini feedback"
              />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Score Trend */}
              <div className="card-glass p-6 md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-white text-base">Score Progression</h3>
                  <span className="text-[10px] uppercase font-display font-bold text-slate-500 tracking-wider">
                    Score over time
                  </span>
                </div>
                <div className="pt-2">
                  <ScoreTrendChart scoreTrend={scoreTrend} />
                </div>
              </div>

              {/* Classifications & Distribution */}
              <div className="card-glass p-6 space-y-6 flex flex-col justify-between">
                <div>
                  <h3 className="font-display font-bold text-white text-base mb-1">Score Classifications</h3>
                  <p className="text-slate-500 text-xs font-body mb-4">Interviews grouped by grading score brackets.</p>
                </div>

                <div className="space-y-4 my-auto">
                  {/* Advanced */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-body text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-500" />
                        Advanced (8-10)
                      </span>
                      <span className="font-semibold">{classifications.advanced}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${stats.evaluatedInterviews > 0 ? (classifications.advanced / stats.evaluatedInterviews) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Intermediate */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-body text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Intermediate (5-7)
                      </span>
                      <span className="font-semibold">{classifications.intermediate}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${stats.evaluatedInterviews > 0 ? (classifications.intermediate / stats.evaluatedInterviews) * 100 : 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Beginner */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-body text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        Beginner (0-4)
                      </span>
                      <span className="font-semibold">{classifications.beginner}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-500 rounded-full"
                        style={{ width: `${stats.evaluatedInterviews > 0 ? (classifications.beginner / stats.evaluatedInterviews) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.06] text-center">
                  <span className="text-slate-400 font-body text-[11px]">
                    Total Graded Sessions: <strong className="text-white">{stats.evaluatedInterviews}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Role Distribution & AI Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Role distribution */}
              <div className="card-glass p-6 space-y-4">
                <h3 className="font-display font-bold text-white text-base">Role Distribution</h3>
                <div className="space-y-4">
                  {Object.keys(roleDistribution).map((role) => {
                    const count = roleDistribution[role];
                    const percent = Math.round((count / maxRoleCount) * 100);
                    return (
                      <div key={role} className="space-y-1">
                        <div className="flex justify-between text-xs font-body text-slate-300">
                          <span className="truncate">{role}</span>
                          <span className="font-semibold shrink-0">{count} sessions</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-600 to-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Insight topics */}
              <div className="card-glass p-6 md:col-span-2 space-y-6">
                <div>
                  <h3 className="font-display font-bold text-white text-base">AI Insight Topics</h3>
                  <p className="text-slate-500 text-xs font-body mt-0.5">Summary of aggregate strength and weakness themes detected by Gemini API.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-display font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Top Strength Fields
                    </span>
                    <ul className="space-y-2">
                      {insights.commonStrengths && insights.commonStrengths.length > 0 ? (
                        insights.commonStrengths.map((str, idx) => (
                          <li key={idx} className="text-white font-body text-xs flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span>{str}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-slate-500 italic text-xs">Insufficient evaluated data to extract themes.</p>
                      )}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-display font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                      Top Growth Fields
                    </span>
                    <ul className="space-y-2">
                      {insights.commonWeaknesses && insights.commonWeaknesses.length > 0 ? (
                        insights.commonWeaknesses.map((weak, idx) => (
                          <li key={idx} className="text-white font-body text-xs flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/5 border border-red-500/10">
                            <span className="text-red-400 font-bold">⚠️</span>
                            <span>{weak}</span>
                          </li>
                        ))
                      ) : (
                        <p className="text-slate-500 italic text-xs">Insufficient evaluated data to extract themes.</p>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions & Recent Evaluations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Learning Progress / Suggestions */}
              <div className="card-glass p-6 md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-bold text-white text-base">Key Actionable Suggestions</h3>
                  {progressGrowth !== 0 && (
                    <span className={`text-[10px] uppercase font-display font-bold px-2 py-0.5 rounded-full ${progressGrowth > 0 ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-slate-500/10 border border-slate-500/20 text-slate-400"}`}>
                      Progress: {progressGrowth > 0 ? `+${progressGrowth}%` : `${progressGrowth}%`}
                    </span>
                  )}
                </div>
                <div className="space-y-3">
                  {insights.suggestions && insights.suggestions.length > 0 ? (
                    insights.suggestions.map((sug, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01]">
                        <div className="w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0 text-brand-400 text-xs font-bold font-display">
                          {idx + 1}
                        </div>
                        <p className="text-slate-300 font-body text-xs leading-relaxed">{sug}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-xs">No suggestions aggregated yet.</p>
                  )}
                </div>
              </div>

              {/* Recent evaluations list */}
              <div className="card-glass p-6 space-y-4">
                <h3 className="font-display font-bold text-white text-base">Recent Evaluations</h3>
                <div className="divide-y divide-white/[0.04]">
                  {recentEvaluations && recentEvaluations.length > 0 ? (
                    recentEvaluations.map((item, idx) => (
                      <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white font-body font-semibold text-xs truncate">{item.role}</p>
                          <p className="text-slate-500 text-[10px] font-body mt-0.5">
                            {new Date(item.evaluatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="w-8 h-8 rounded-lg bg-brand-600/15 border border-brand-500/20 flex items-center justify-center text-brand-300 text-xs font-display font-bold">
                            {item.score}
                          </span>
                          <button
                            onClick={() => navigate(`/interview/results/${item.interviewId}`)}
                            className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 italic text-xs">No evaluated sessions found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;
