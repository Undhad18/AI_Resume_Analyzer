import {
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";

import MainLayout from "../layouts/MainLayout";

import Dashboard from "../pages/dashboard/Dashboard";

import Login from "../pages/auth/Login";

const AppRoutes = () => {

  return (
    <Routes>

      {/* Public Routes */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>

        <Route element={<MainLayout />}>

          <Route
            path="/dashboard"
            element={<Dashboard />}
          />

          <Route
            path="/resumes"
            element={<Placeholder title="My Resumes" />}
          />

          <Route
            path="/history"
            element={<Placeholder title="Analysis History" />}
          />

          <Route
            path="/settings"
            element={<Placeholder title="Settings" />}
          />

        </Route>

      </Route>

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />

    </Routes>
  );
};

const Placeholder = ({ title }) => (
  <div className="bg-white rounded-xl border p-8">
    <h1 className="text-2xl font-bold">{title}</h1>
    <p className="text-slate-500 mt-2">
      This module will be implemented in upcoming lessons.
    </p>
  </div>
);

export default AppRoutes;