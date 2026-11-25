import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/dashboard/Dashboard";
import Profile from "../pages/dashboard/Profile";
import UploadResume from "../pages/dashboard/UploadResume";
import MyResumes from "../pages/dashboard/MyResumes";
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/register"
        element={<Register />}
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Main Dashboard */}
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          {/* Core Feature Routes */}
          <Route
            path="/resumes"
            element={<MyResumes />}
          />

          <Route
            path="/upload"
            element={<UploadResume />}
          />

          <Route
            path="/resume-analysis"
            element={<Placeholder title="Resume Analysis" description="Deep dive into ATS compatibility, scoring metrics, and improvement suggestions." />}
          />

          <Route
            path="/job-matching"
            element={<Placeholder title="Job Description Matching" description="Match your resume against specific job requirements to optimize keyword alignment." />}
          />

          <Route
            path="/history"
            element={<Placeholder title="Analysis History" description="Audit past resume scans, score progressions, and historical feedback." />}
          />

          {/* Alias for history route */}
          <Route
            path="/analysis-history"
            element={<Placeholder title="Analysis History" description="Audit past resume scans, score progressions, and historical feedback." />}
          />

          <Route
            path="/builder"
            element={<Placeholder title="Resume Builder" description="Create an ATS-friendly, professionally structured resume directly in the browser." />}
          />

          {/* User Account & Preference Routes */}
          <Route
            path="/profile"
            element={<Profile />}
          />

          <Route
            path="/settings"
            element={<Placeholder title="Settings" description="Configure application preferences, security settings, and notifications." />}
          />

          {/* Aliases for nested /dashboard/* routes */}
          <Route
            path="/dashboard/resumes"
            element={<Navigate to="/resumes" replace />}
          />
          <Route
            path="/dashboard/upload"
            element={<Navigate to="/upload" replace />}
          />
          <Route
            path="/dashboard/analysis"
            element={<Navigate to="/resume-analysis" replace />}
          />
          <Route
            path="/dashboard/job-matching"
            element={<Navigate to="/job-matching" replace />}
          />
          <Route
            path="/dashboard/history"
            element={<Navigate to="/history" replace />}
          />
          <Route
            path="/dashboard/profile"
            element={<Navigate to="/profile" replace />}
          />
          <Route
            path="/dashboard/settings"
            element={<Navigate to="/settings" replace />}
          />
        </Route>
      </Route>

      {/* Root redirect */}
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      {/* Fallback route */}
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
};

const Placeholder = ({ title, description }) => (
  <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-xs max-w-4xl mx-auto text-center">
    <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
      <span className="font-bold text-lg">{title.slice(0, 2).toUpperCase()}</span>
    </div>
    <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
    <p className="text-slate-500 mt-2 max-w-md mx-auto text-sm sm:text-base">
      {description || "This feature is planned for implementation in subsequent lessons."}
    </p>
    <div className="mt-6 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
      <span>Module In Progress</span>
    </div>
  </div>
);

export default AppRoutes;
