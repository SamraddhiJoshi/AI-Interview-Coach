import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./pages/ResumeUpload";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewSession from "./pages/InterviewSession";
import InterviewResults from "./pages/InterviewResults";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <ResumeUpload />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview/setup"
            element={
              <ProtectedRoute>
                <InterviewSetup />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview/:id"
            element={
              <ProtectedRoute>
                <InterviewSession />
              </ProtectedRoute>
            }
          />

          <Route
            path="/interview/results/:id"
            element={
              <ProtectedRoute>
                <InterviewResults />
              </ProtectedRoute>
            }
          />

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
