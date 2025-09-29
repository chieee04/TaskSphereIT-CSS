import { useState, useEffect} from "react";
import { useLocation } from "react-router-dom";

import Sidebar from "../Sidebar";
import Teams from "./Teams";
import Schedule from "./Schedule";
import ScheduleAdmin from "./Schedule";
import StudentCredentials from "./StudentCredentials";
import AdviserCredentials from "./AdviserCredentials";
import Enroll from "./Enroll-Member";
import Adviser from "./Adviser-Enroll";
import TitleDefense from "./TitleDefense";
import ManuScript from "./ManuScript";
import OralDefense from "./OralDefense";
import Profile from "../Profile";
import RoleTransfer from "./RolesTransfer";
import FinalDefense from "./FinalDefense";
const InstructorDashboard = () => {
  const location = useLocation();  // ⬅️ Add this
  const [activePage, setActivePage] = useState("Dashboard");
useEffect(() => {
  if (location.state?.activePage) {
    setActivePage(location.state.activePage);
  }
}, [location.state]);

  const renderContent = () => {
    switch (activePage) {
      
        case "Students":
        return <Enroll/>;
        case "Advisers":
        return <Adviser />;
      case "Teams":
        return <Teams />;
      case "Schedule":
        return <Schedule setActivePage={setActivePage} />;
      case "Title Defense":
        return <TitleDefense />;
      case "ManuScript":
        return <ManuScript />;
        case "Oral Defense":
        return <OralDefense />;
      case "StudentCredentials":
        return <StudentCredentials />;
      case "AdviserCredentials":
        return <AdviserCredentials />;
      case "Profile":
        return <Profile/>;
        case "Role Transfer":
        return <RoleTransfer/>;
        case "Final Defense":
        return <FinalDefense/>;
        

      default:
        return <h4 className="text-center text-muted">INSTRUCTOR DASHBOARD</h4>;
    }
  };
  return (
    <div className="d-flex">
      <Sidebar activeItem={activePage} onSelect={setActivePage} />
      <div className="flex-grow-1 p-3">
        {renderContent()}
      </div>
    </div>
  );
};

export default InstructorDashboard;