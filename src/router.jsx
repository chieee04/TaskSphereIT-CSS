import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "./App";
import Signin from "./components/Signin";
import ForgotPassword from "./components/Instructor/ForgotPassword";

import InstructorDashboard from "./components/Instructor/InstructorDashboard";
import ManagerDashboard from "./components/ProjectManager/ManagerDashboard";
import MemberDashboard from "./components/Member/MemberDashboard";
import AdviserDashboard from "./components/CapstoneAdviser/AdviserDashboard";
import ProtectedRoute from "./components/protectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Signin /> },
      { path: "/Signin", element: <Signin /> },
      { path: "/ForgotPassword", element: <ForgotPassword /> },

      // 🔐 PROTECTED DASHBOARDS
      {
        path: "/Manager",
        element: (
          <ProtectedRoute allowedRoles={[1]}>
            <ManagerDashboard />
          </ProtectedRoute>
        ),
      },
      { path: "/Manager/:subPage", element: (
          <ProtectedRoute allowedRoles={[1]}>
            <ManagerDashboard />
          </ProtectedRoute>
        ),
      },

      {
        path: "/Member",
        element: (
          <ProtectedRoute allowedRoles={[2]}>
            <MemberDashboard />
          </ProtectedRoute>
        ),
      },
      { path: "/Member/:subPage", element: (
          <ProtectedRoute allowedRoles={[2]}>
            <MemberDashboard />
          </ProtectedRoute>
        ),
      },

      {
        path: "/Adviser",
        element: (
          <ProtectedRoute allowedRoles={[3]}>
            <AdviserDashboard />
          </ProtectedRoute>
        ),
      },
      { path: "/Adviser/:subPage", element: (
          <ProtectedRoute allowedRoles={[3]}>
            <AdviserDashboard />
          </ProtectedRoute>
        ),
      },

      {
        path: "/Instructor",
        element: (
          <ProtectedRoute allowedRoles={[4]}>
            <InstructorDashboard />
          </ProtectedRoute>
        ),
      },
      { path: "/Instructor/:subPage", element: (
          <ProtectedRoute allowedRoles={[4]}>
            <InstructorDashboard />
          </ProtectedRoute>
        ),
      },

      // 🧱 CATCH-ALL: Redirect all invalid routes to /Signin
      {
        path: "*",
        element: <Navigate to="/Signin" replace />,
      },
    ],
  },
]);
