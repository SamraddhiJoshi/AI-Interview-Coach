import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadResume, getResume, deleteResume } from "../api/resume";
import api from "../api/axios";

// ─── Utility ────────────────────────────────────────────────────────────────
const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
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

// ─── Sub-components ─────────────────────────────────────────────────────────

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
          <span className="text-slate-400 text-sm font-body">Resume</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard"
            className="text-slate-400 hover:text-white text-sm font-body transition-colors hidden sm:block"
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

const UploadZone = ({ onFileSelect, isDragging, setIsDragging, uploading }) => {
  const inputRef = useRef(null);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect, setIsDragging],
  );

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={() => !uploading && inputRef.current?.click()}
      className={`
        relative rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
        flex flex-col items-center justify-center gap-4 py-14 px-6 text-center select-none
        ${
          isDragging
            ? "border-brand-400 bg-brand-500/10 scale-[1.01]"
            : "border-white/10 bg-white/[0.02] hover:border-brand-500/50 hover:bg-brand-500/5"
        }
        ${uploading ? "pointer-events-none opacity-60" : ""}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onFileSelect(e.target.files?.[0])}
        disabled={uploading}
      />

      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300
        ${isDragging ? "bg-brand-500/30" : "bg-white/5"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.2}
          stroke={isDragging ? "#818cf8" : "#64748b"}
          className="w-8 h-8 transition-all"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>

      {isDragging ? (
        <div>
          <p className="font-display font-semibold text-brand-300 text-lg">
            Drop it here!
          </p>
          <p className="text-slate-400 text-sm font-body mt-1">
            Release to upload your resume
          </p>
        </div>
      ) : (
        <div>
          <p className="font-display font-semibold text-white text-base">
            Drag & drop your resume here
          </p>
          <p className="text-slate-400 text-sm font-body mt-1.5">
            or{" "}
            <span className="text-brand-400 font-semibold">
              click to browse
            </span>
          </p>
          <p className="text-slate-500 text-xs font-body mt-3 flex items-center justify-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            PDF only · Max 5MB
          </p>
        </div>
      )}
    </div>
  );
};

const ProgressBar = ({ progress, fileName }) => (
  <div className="card-glass p-5 rounded-2xl space-y-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="#f87171"
            className="w-4 h-4"
          >
            <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
            <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
          </svg>
        </div>
        <div>
          <p className="text-white text-sm font-body font-medium truncate max-w-[200px]">
            {fileName}
          </p>
          <p className="text-slate-400 text-xs font-body">
            Uploading to Cloudinary...
          </p>
        </div>
      </div>
      <span className="text-brand-400 font-display font-bold text-sm tabular-nums">
        {progress}%
      </span>
    </div>

    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

const ResumeCard = ({ resume, onDelete, deleting, onView, viewing }) => (
  <div className="card-glass rounded-2xl overflow-hidden">
    {/* Header strip */}
    <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-indigo-400" />

    <div className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="#f87171"
              className="w-5 h-5"
            >
              <path d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625z" />
              <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-white font-display font-semibold text-sm truncate max-w-[220px] sm:max-w-none">
              {resume.originalFileName}
            </p>
            <p className="text-slate-400 text-xs font-body mt-0.5">
              {formatFileSize(resume.fileSize)}
            </p>
          </div>
        </div>

        {/* Badge */}
        <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-body font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active
        </span>
      </div>

      {/* Meta */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <p className="text-slate-500 text-xs font-body uppercase tracking-wider">
            Uploaded
          </p>
          <p className="text-slate-300 text-sm font-body mt-0.5">
            {formatDate(resume.uploadedAt)}
          </p>
        </div>
        <div>
          <p className="text-slate-500 text-xs font-body uppercase tracking-wider">
            Resume ID
          </p>
          <p className="text-slate-400 text-xs font-mono mt-0.5 truncate">
            {resume.id}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={onView}
          disabled={viewing}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500
            text-white text-sm font-display font-semibold py-2.5 px-4 rounded-xl transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-brand-500/50
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {viewing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
              />
            </svg>
          )}
          {viewing ? "Opening..." : "View Resume"}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center justify-center gap-2 border border-red-500/30 hover:bg-red-500/10
            text-red-400 text-sm font-body py-2.5 px-4 rounded-xl transition-all duration-200
            focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deleting ? (
            <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
          )}
          Delete
        </button>
      </div>
    </div>
  </div>
);

const Toast = ({ toast }) => {
  if (!toast) return null;
  const isSuccess = toast.type === "success";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-start gap-3 px-4 py-3.5 rounded-xl border shadow-2xl
      max-w-sm animate-fade-up transition-all
      ${
        isSuccess
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-red-500/10 border-red-500/30 text-red-300"
      }`}
    >
      {isSuccess ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 shrink-0 mt-0.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-5 h-5 shrink-0 mt-0.5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      )}
      <p className="text-sm font-body">{toast.message}</p>
    </div>
  );
};

// ─── Main Page ───────────────────────────────────────────────────────────────
const ResumeUpload = () => {
  const { user, logout } = useAuth();
  const [resume, setResume] = useState(null);
  const [loadingResume, setLoadingResume] = useState(true);

  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  const [deleting, setDeleting] = useState(false);
  const [viewing, setViewing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch existing resume on mount
  useEffect(() => {
    const fetchResume = async () => {
      try {
        const data = await getResume();
        setResume(data.resume);
      } catch {
        // 404 means no resume yet — that's fine
      } finally {
        setLoadingResume(false);
      }
    };
    fetchResume();
  }, []);

  const handleFileSelect = async (file) => {
    if (!file) return;

    // Client-side validation
    if (file.type !== "application/pdf") {
      showToast("Only PDF files are allowed.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("File exceeds 5MB limit. Please compress your PDF.", "error");
      return;
    }

    setSelectedFile(file);
    setUploading(true);
    setUploadProgress(0);

    try {
      const data = await uploadResume(file, setUploadProgress);
      setResume(data.resume);
      showToast("Resume uploaded successfully!", "success");
    } catch (err) {
      showToast(
        err.response?.data?.message || "Upload failed. Please try again.",
        "error",
      );
    } finally {
      setUploading(false);
      setSelectedFile(null);
      setUploadProgress(0);
    }
  };

  const handleViewResume = async () => {
    setViewing(true);
    try {
      const response = await api.get("/resume/view", { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      // Revoke after a delay to allow the tab to load
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      showToast("Failed to open resume. Please try again.", "error");
    } finally {
      setViewing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your resume?")) return;
    setDeleting(true);
    try {
      await deleteResume();
      setResume(null);
      showToast("Resume deleted.", "success");
    } catch {
      showToast("Failed to delete resume. Try again.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-mesh noise">
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-brand-700/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      <NavBar user={user} onLogout={logout} />

      <main className="max-w-5xl mx-auto px-6 py-10 relative z-10">
        {/* Page header */}
        <div className="mb-10 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="#818cf8"
              className="w-3.5 h-3.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
            <span className="text-brand-300 text-xs font-body font-medium">
              Resume Manager
            </span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white">
            Your Resume
          </h1>
          <p className="text-slate-400 font-body text-sm mt-2 max-w-lg">
            Upload your latest resume. Our AI will analyze it to personalize
            your mock interview questions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left: Upload panel */}
          <div
            className="lg:col-span-3 space-y-4 animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="card-glass rounded-2xl p-6">
              <h2 className="font-display text-base font-semibold text-white mb-1">
                {resume ? "Replace Resume" : "Upload Resume"}
              </h2>
              <p className="text-slate-400 text-xs font-body mb-5">
                {resume
                  ? "Uploading a new file will replace the existing one."
                  : "Drag & drop or click to select your PDF resume."}
              </p>

              <UploadZone
                onFileSelect={handleFileSelect}
                isDragging={isDragging}
                setIsDragging={setIsDragging}
                uploading={uploading}
              />

              {/* Progress */}
              {uploading && selectedFile && (
                <div className="mt-4">
                  <ProgressBar
                    progress={uploadProgress}
                    fileName={selectedFile.name}
                  />
                </div>
              )}
            </div>

            {/* Requirements card */}
            <div className="card-glass rounded-2xl p-5">
              <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Requirements
              </p>
              <ul className="space-y-2">
                {[
                  { icon: "✓", text: "PDF format only" },
                  { icon: "✓", text: "Maximum file size: 5MB" },
                  { icon: "✓", text: "Only one resume stored at a time" },
                  {
                    icon: "✓",
                    text: "Uploading a new file replaces the old one",
                  },
                ].map((item) => (
                  <li
                    key={item.text}
                    className="flex items-center gap-2.5 text-sm font-body text-slate-400"
                  >
                    <span className="text-emerald-400 font-bold text-xs">
                      {item.icon}
                    </span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Current resume / empty state */}
          <div
            className="lg:col-span-2 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            <h2 className="font-display text-base font-semibold text-white mb-3">
              Current Resume
            </h2>

            {loadingResume ? (
              <div className="card-glass rounded-2xl p-10 flex flex-col items-center gap-3">
                <div className="w-7 h-7 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-body">Loading...</p>
              </div>
            ) : resume ? (
              <ResumeCard
                resume={resume}
                onDelete={handleDelete}
                deleting={deleting}
                onView={handleViewResume}
                viewing={viewing}
              />
            ) : (
              <div className="card-glass rounded-2xl p-10 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.2}
                    stroke="#475569"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-display font-semibold text-sm">
                    No resume uploaded
                  </p>
                  <p className="text-slate-500 text-xs font-body mt-1">
                    Upload a PDF from the left panel
                  </p>
                </div>
              </div>
            )}

            {/* How it works */}
            <div className="mt-4 card-glass rounded-2xl p-5">
              <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wider mb-3">
                How it works
              </p>
              <ol className="space-y-3">
                {[
                  "Upload your PDF resume",
                  "AI parses your skills & experience",
                  "Get personalized interview questions",
                  "Practice and get real-time feedback",
                ].map((step, i) => (
                  <li key={step} className="flex items-start gap-3">
                    <span
                      className="w-5 h-5 rounded-full bg-brand-600/30 border border-brand-500/30 text-brand-400
                      font-display font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5"
                    >
                      {i + 1}
                    </span>
                    <p className="text-slate-400 text-sm font-body">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </main>

      <Toast toast={toast} />
    </div>
  );
};

export default ResumeUpload;
