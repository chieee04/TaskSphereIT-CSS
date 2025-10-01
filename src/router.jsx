import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signin from "./components/Signin";

//IT INSTRUCTOR
import Adviser from "./components/Instructor/Adviser-Enroll";
import Enroll from "./components/Instructor/Enroll-Member";
import AdviserCredentials from "./components/Instructor/AdviserCredentials";
import StudentCredentials from "./components/Instructor/StudentCredentials";
import Teams from "./components/Instructor/Teams";
import Schedule from "./components/Instructor/Schedule";
// CAPSTONE ADVISER
import AdviserTask from "./components/CapstoneAdviser/AdviserTask/AdviserTask";
  //import ManagerTitleCreate from "./components/ProjectManager/ManagerTask/ManagerTitl

//MEMBER
import MemberAdviserTasks from "./components/Member/MemberAdviserTasks";
import MemberAllocation from "./components/Member/MemberAllocation";

import MemberTask from "./components/Member/MemberTask";


// DASHBOARD INTERFACE
import InstructorDashboard from "./components/Instructor/InstructorDashboard";
import ManagerDashboard from "./components/ProjectManager/ManagerDashboard";
import MemberDashboard from "./components/Member/MemberDashboard";
import AdviserDashboard from "./components/CapstoneAdviser/AdviserDashboard";
import AdviserFinalRedefTask from "./components/CapstoneAdviser/AdviserTask/AdviserFinalRedefTask";

export const router = createBrowserRouter([


  {
    path: "/",
    element: <App />,   //Para Static yung Header + Footer
    children: [
      { index: true, element: <Signin /> }, // ito ang unang lalabas (default)
      { path: "/Signin", element: <Signin /> },

  //-----------------------------------------------------------
  //-----------------------------------------------------------

  //IT INSTRUCTOR 
  { path: "/InstructorDashboard", element: <InstructorDashboard /> },
  { path: "/Student-Credentials", element: <StudentCredentials /> },
  { path: "/Adviser-Credentials", element: <AdviserCredentials /> },
  { path: "/Adviser-Enroll", element: <Adviser /> },
  { path: "/Student-Enroll", element: <Enroll /> },
  { path: "/Teams", element: <Teams /> },
  //SCHEDULE
  { path: "title-defense", element: <Schedule /> },
    //SCHEDULE

  //-----------------------------------------------------------
  //Manager

  //-----------------------------------------------------------
  //adviser
  { path: "/AdviserTask", element: <AdviserTask /> },
  //{ path: "/AdviserTask/AdviserOralDef", element: <AdviserOralDef /> },
  

  //MEMBER
  { path: "/MemberAdviserTasks", element: <MemberAdviserTasks /> },
  { path: "/MemberAllocation", element: <MemberAllocation /> },
  { path: "/MemberTask", element: <MemberTask /> },
{ path: "Final Re Defense", element: <AdviserFinalRedefTask /> },
  
  //
  

  //dashboard
  { path: "/ManagerDashboard", element: <ManagerDashboard /> },
  { path: "/MemberDashboard", element: <MemberDashboard /> },
  { path: "/AdviserDashboard", element: <AdviserDashboard /> },

    ],
  },
]);
