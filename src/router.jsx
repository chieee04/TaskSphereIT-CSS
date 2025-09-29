import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Signin from "./components/Signin";
import Dashboard from "./components/Dashboard";

//IT INSTRUCTOR
import Adviser from "./components/Instructor/Adviser-Enroll";
import Enroll from "./components/Instructor/Enroll-Member";
import AdviserCredentials from "./components/Instructor/AdviserCredentials";
import StudentCredentials from "./components/Instructor/StudentCredentials";
import Teams from "./components/Instructor/Teams";
import Schedule from "./components/Instructor/Schedule";
  import FinalDefense from "./components/Instructor/FinalDefense";
  import ManuScript from "./components/Instructor/ManuScript";
  import OralDefense from "./components/Instructor/OralDefense";
  import TitleDefense from "./components/Instructor/TitleDefense";
// CAPSTONE ADVISER
import AdviserTask from "./components/CapstoneAdviser/AdviserTask/AdviserTask";
import AdviserOralDef from "./components/CapstoneAdviser/AdviserTask/AdviserOralDef";
import AdviserFinalDef from "./components/CapstoneAdviser/AdviserTask/AdviserFinalDef";
//PROJECT MANAGER
//import ManagerTask from "./components/ProjectManager/ManagerTask/ManagerTask";
  import ManagerFinalDefense from "./components/ProjectManager/ManagerTask/ManagerFinalDefense";
  import ManagerOralDefense from "./components/ProjectManager/ManagerTask/ManagerOralDefense";
  import ManagerTitleDefense from "./components/ProjectManager/ManagerTask/ManagerTitleDefense";
  //import ManagerTitleCreate from "./components/ProjectManager/ManagerTask/ManagerTitleCreate";
import ManagerTaskRecord from "./components/ProjectManager/ManagerTaskRecord/ManagerTaskRecord";
  import ManagerFinalRecord from "./components/ProjectManager/ManagerTaskRecord/ManagerFinalRecord";
  import ManagerOralRecord from "./components/ProjectManager/ManagerTaskRecord/ManagerOralRecord";
  import ManagerTitleRecord from "./components/ProjectManager/ManagerTaskRecord/ManagerTitleRecord";
import ManagerTaskBoard from "./components/ProjectManager/ManagerTaskBoard/ManagerTaskBoard";
  import ManagerTaskBoardAttach from "./components/ProjectManager/ManagerTaskBoard/ManagerTaskBoardAttach";
  import ManagerTaskBoardView from "./components/ProjectManager/ManagerTaskBoard/ManagerTaskBoardView";
import ManagerAdviserTask from "./components/ProjectManager/ManagerAdviserTask";

//MEMBER
import MemberAdviserTasks from "./components/Member/MemberAdviserTasks";
import MemberAllocation from "./components/Member/MemberAllocation";
import MemberEvents from "./components/Member/MemberEvents";
import MemberFinalDefense from "./components/Member/MemberFinalDefense";
import MemberOralDefense from "./components/Member/MemberOralDefense";
import MemberTitleDefense from "./components/Member/MemberTitleDefense";
import MemberTask from "./components/Member/MemberTask";
import MemberTaskRecord from "./components/Member/MemberTaskRecord";
import MemberTaskBoard from "./components/Member/MemberTaskBoard";


// DASHBOARD INTERFACE
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
  //
  

  //dashboard
  { path: "/ManagerDashboard", element: <ManagerDashboard /> },
  { path: "/MemberDashboard", element: <MemberDashboard /> },
  { path: "/AdviserDashboard", element: <AdviserDashboard /> },

    ],
  },
]);
