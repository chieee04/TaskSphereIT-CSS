import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signin from "./components/Signin";
import ForgotPassword from "./components/Instructor/ForgotPassword";


import InstructorDashboard from "./components/Instructor/InstructorDashboard";
import ManagerDashboard from "./components/ProjectManager/ManagerDashboard";
import MemberDashboard from "./components/Member/MemberDashboard";
import AdviserDashboard from "./components/CapstoneAdviser/AdviserDashboard";

export const router = createBrowserRouter([

  {
    path: "/",
    element: <App />,   //Para Static yung Header + Footer
    children: [
      { index: true, element: <Signin /> }, // ito ang unang lalabas (default)
      { path: "/Signin", element: <Signin /> },

  //-----------------------------------------------------------
  //-----------------------------------------------------------

{ path: "/ForgotPassword", element: <ForgotPassword /> },
  
  //dashboard
  { path: "/Manager", element: <ManagerDashboard /> },
  { path: "/Manager/:subPage", element: <ManagerDashboard /> },

  { path: "/Member", element: <MemberDashboard /> },
  { path: "/Member/:subPage", element: <MemberDashboard /> },

  { path: "/Adviser", element: <AdviserDashboard /> },
  { path: "/Adviser/:subPage", element: <AdviserDashboard /> },
  
  { path: "/Instructor", element: <InstructorDashboard /> },
  { path: "/Instructor/:subPage", element: <InstructorDashboard /> },

    ],
  },
]);
