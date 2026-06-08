import { Navigate, Route, Routes } from "react-router-dom";

import Splash from "../pages/auth/Splash";
import Onboarding from "../pages/auth/Onboarding";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";

import Home from "../pages/shared/Home";
import Departments from "../pages/shared/Departments";
import DepartmentDetails from "../pages/shared/DepartmentDetails";
import Notices from "../pages/shared/Notices";
import CampusMap from "../pages/shared/CampusMap";
import Emergency from "../pages/shared/Emergency";
import Guidelines from "../pages/shared/Guidelines";
import Profile from "../pages/shared/Profile";

import Complaint from "../pages/student/Complaint";
import ComplaintTracking from "../pages/student/ComplaintTracking";

import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import TeacherManagePage from "../pages/teacher/TeacherManagePage";

import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminManagePage from "../pages/admin/AdminManagePage";

import ProtectedRoute from "../components/layout/ProtectedRoute";
import RoleRoute from "../components/layout/RoleRoute";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/splash" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments"
        element={
          <ProtectedRoute>
            <Departments />
          </ProtectedRoute>
        }
      />

      <Route
        path="/departments/:id"
        element={
          <ProtectedRoute>
            <DepartmentDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notices"
        element={
          <ProtectedRoute>
            <Notices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/map"
        element={
          <ProtectedRoute>
            <CampusMap />
          </ProtectedRoute>
        }
      />

      <Route
        path="/emergency"
        element={
          <ProtectedRoute>
            <Emergency />
          </ProtectedRoute>
        }
      />

      <Route
        path="/guidelines"
        element={
          <ProtectedRoute>
            <Guidelines />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complaint"
        element={
          <RoleRoute roles={["student"]}>
            <Complaint />
          </RoleRoute>
        }
      />

      <Route
        path="/complaint-tracking"
        element={
          <RoleRoute roles={["student"]}>
            <ComplaintTracking />
          </RoleRoute>
        }
      />

      <Route
        path="/teacher"
        element={
          <RoleRoute roles={["teacher"]}>
            <TeacherDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/teacher/manage/:type"
        element={
          <RoleRoute roles={["teacher"]}>
            <TeacherManagePage />
          </RoleRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <RoleRoute roles={["super_admin"]}>
            <AdminDashboard />
          </RoleRoute>
        }
      />

      <Route
        path="/admin/manage/:type"
        element={
          <RoleRoute roles={["super_admin"]}>
            <AdminManagePage />
          </RoleRoute>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}